"""
API Router for AI Providers & Models Management.
Ref: PROJECT.md Section V.17, V.18, V.19 & docs/API_SPEC.md
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException, status

from app.schemas.orchestrator import ApiResponse
from app.services.ai.router import ai_router
from app.services.ai.models import (
    AiProviderConfig,
    ProviderType,
    ProviderStatus,
    AiCapability,
    mask_secret_key
)
from app.services.ai.adapters.custom_openai_adapter import validate_url_against_ssrf

router = APIRouter(prefix="/providers", tags=["AI Providers"])


class UpdateProviderRequest(BaseModel):
    api_key: Optional[str] = None
    priority: Optional[int] = None
    status: Optional[str] = None
    base_url: Optional[str] = None


class AddCustomProviderRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    base_url: str = Field(..., min_length=5)
    api_key: Optional[str] = ""
    priority: Optional[int] = 10
    is_free_confirmed: bool = True


@router.get("", response_model=ApiResponse)
def get_providers():
    """Lists all configured AI providers with masked API keys."""
    providers = ai_router.serialize_providers_for_api()
    return ApiResponse(success=True, data=providers)


@router.post("", response_model=ApiResponse, status_code=status.HTTP_201_CREATED)
def add_custom_provider(request: AddCustomProviderRequest):
    """
    Adds a custom OpenAI-compatible provider.
    Validates base_url against SSRF (blocks cloud metadata and unwhitelisted internal IPs).
    """
    if not validate_url_against_ssrf(request.base_url):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "SSRF_VALIDATION_FAILED",
                "message": "Base URL bị chặn bởi chính sách bảo mật SSRF (Metadata hoặc mạng nội bộ)."
            }
        )

    provider_id = f"prov-custom-{int(time_now := 1000 * 1000)}"
    import time
    provider_id = f"prov-custom-{int(time.time() * 1000)}"

    new_prov = AiProviderConfig(
        id=provider_id,
        name=request.name,
        provider_type=ProviderType.CUSTOM_OPENAI,
        base_url=request.base_url,
        api_key=request.api_key or "",
        status=ProviderStatus.UNKNOWN,
        priority=request.priority or 10,
        is_free_confirmed=request.is_free_confirmed
    )

    ai_router.providers[provider_id] = new_prov
    ai_router.save_persisted_config()

    return ApiResponse(
        success=True,
        data={
            "id": new_prov.id,
            "name": new_prov.name,
            "status": new_prov.status.value,
            "masked_api_key": mask_secret_key(new_prov.api_key),
            "message": f"Đã thêm provider tùy chỉnh: {new_prov.name}"
        }
    )


@router.put("/{id}", response_model=ApiResponse)
def update_provider(id: str, request: UpdateProviderRequest):
    """Updates provider configuration (API key, priority, status)."""
    provider = ai_router.providers.get(id)
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "PROVIDER_NOT_FOUND", "message": f"Provider {id} không tồn tại."}
        )

    if request.api_key is not None and request.api_key != "":
        # Never store masked key back
        if "••••" not in request.api_key:
            provider.api_key = request.api_key
            provider.status = ProviderStatus.UNKNOWN

    if request.priority is not None:
        provider.priority = request.priority

    if request.status is not None:
        try:
            provider.status = ProviderStatus(request.status)
        except Exception:
            pass

    if request.base_url is not None:
        if not validate_url_against_ssrf(request.base_url):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "SSRF_VALIDATION_FAILED", "message": "Base URL vi phạm chính sách SSRF."}
            )
        provider.base_url = request.base_url

    ai_router.save_persisted_config()
    return ApiResponse(
        success=True,
        data={
            "id": provider.id,
            "name": provider.name,
            "status": provider.status.value,
            "masked_api_key": mask_secret_key(provider.api_key),
            "priority": provider.priority
        }
    )


@router.delete("/{id}", response_model=ApiResponse)
def delete_provider(id: str):
    """Deletes a custom provider."""
    if id in ("prov-groq", "prov-gemini", "prov-openrouter"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "DEFAULT_PROVIDER_CANNOT_BE_DELETED", "message": "Không thể xóa các provider mặc định của hệ thống."}
        )

    if id not in ai_router.providers:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "PROVIDER_NOT_FOUND", "message": f"Provider {id} không tồn tại."}
        )

    del ai_router.providers[id]
    ai_router.save_persisted_config()
    return ApiResponse(success=True, data={"message": f"Đã xóa provider {id}"})


@router.post("/{id}/test", response_model=ApiResponse)
async def test_provider_connection(id: str):
    """
    Executes a real live health probe against the provider endpoint.
    Returns latency, success/failure status, and sanitized message.
    """
    success, message, latency_ms = await ai_router.test_provider(id)
    return ApiResponse(
        success=True,
        data={
            "provider_id": id,
            "connected": success,
            "status": "HEALTHY" if success else "DEGRADED",
            "latency_ms": latency_ms,
            "message": message
        }
    )


@router.post("/{id}/discover", response_model=ApiResponse)
async def discover_provider_models(id: str):
    """Discovers available models from provider catalog endpoint."""
    provider = ai_router.providers.get(id)
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "PROVIDER_NOT_FOUND", "message": f"Provider {id} không tồn tại."}
        )

    adapter = ai_router.get_adapter(provider)
    models = await adapter.discover_models()
    return ApiResponse(
        success=True,
        data={
            "provider_id": id,
            "models_count": len(models),
            "models": models
        }
    )
