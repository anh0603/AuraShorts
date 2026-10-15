"""
Base Abstract Adapter for AI Providers.
Ref: PROJECT.md Section V.18, V.22 & docs/ARCHITECTURE.md
"""

import time
import abc
from typing import Dict, Any, List, Optional, Tuple
from app.services.ai.models import AiProviderConfig, AiCapability, mask_secret_key


class AiProviderError(Exception):
    def __init__(self, message: str, provider_id: str, is_retryable: bool = True, error_code: str = "AI_PROVIDER_ERROR"):
        super().__init__(message)
        self.provider_id = provider_id
        self.is_retryable = is_retryable
        self.error_code = error_code


class RateLimitError(AiProviderError):
    def __init__(self, message: str, provider_id: str, retry_after_seconds: Optional[int] = None):
        super().__init__(message, provider_id, is_retryable=True, error_code="RATE_LIMIT_EXCEEDED")
        self.retry_after_seconds = retry_after_seconds or 10


class AuthenticationError(AiProviderError):
    def __init__(self, message: str, provider_id: str):
        super().__init__(message, provider_id, is_retryable=False, error_code="AUTHENTICATION_FAILED")


class ProviderNetworkError(AiProviderError):
    def __init__(self, message: str, provider_id: str):
        super().__init__(message, provider_id, is_retryable=True, error_code="NETWORK_OR_TIMEOUT")


class BaseAiAdapter(abc.ABC):

    def __init__(self, config: AiProviderConfig):
        self.config = config

    @abc.abstractmethod
    async def test_connection(self) -> Tuple[bool, str, int]:
        """
        Sends lightweight health check probe.
        Returns: (success: bool, status_message: str, latency_ms: int)
        """
        pass

    @abc.abstractmethod
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
        """
        Executes text generation request.
        Returns: (output_text: str, usage_metadata: Dict[str, Any])
        """
        pass

    @abc.abstractmethod
    async def discover_models(self) -> List[Dict[str, Any]]:
        """Queries provider model catalog."""
        pass
