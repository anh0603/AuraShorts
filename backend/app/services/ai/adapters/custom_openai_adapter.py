"""
Custom OpenAI-Compatible Adapter with SSRF Protection.
Ref: PROJECT.md Section V.18 & V.22
"""

import time
import urllib.parse
import ipaddress
import socket
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


def validate_url_against_ssrf(url_str: str) -> bool:
    """
    Enforces SSRF filtering:
    - Blocks AWS/GCP/Azure metadata (169.254.169.254).
    - Blocks private internal subnets (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 0.0.0.0/8).
    - Requires HTTPS or localhost for dev.
    """
    try:
        parsed = urllib.parse.urlparse(url_str)
        if parsed.scheme not in ("http", "https"):
            return False

        hostname = parsed.hostname
        if not hostname:
            return False

        # Allow localhost / 127.0.0.1 for local Ollama / vLLM in development
        if hostname in ("localhost", "127.0.0.1", "::1"):
            return True

        # Resolve hostname to IP to prevent DNS rebinding
        try:
            ip = ipaddress.ip_address(socket.gethostbyname(hostname))
        except Exception:
            return False

        # Disallow private and link-local ranges
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved or ip.is_multicast:
            return False

        # Must be HTTPS for external hosts
        if parsed.scheme != "https":
            return False

        return True
    except Exception:
        return False


class CustomOpenAiAdapter(BaseAiAdapter):

    def __init__(self, config: AiProviderConfig):
        super().__init__(config)
        self.base_url = config.base_url.rstrip("/")
        self.default_model = "default-model"

    async def test_connection(self) -> Tuple[bool, str, int]:
        if not validate_url_against_ssrf(self.base_url):
            return False, "Base URL không hợp lệ hoặc bị chặn bởi bộ lọc bảo mật SSRF (Metadata/Private Network).", 0

        start_time = time.time()
        headers = {"Content-Type": "application/json"}
        if self.config.api_key:
            headers["Authorization"] = f"Bearer {self.config.api_key}"

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(f"{self.base_url}/models", headers=headers)
                latency_ms = int((time.time() - start_time) * 1000)

                if res.status_code == 200:
                    models = res.json().get("data", [])
                    return True, f"Kết nối OpenAI-compatible thành công! ({latency_ms}ms, {len(models)} models).", latency_ms
                elif res.status_code in (401, 403):
                    return False, f"Lỗi xác thực API Key (HTTP {res.status_code}).", latency_ms
                elif res.status_code == 429:
                    return False, f"Rate Limit (HTTP 429).", latency_ms
                else:
                    return False, f"Endpoint trả về mã lỗi HTTP {res.status_code}.", latency_ms

        except httpx.TimeoutException:
            return False, "Kết nối bị timeout sau 10s.", int((time.time() - start_time) * 1000)
        except Exception as e:
            return False, f"Lỗi kết nối mạng: {str(e)}", int((time.time() - start_time) * 1000)

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
        if not validate_url_against_ssrf(self.base_url):
            raise AiProviderError("Base URL bị chặn bởi chính sách bảo mật SSRF.", self.config.id, is_retryable=False)

        target_model = model_id or self.default_model
        headers = {"Content-Type": "application/json"}
        if self.config.api_key:
            headers["Authorization"] = f"Bearer {self.config.api_key}"

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        payload = {
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
                        "cost_usd": None
                    }
                elif res.status_code == 429:
                    raise RateLimitError(f"Rate Limit (HTTP 429): {res.text[:100]}", self.config.id)
                elif res.status_code in (401, 403):
                    raise AuthenticationError(f"Auth Error (HTTP {res.status_code}): {res.text[:100]}", self.config.id)
                else:
                    raise ProviderNetworkError(f"API Error (HTTP {res.status_code}): {res.text[:100]}", self.config.id)

        except (RateLimitError, AuthenticationError, ProviderNetworkError):
            raise
        except Exception as e:
            raise ProviderNetworkError(f"Network error: {str(e)}", self.config.id)

    async def discover_models(self) -> List[Dict[str, Any]]:
        headers = {"Content-Type": "application/json"}
        if self.config.api_key:
            headers["Authorization"] = f"Bearer {self.config.api_key}"

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(f"{self.base_url}/models", headers=headers)
                if res.status_code == 200:
                    data = res.json().get("data", [])
                    return [
                        {
                            "id": m.get("id"),
                            "display_name": m.get("id"),
                            "context_limit": "32k tokens",
                            "capabilities": ["text_generation", "structured_output"]
                        }
                        for m in data
                    ]
        except Exception:
            pass
        return []
