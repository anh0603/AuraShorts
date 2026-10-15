"""
Healthcheck endpoint for backend service verification.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime, timezone

from app.db.database import get_db
from app.schemas.orchestrator import ApiResponse

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("", response_model=ApiResponse)
def health_check(db: Session = Depends(get_db)):
    db_status = "connected"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"error: {str(e)}"

    return ApiResponse(
        success=True,
        data={
            "status": "healthy",
            "service": "AuraShorts OS Autonomous Orchestrator",
            "version": "2.0.0",
            "database": db_status,
            "engine": "DAG Execution Engine v2.0",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    )
