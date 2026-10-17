"""
FastAPI Main Application Entrypoint for AuraShorts OS Autonomous Task Orchestrator.
Ref: docs/ARCHITECTURE.md & docs/API_SPEC.md
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.db.database import init_db, SessionLocal
from app.db.repository import OrchestrationRepository
from app.api.v1.health import router as health_router
from app.api.v1.orchestrator import router as orchestrator_router
from app.api.v1.providers import router as providers_router
from app.api.v1.publishing import router as publishing_router
from app.api.v1.trends import router as trends_router
from app.api.v1.studio import router as studio_router
from app.api.v1.exported_videos import router as exported_videos_router
from app.schemas.orchestrator import ApiResponse


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application Lifespan:
    - Initializes SQLite/PostgreSQL tables.
    - Performs durable crash recovery on startup.
    """
    # 1. Initialize DB tables
    init_db()

    # 2. Durable Crash Recovery: recover tasks interrupted by server shutdown
    with SessionLocal() as db:
        recovered = OrchestrationRepository.recover_interrupted_tasks(db)
        print(f"[AuraShorts OS] Database online. Recovered {recovered} interrupted in-flight tasks.")

    # 3. Start background periodic 1-hour scan loop for Trends Radar
    import asyncio
    from app.services.radar.trends_radar import trends_radar
    from app.services.publishing.exported_videos_service import ExportedVideosService
    radar_task = asyncio.create_task(trends_radar.start_periodic_scan_loop())
    scheduler_task = asyncio.create_task(ExportedVideosService.start_periodic_scheduler_loop(interval_seconds=15))

    yield

    radar_task.cancel()
    scheduler_task.cancel()
    print("[AuraShorts OS] Orchestration Engine shutting down cleanly.")


app = FastAPI(
    title="AuraShorts OS Autonomous Orchestration API",
    description="Autonomous Task Orchestrator & DAG Execution Engine for Short-Form Video Production",
    version="2.0.0",
    lifespan=lifespan
)

# CORS configuration for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from pathlib import Path
from fastapi.staticfiles import StaticFiles

BASE_STORAGE = Path(__file__).resolve().parent.parent.parent / "storage"
BASE_STORAGE.mkdir(parents=True, exist_ok=True)

# Register API v1 Routers
app.include_router(health_router, prefix="/api/v1")
app.include_router(orchestrator_router, prefix="/api/v1")
app.include_router(providers_router, prefix="/api/v1")
app.include_router(publishing_router, prefix="/api/v1")
app.include_router(trends_router, prefix="/api/v1")
app.include_router(studio_router, prefix="/api/v1")
app.include_router(exported_videos_router, prefix="/api/v1")

# Mount storage directory for artifacts, videos, and media assets
app.mount("/storage", StaticFiles(directory=str(BASE_STORAGE)), name="storage")


# Standardized Error Handlers conforming to docs/API_SPEC.md
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    detail = exc.detail
    if isinstance(detail, dict):
        error_code = detail.get("code", f"HTTP_{exc.status_code}")
        error_message = detail.get("message", "An error occurred")
        details = detail.get("details", None)
    else:
        error_code = f"HTTP_{exc.status_code}"
        error_message = str(detail)
        details = None

    return JSONResponse(
        status_code=exc.status_code,
        content=ApiResponse(
            success=False,
            data=None,
            error={
                "code": error_code,
                "message": error_message,
                "details": details
            }
        ).model_dump()
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=ApiResponse(
            success=False,
            data=None,
            error={
                "code": "REQUEST_VALIDATION_ERROR",
                "message": "Dữ liệu yêu cầu không hợp lệ hoặc thiếu trường bắt buộc.",
                "details": exc.errors()
            }
        ).model_dump()
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=ApiResponse(
            success=False,
            data=None,
            error={
                "code": "INTERNAL_SERVER_ERROR",
                "message": f"Lỗi hệ thống nội bộ: {str(exc)}"
            }
        ).model_dump()
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
