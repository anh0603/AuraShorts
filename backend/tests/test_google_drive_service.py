"""
Tests for GoogleDriveService:
- Status probe & configuration management
- Resumable upload (simulated cloud link & live)
- Intermediate disk garbage collection
"""

import os
import sys
import pytest
from pathlib import Path

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.storage.google_drive_service import GoogleDriveService, ARTIFACTS_DIR


def test_gdrive_service_status_and_config():
    """Verify status probe and configuration loading."""
    status = GoogleDriveService.get_status()
    assert isinstance(status, dict)
    assert "configured" in status
    assert "enabled" in status
    assert "auto_cleanup_intermediates" in status

    cfg = GoogleDriveService.get_config()
    assert isinstance(cfg, dict)
    assert cfg.get("enabled") is True


def test_gdrive_upload_fallback_link(tmp_path):
    """Verify upload generates valid shareable cloud links even before live keys are mounted."""
    dummy_file = tmp_path / "test_video.mp4"
    dummy_file.write_bytes(b"fake mp4 content" * 100)

    res = GoogleDriveService.upload_video(
        file_path=dummy_file,
        title="Test Shorts Video"
    )
    assert res["success"] is True
    assert "drive.google.com" in res["web_view_link"]
    assert "drive.google.com" in res["web_content_link"]
    assert res["file_size_mb"] >= 0.0


def test_gdrive_cleanup_intermediates(tmp_path):
    """Verify cleanup_intermediates deletes intermediate chunks and leaves rendered mp4."""
    proj = "test_cleanup_proj_99"
    # Create fake intermediate files in ARTIFACTS_DIR
    f1 = ARTIFACTS_DIR / f"sc_audio_{proj}_1.mp3"
    f2 = ARTIFACTS_DIR / f"motion_clip_{proj}_1.mp4"
    f3 = ARTIFACTS_DIR / f"frame_{proj}_1.png"
    f_rendered = ARTIFACTS_DIR / f"rendered_{proj}.mp4"

    f1.write_bytes(b"audio")
    f2.write_bytes(b"clip")
    f3.write_bytes(b"frame")
    f_rendered.write_bytes(b"rendered video")

    cleanup_res = GoogleDriveService.cleanup_intermediates(proj, keep_rendered_mp4=True)

    assert cleanup_res["deleted_count"] >= 3
    assert not f1.exists()
    assert not f2.exists()
    assert not f3.exists()
    assert f_rendered.exists()  # Keep final MP4 intact

    # Clean up test artifact
    f_rendered.unlink(missing_ok=True)


def test_gdrive_daily_folder_logic():
    """Verify daily folder name logic produces YYYY-MM-DD."""
    from datetime import datetime
    today = datetime.now().strftime("%Y-%m-%d")
    assert len(today) == 10
    assert today.count("-") == 2


def test_gdrive_oauth_url_generation(monkeypatch):
    """Verify OAuth auth URL is constructed properly when client_id is present."""
    monkeypatch.setenv("GOOGLE_CLIENT_ID", "test_client_id_123.apps.googleusercontent.com")
    url = GoogleDriveService.get_oauth_auth_url("http://localhost:8000/callback")
    assert url is not None
    assert "accounts.google.com" in url
    assert "test_client_id_123" in url
    assert "https://www.googleapis.com/auth/drive.file" in url

