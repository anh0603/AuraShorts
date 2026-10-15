"""
Groq Cloud Adapter (High Speed, Free Tier Llama 3 70B & 8B).
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


class GroqAdapter(BaseAiAdapter):

    def __init__(self, config: AiProviderConfig):
        super().__init__(config)
        self.base_url = config.base_url.rstrip("/") or "https://api.groq.com/openai/v1"
        self.default_model = "llama-3.3-70b-versatile"

    async def test_connection(self) -> Tuple[bool, str, int]:
        if not self.config.api_key:
            return False, "Thiếu Groq API Key trong cấu hình.", 0

        start_time = time.time()
        headers = {
            "Authorization": f"Bearer {self.config.api_key}",
            "Content-Type": "application/json"
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(f"{self.base_url}/models", headers=headers)
                latency_ms = int((time.time() - start_time) * 1000)

                if res.status_code == 200:
                    models_count = len(res.json().get("data", []))
                    return True, f"Kết nối Groq Cloud thành công! Tìm thấy {models_count} models ({latency_ms}ms).", latency_ms
                elif res.status_code in (401, 403):
                    return False, f"Lỗi xác thực Groq API Key (HTTP {res.status_code}): Key không hợp lệ hoặc đã hết hạn.", latency_ms
                elif res.status_code == 429:
                    return False, f"Groq Cloud Rate Limit (HTTP 429): Quota tạm thời bị giới hạn.", latency_ms
                else:
                    return False, f"Groq trả về mã lỗi HTTP {res.status_code}: {res.text[:100]}", latency_ms

        except httpx.TimeoutException:
            return False, "Kết nối tới Groq Cloud bị timeout sau 10s.", int((time.time() - start_time) * 1000)
        except Exception as e:
            return False, f"Lỗi kết nối mạng tới Groq: {str(e)}", int((time.time() - start_time) * 1000)

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
            raise AuthenticationError("Thiếu Groq API Key trong cấu hình.", self.config.id)

        target_model = model_id or self.default_model
        headers = {
            "Authorization": f"Bearer {self.config.api_key}",
            "Content-Type": "application/json"
        }

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        payload: Dict[str, Any] = {
            "model": target_model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }

        if json_schema:
            payload["response_format"] = {"type": "json_object"}

        start_time = time.time()
        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                res = await client.post(f"{self.base_url}/chat/completions", headers=headers, json=payload)
                duration_ms = int((time.time() - start_time) * 1000)

                if res.status_code == 200:
                    data = res.json()
                    content = data["choices"][0]["message"]["content"]
                    usage = data.get("usage", {})
                    return content, {
                        "provider_id": self.config.id,
                        "model_id": target_model,
                        "duration_ms": duration_ms,
                        "tokens_in": usage.get("prompt_tokens"),
                        "tokens_out": usage.get("completion_tokens"),
                        "cost_usd": 0.0  # Free tier
                    }
                elif res.status_code == 429:
                    retry_after = res.headers.get("retry-after")
                    raise RateLimitError(
                        f"Groq Rate Limit exceeded (HTTP 429): {res.text[:100]}",
                        self.config.id,
                        retry_after_seconds=int(retry_after) if retry_after and retry_after.isdigit() else 10
                    )
                elif res.status_code in (401, 403):
                    raise AuthenticationError(f"Groq Auth Error (HTTP {res.status_code}): {res.text[:100]}", self.config.id)
                else:
                    raise ProviderNetworkError(f"Groq API Error (HTTP {res.status_code}): {res.text[:100]}", self.config.id)

        except httpx.TimeoutException:
            raise ProviderNetworkError(f"Groq request timed out after {timeout}s", self.config.id)
        except (RateLimitError, AuthenticationError, ProviderNetworkError):
            raise
        except Exception as e:
            raise ProviderNetworkError(f"Network error calling Groq: {str(e)}", self.config.id)

    async def discover_models(self) -> List[Dict[str, Any]]:
        if not self.config.api_key:
            return []

        headers = {"Authorization": f"Bearer {self.config.api_key}"}
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(f"{self.base_url}/models", headers=headers)
                if res.status_code == 200:
                    data = res.json().get("data", [])
                    return [
                        {
                            "id": m.get("id"),
                            "display_name": m.get("id"),
                            "context_limit": f"{m.get('context_window', 8192)} tokens",
                            "capabilities": ["text_generation", "structured_output"]
                        }
                        for m in data if "whisper" not in m.get("id", "")
                    ]
        except Exception:
            pass
        return []
