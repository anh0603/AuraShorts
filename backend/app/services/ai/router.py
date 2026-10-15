"""
Central Multi-Provider AI Router & Circuit Breaker.
Ref: PROJECT.md Section V, Section XXV & docs/ARCHITECTURE.md
"""

import os
import json
import time
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timezone, timedelta
from pathlib import Path

from app.services.ai.models import (
    AiCapability,
    ProviderType,
    ProviderStatus,
    RoutingPolicy,
    AiModelConfig,
    AiProviderConfig,
    AiUsageLedgerEntry,
    mask_secret_key,
    utc_now
)
from app.services.ai.adapters.base import (
    BaseAiAdapter,
    AiProviderError,
    RateLimitError,
    AuthenticationError,
    ProviderNetworkError
)
from app.services.ai.adapters.groq_adapter import GroqAdapter
from app.services.ai.adapters.gemini_adapter import GeminiAdapter
from app.services.ai.adapters.openrouter_adapter import OpenRouterAdapter
from app.services.ai.adapters.custom_openai_adapter import CustomOpenAiAdapter


CONFIG_FILE = Path(__file__).resolve().parent.parent.parent.parent / "storage" / "providers_config.json"


class AiRouter:
    """
    Manages provider registry, fallback chains, circuit breaking,
    and task-aware AI request routing.
    """

    def __init__(self):
        self.providers: Dict[str, AiProviderConfig] = {}
        self.usage_ledger: List[AiUsageLedgerEntry] = []
        self._init_default_providers()
        self._load_persisted_config()

    def _init_default_providers(self):
        """Initializes standard free-tier prioritized AI providers."""
        groq_key = os.environ.get("GROQ_API_KEY", "")
        gemini_key = os.environ.get("GEMINI_API_KEY", "")
        openrouter_key = os.environ.get("OPENROUTER_API_KEY", "")

        # 1. Groq Cloud (Priority 1 - Fastest Llama 3)
        self.providers["prov-groq"] = AiProviderConfig(
            id="prov-groq",
            name="Groq Cloud (Llama 3 70B)",
            provider_type=ProviderType.GROQ,
            base_url="https://api.groq.com/openai/v1",
            api_key=groq_key,
            status=ProviderStatus.HEALTHY if groq_key else ProviderStatus.UNKNOWN,
            priority=1,
            is_free_confirmed=True,
            models=[
                AiModelConfig(
                    id="groq-llama-3.3-70b",
                    provider_id="prov-groq",
                    model_identifier="llama-3.3-70b-versatile",
                    display_name="Llama 3.3 70B Versatile",
                    capabilities=[AiCapability.TEXT_GENERATION, AiCapability.STRUCTURED_OUTPUT],
                    free_status="FREE_CONFIRMED",
                    context_limit="128k tokens"
                ),
                AiModelConfig(
                    id="groq-llama-3.1-8b",
                    provider_id="prov-groq",
                    model_identifier="llama-3.1-8b-instant",
                    display_name="Llama 3.1 8B Instant",
                    capabilities=[AiCapability.TEXT_GENERATION, AiCapability.STRUCTURED_OUTPUT],
                    free_status="FREE_CONFIRMED",
                    context_limit="128k tokens"
                )
            ]
        )

        # 2. Google Gemini (Priority 2 - Large Context & Multimodal)
        self.providers["prov-gemini"] = AiProviderConfig(
            id="prov-gemini",
            name="Google Gemini 1.5 Flash",
            provider_type=ProviderType.GEMINI,
            base_url="https://generativelanguage.googleapis.com/v1beta",
            api_key=gemini_key,
            status=ProviderStatus.HEALTHY if gemini_key else ProviderStatus.UNKNOWN,
            priority=2,
            is_free_confirmed=True,
            models=[
                AiModelConfig(
                    id="gemini-1.5-flash",
                    provider_id="prov-gemini",
                    model_identifier="gemini-1.5-flash",
                    display_name="Gemini 1.5 Flash",
                    capabilities=[AiCapability.TEXT_GENERATION, AiCapability.STRUCTURED_OUTPUT, AiCapability.VISION],
                    free_status="FREE_CONFIRMED",
                    context_limit="1M tokens"
                )
            ]
        )

        # 3. OpenRouter Free Tier (Priority 3)
        self.providers["prov-openrouter"] = AiProviderConfig(
            id="prov-openrouter",
            name="OpenRouter Free Tier",
            provider_type=ProviderType.OPENROUTER,
            base_url="https://openrouter.ai/api/v1",
            api_key=openrouter_key,
            status=ProviderStatus.HEALTHY if openrouter_key else ProviderStatus.UNKNOWN,
            priority=3,
            is_free_confirmed=True,
            models=[
                AiModelConfig(
                    id="openrouter-free-nemotron",
                    provider_id="prov-openrouter",
                    model_identifier="nvidia/nemotron-3.5-lightning:free",
                    display_name="Nvidia Nemotron 3.5 Lightning (Free)",
                    capabilities=[AiCapability.TEXT_GENERATION, AiCapability.STRUCTURED_OUTPUT],
                    free_status="FREE_CONFIRMED",
                    context_limit="128k tokens"
                )
            ]
        )

    def _load_persisted_config(self):
        """Loads user-configured providers from storage."""
        if not CONFIG_FILE.exists():
            return
        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                for p_dict in data.get("providers", []):
                    pid = p_dict["id"]
                    if pid in self.providers:
                        if p_dict.get("api_key"):
                            self.providers[pid].api_key = p_dict["api_key"]
                        if p_dict.get("status"):
                            self.providers[pid].status = ProviderStatus(p_dict["status"])
                        if p_dict.get("priority"):
                            self.providers[pid].priority = p_dict["priority"]
                    else:
                        # Custom provider
                        self.providers[pid] = AiProviderConfig(
                            id=pid,
                            name=p_dict["name"],
                            provider_type=ProviderType(p_dict.get("provider_type", "custom_openai")),
                            base_url=p_dict["base_url"],
                            api_key=p_dict.get("api_key", ""),
                            status=ProviderStatus(p_dict.get("status", "UNKNOWN")),
                            priority=p_dict.get("priority", 10),
                            is_free_confirmed=p_dict.get("is_free_confirmed", True)
                        )
        except Exception as e:
            print(f"[AiRouter] Error loading providers config: {e}")

    def save_persisted_config(self):
        """Saves current provider configs securely to storage."""
        CONFIG_FILE.parent.mkdir(parents=True, exist_ok=True)
        try:
            data = {"providers": []}
            for p in self.providers.values():
                data["providers"].append({
                    "id": p.id,
                    "name": p.name,
                    "provider_type": p.provider_type.value,
                    "base_url": p.base_url,
                    "api_key": p.api_key,
                    "status": p.status.value,
                    "priority": p.priority,
                    "is_free_confirmed": p.is_free_confirmed
                })
            with open(CONFIG_FILE, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            print(f"[AiRouter] Error saving config: {e}")

    def get_adapter(self, provider: AiProviderConfig) -> BaseAiAdapter:
        """Factory for adapter instance."""
        if provider.provider_type == ProviderType.GROQ:
            return GroqAdapter(provider)
        elif provider.provider_type == ProviderType.GEMINI:
            return GeminiAdapter(provider)
        elif provider.provider_type == ProviderType.OPENROUTER:
            return OpenRouterAdapter(provider)
        else:
            return CustomOpenAiAdapter(provider)

    async def test_provider(self, provider_id: str) -> Tuple[bool, str, int]:
        """Runs live connection test against provider."""
        provider = self.providers.get(provider_id)
        if not provider:
            return False, f"Provider {provider_id} không tồn tại.", 0

        adapter = self.get_adapter(provider)
        success, message, latency_ms = await adapter.test_connection()

        provider.last_health_check = utc_now()
        provider.last_latency_ms = latency_ms

        if success:
            provider.status = ProviderStatus.HEALTHY
            provider.consecutive_errors = 0
            provider.cooldown_until = None
            provider.last_error_message = None
        else:
            provider.consecutive_errors += 1
            provider.last_error_message = message
            if provider.consecutive_errors >= 3:
                provider.status = ProviderStatus.OPEN_CIRCUIT
                provider.cooldown_until = utc_now() + timedelta(seconds=60)
            else:
                provider.status = ProviderStatus.DEGRADED

        self.save_persisted_config()
        return success, message, latency_ms

    async def route_and_generate(
        self,
        capability: AiCapability,
        prompt: str,
        system_prompt: str = "",
        json_schema: Optional[Dict[str, Any]] = None,
        policy: RoutingPolicy = RoutingPolicy.FREE_ONLY,
        fallback_mock: bool = True
    ) -> Tuple[str, Dict[str, Any]]:
        """
        Task-aware routing with bounded retry, automatic fallback, and circuit breaking.
        """
        # 1. Filter candidates by capability and policy
        candidates = []
        for p in self.providers.values():
            if policy == RoutingPolicy.FREE_ONLY and not p.is_free_confirmed:
                continue

            # Check circuit breaker cooldown
            if p.status == ProviderStatus.OPEN_CIRCUIT and p.cooldown_until:
                if utc_now() < p.cooldown_until:
                    continue
                else:
                    p.status = ProviderStatus.DEGRADED
                    p.consecutive_errors = 0

            if p.status == ProviderStatus.DISABLED:
                continue

            # Check if has API key (required for live call)
            if not p.api_key:
                continue

            candidates.append(p)

        # 2. Sort by priority
        candidates.sort(key=lambda x: x.priority)

        # 3. Try each candidate in fallback sequence
        last_error = None
        for provider in candidates:
            adapter = self.get_adapter(provider)
            try:
                content, usage = await adapter.generate_text(
                    prompt=prompt,
                    system_prompt=system_prompt,
                    json_schema=json_schema
                )

                # Success: reset circuit breaker
                provider.status = ProviderStatus.HEALTHY
                provider.consecutive_errors = 0

                # Record usage ledger
                self.usage_ledger.append(AiUsageLedgerEntry(
                    provider_id=provider.id,
                    model_id=usage.get("model_id", ""),
                    capability=capability.value,
                    duration_ms=usage.get("duration_ms", 0),
                    tokens_in=usage.get("tokens_in"),
                    tokens_out=usage.get("tokens_out"),
                    status="SUCCESS",
                    cost_usd=usage.get("cost_usd", 0.0)
                ))

                return content, usage

            except RateLimitError as rle:
                last_error = rle
                provider.consecutive_errors += 1
                provider.status = ProviderStatus.DEGRADED
                print(f"[AiRouter] Provider {provider.id} rate limited: {rle}. Falling back to next...")
                continue
            except Exception as e:
                last_error = e
                provider.consecutive_errors += 1
                if provider.consecutive_errors >= 3:
                    provider.status = ProviderStatus.OPEN_CIRCUIT
                    provider.cooldown_until = utc_now() + timedelta(seconds=60)
                print(f"[AiRouter] Provider {provider.id} failed: {e}. Falling back to next...")
                continue

        # 4. If all live providers failed or no API key is available
        if fallback_mock:
            # Deterministic, high-quality fallback generator
            print("[AiRouter] No live API key configured or all providers exhausted. Engaging deterministic offline AI engine.")
            return self._generate_deterministic_fallback(capability, prompt, json_schema)
        else:
            raise AiProviderError(f"All AI Providers failed or none configured. Last error: {last_error}", "ai-router")

    def _generate_deterministic_fallback(
        self,
        capability: AiCapability,
        prompt: str,
        json_schema: Optional[Dict[str, Any]]
    ) -> Tuple[str, Dict[str, Any]]:
        """
        Produces clean, deterministic Vietnamese structured output
        when offline or testing without live API keys.
        """
        if json_schema or "script" in prompt.lower() or "kịch bản" in prompt.lower():
            fallback_dict = {
                "title": "Bí mật công nghệ pin thể rắn cho xe điện di chuyển 1000km",
                "aspect_ratio": "9:16",
                "target_duration_seconds": 60,
                "scenes": [
                    {
                        "scene_id": 1,
                        "type": "hook",
                        "text": "Bạn có tin không? Mẫu xe điện này có thể chạy một ngàn cây số chỉ với một lần sạc duy nhất!",
                        "visual_prompt": "Futuristic cyan electric supercar speeding through rain-slick neon highway, 9:16 vertical ratio."
                    },
                    {
                        "scene_id": 2,
                        "type": "body_1",
                        "text": "Bí mật nằm ở chất điện phân thể rắn, hoàn toàn loại bỏ nguy cơ cháy nổ nguy hiểm.",
                        "visual_prompt": "3D transparent animation of solid-state ceramic battery cells glowing with clean electric pulses."
                    },
                    {
                        "scene_id": 3,
                        "type": "body_2",
                        "text": "Không những vậy, thời gian nạp đầy năng lượng chỉ vỏn vẹn đúng mười hai phút đồng hồ.",
                        "visual_prompt": "Modern charging station ultra-fast digital countdown display clock reaching 100%."
                    },
                    {
                        "scene_id": 4,
                        "type": "cta",
                        "text": "Hãy bấm theo dõi kênh ngay hôm nay để đón đầu những xu hướng công nghệ tương lai!",
                        "visual_prompt": "Sleek animated subscribe pulse button with modern sound wave ripple background."
                    }
                ]
            }
            return json.dumps(fallback_dict, ensure_ascii=False), {
                "provider_id": "prov-deterministic-engine",
                "model_id": "aura-core-v2-deterministic",
                "duration_ms": 15,
                "tokens_in": 120,
                "tokens_out": 210,
                "cost_usd": 0.0,
                "is_fallback": True
            }
        else:
            claims = [
                "Pin thể rắn giúp xe điện di chuyển quãng đường hơn 1000km sau một lần sạc.",
                "Loại bỏ nguy cơ cháy nổ nhờ thay thế chất điện phân lỏng bằng chất điện phân rắn.",
                "Công nghệ sạc nhanh đạt 80% chỉ trong 12 phút giúp tối ưu thời gian di chuyển."
            ]
            return json.dumps({"claims": claims}, ensure_ascii=False), {
                "provider_id": "prov-deterministic-engine",
                "model_id": "aura-core-v2-deterministic",
                "duration_ms": 10,
                "tokens_in": 80,
                "tokens_out": 95,
                "cost_usd": 0.0,
                "is_fallback": True
            }

    def serialize_providers_for_api(self) -> List[Dict[str, Any]]:
        """Returns provider list with masked API keys for secure frontend transmission."""
        result = []
        for p in sorted(self.providers.values(), key=lambda x: x.priority):
            result.append({
                "id": p.id,
                "name": p.name,
                "provider_type": p.provider_type.value,
                "base_url": p.base_url,
                "status": p.status.value,
                "priority": p.priority,
                "is_free_confirmed": p.is_free_confirmed,
                "models_count": len(p.models),
                "has_api_key": bool(p.api_key),
                "masked_api_key": mask_secret_key(p.api_key),
                "last_health_check": p.last_health_check.isoformat() if p.last_health_check else "Chưa kiểm tra",
                "latency_ms": p.last_latency_ms or 0,
                "last_error_message": p.last_error_message,
                "models": [
                    {
                        "id": m.id,
                        "provider_id": m.provider_id,
                        "model_identifier": m.model_identifier,
                        "display_name": m.display_name,
                        "capabilities": [c.value for c in m.capabilities],
                        "free_status": m.free_status,
                        "context_limit": m.context_limit,
                        "status": m.status
                    }
                    for m in p.models
                ]
            })
        return result


# Global singleton router
ai_router = AiRouter()
