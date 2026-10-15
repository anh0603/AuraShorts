"""
Google Gemini 1.5 Flash Adapter (Large Context, Free Tier).
Ref: PROJECT.md Section V.12
"""

import time
import httpx
from typing import Dict, Any, List, Optional, Tuple

from app.services.ai.adapters.base import (
    BaseAiAdapter,
    AiProviderError,
    RateLimitError,
    AuthenticationError,
    ProviderNetworkError
)
from app.services.ai.models import AiProviderConfig


class GeminiAdapter(BaseAiAdapter):

    def __init__(self, config: AiProviderConfig):
        super().__init__(config)
        self.base_url = config.base_url.rstrip("/") or "https://generativelanguage.googleapis.com/v1beta"
        self.default_model = "gemini-1.5-flash"

    async def test_connection(self) -> Tuple[bool, str, int]:
        if not self.config.api_key:
            return False, "Thiếu Gemini API Key trong cấu hình.", 0

        start_time = time.time()
        url = f"{self.base_url}/models?key={self.config.api_key}"

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(url)
                latency_ms = int((time.time() - start_time) * 1000)

                if res.status_code == 200:
                    models = res.json().get("models", [])
                    return True, f"Kết nối Gemini API thành công! Tìm thấy {len(models)} models ({latency_ms}ms).", latency_ms
                elif res.status_code in (400, 403):
                    return False, f"Lỗi xác thực Gemini API Key (HTTP {res.status_code}): Key không hợp lệ.", latency_ms
                elif res.status_code == 429:
                    return False, f"Gemini API Quota Limit (HTTP 429): Quota tạm thời bị giới hạn.", latency_ms
                else:
                    return False, f"Gemini trả về lỗi HTTP {res.status_code}: {res.text[:100]}", latency_ms

        except httpx.TimeoutException:
            return False, "Kết nối tới Gemini API bị timeout sau 10s.", int((time.time() - start_time) * 1000)
        except Exception as e:
            return False, f"Lỗi kết nối mạng tới Gemini: {str(e)}", int((time.time() - start_time) * 1000)

    async def generate_text(
        self,
        prompt: str,
        system_prompt: str = "",
        model_id: Optional[str] = None,
        json_schema: Optional[Dict[str, Any]] = None,
        temperature: float = 0.7,
        max_tokens: int = 1500,
        timeout: float = 30.0
    ) -> Tuple[str, Dict[str, Any]]:
        if not self.config.api_key:
            raise AuthenticationError("Thiếu Gemini API Key trong cấu hình.", self.config.id)

        target_model = model_id or self.default_model
        url = f"{self.base_url}/models/{target_model}:generateContent?key={self.config.api_key}"

        contents = []
        if system_prompt:
            prompt = f"{system_prompt}\n\nUser: {prompt}"

        contents.append({
            "role": "user",
            "parts": [{"text": prompt}]
        })

        generation_config: Dict[str, Any] = {
            "temperature": temperature,
            "maxOutputTokens": max_tokens
        }

        if json_schema:
            generation_config["responseMimeType"] = "application/json"

        payload = {
            "contents": contents,
            "generationConfig": generation_config
        }

        start_time = time.time()
        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                res = await client.post(url, json=payload)
                duration_ms = int((time.time() - start_time) * 1000)

                if res.status_code == 200:
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if not candidates:
                        raise ProviderNetworkError("Gemini returned empty candidates", self.config.id)

                    text_parts = candidates[0].get("content", {}).get("parts", [])
                    output_text = "".join(p.get("text", "") for p in text_parts)
                    usage = data.get("usageMetadata", {})

                    return output_text, {
                        "provider_id": self.config.id,
                        "model_id": target_model,
                        "duration_ms": duration_ms,
                        "tokens_in": usage.get("promptTokenCount"),
                        "tokens_out": usage.get("candidatesTokenCount"),
                        "cost_usd": 0.0  # Free tier
                    }
                elif res.status_code == 429:
                    raise RateLimitError(f"Gemini Rate Limit (HTTP 429): {res.text[:100]}", self.config.id)
                elif res.status_code in (400, 403):
                    raise AuthenticationError(f"Gemini Auth Error (HTTP {res.status_code}): {res.text[:100]}", self.config.id)
                else:
                    raise ProviderNetworkError(f"Gemini API Error (HTTP {res.status_code}): {res.text[:100]}", self.config.id)

        except httpx.TimeoutException:
            raise ProviderNetworkError(f"Gemini request timed out after {timeout}s", self.config.id)
        except (RateLimitError, AuthenticationError, ProviderNetworkError):
            raise
        except Exception as e:
            raise ProviderNetworkError(f"Network error calling Gemini: {str(e)}", self.config.id)

    async def discover_models(self) -> List[Dict[str, Any]]:
        if not self.config.api_key:
            return []

        url = f"{self.base_url}/models?key={self.config.api_key}"
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(url)
                if res.status_code == 200:
                    data = res.json().get("models", [])
                    return [
                        {
                            "id": m.get("name", "").replace("models/", ""),
                            "display_name": m.get("displayName", m.get("name")),
                            "context_limit": f"{m.get('inputTokenLimit', 32000)} tokens",
                            "capabilities": ["text_generation", "structured_output", "vision"]
                        }
                        for m in data if "gemini" in m.get("name", "")
                    ]
        except Exception:
            pass
        return []
