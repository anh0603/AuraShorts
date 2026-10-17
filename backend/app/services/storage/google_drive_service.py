"""
Google Drive Cloud Storage & Resumable Media Upload Service.
Enables direct export of rendered 9:16 Shorts to Google Drive, provides
shareable cloud streaming links, and cleans up local storage intermediates
to ensure zero disk clutter and eliminate IDE file-watcher overhead.
"""

import os
import json
import time
from pathlib import Path
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone

BASE_STORAGE = Path(__file__).resolve().parents[4] / "storage"
ARTIFACTS_DIR = BASE_STORAGE / "artifacts"
CREDENTIALS_FILE = BASE_STORAGE / "gdrive_credentials.json"
SERVICE_ACCOUNT_FILE = BASE_STORAGE / "service_account.json"
CONFIG_FILE = BASE_STORAGE / "gdrive_config.json"


class GoogleDriveService:
    """
    Manages Google Drive API v3 uploads, permission granting (public viewable),
    and local intermediate disk cleanup.
    """

    @classmethod
    def get_config(cls) -> Dict[str, Any]:
        """Loads Google Drive configuration from file or defaults."""
        default_cfg = {
            "enabled": True,
            "folder_id": os.getenv("GDRIVE_FOLDER_ID", ""),
            "folder_name": "AuraShorts",
            "auto_create_daily_folder": True,
            "auto_cleanup_intermediates": True,
            "auto_delete_local_mp4_post_upload": True,
            "make_public_viewable": True,
            "client_id": os.getenv("GOOGLE_CLIENT_ID", ""),
            "client_secret": os.getenv("GOOGLE_CLIENT_SECRET", ""),
            "connected_email": None,
            "last_upload": None
        }
        if CONFIG_FILE.exists():
            try:
                with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    default_cfg.update(data)
            except Exception:
                pass
        return default_cfg

    @classmethod
    def save_config(cls, cfg: Dict[str, Any]) -> Dict[str, Any]:
        """Saves Google Drive configuration to disk."""
        current = cls.get_config()
        current.update(cfg)
        CONFIG_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump(current, f, ensure_ascii=False, indent=2)
        return current

    @classmethod
    def get_credentials(cls):
        """
        Attempts to resolve Google credentials from:
        1. Service Account JSON file (storage/service_account.json)
        2. OAuth2 Client Secrets / Authorized User (storage/gdrive_credentials.json)
        3. Environment variable GDRIVE_SERVICE_ACCOUNT_JSON
        4. SocialAccountModel (YouTube OAuth connection) in database
        """
        from google.oauth2 import service_account
        from google.oauth2.credentials import Credentials

        # 1. Service Account file
        if SERVICE_ACCOUNT_FILE.exists():
            try:
                return service_account.Credentials.from_service_account_file(
                    str(SERVICE_ACCOUNT_FILE),
                    scopes=['https://www.googleapis.com/auth/drive.file']
                )
            except Exception as e:
                print(f"[GoogleDriveService] Failed loading service_account.json: {e}")

        # 2. Environment variable
        env_sa = os.getenv("GDRIVE_SERVICE_ACCOUNT_JSON")
        if env_sa:
            try:
                info = json.loads(env_sa)
                return service_account.Credentials.from_service_account_info(
                    info,
                    scopes=['https://www.googleapis.com/auth/drive.file']
                )
            except Exception as e:
                print(f"[GoogleDriveService] Failed loading env GDRIVE_SERVICE_ACCOUNT_JSON: {e}")

        # 3. User OAuth2 credentials file
        if CREDENTIALS_FILE.exists():
            try:
                return Credentials.from_authorized_user_file(
                    str(CREDENTIALS_FILE),
                    scopes=['https://www.googleapis.com/auth/drive.file']
                )
            except Exception as e:
                print(f"[GoogleDriveService] Failed loading gdrive_credentials.json: {e}")

        # 4. Try loading from SocialAccountModel (YouTube account tokens)
        try:
            from app.db.database import SessionLocal
            from app.db.models import SocialAccountModel
            with SessionLocal() as db:
                acc = db.query(SocialAccountModel).filter(
                    SocialAccountModel.platform.in_(["google_drive", "youtube"])
                ).first()
                if acc and acc.encrypted_access_token:
                    # Construct Credentials from token
                    return Credentials(
                        token=acc.encrypted_access_token,
                        refresh_token=acc.credential_reference or None,
                        token_uri="https://oauth2.googleapis.com/token",
                        client_id=os.getenv("GOOGLE_CLIENT_ID", ""),
                        client_secret=os.getenv("GOOGLE_CLIENT_SECRET", ""),
                        scopes=['https://www.googleapis.com/auth/drive.file']
                    )
        except Exception:
            pass

        return None

    @classmethod
    def is_configured(cls) -> bool:
        """Returns True if valid Google credentials or config exists."""
        return cls.get_credentials() is not None

    @classmethod
    def get_status(cls) -> Dict[str, Any]:
        """Returns the current connection and configuration status."""
        creds = cls.get_credentials()
        cfg = cls.get_config()
        return {
            "configured": creds is not None,
            "enabled": cfg.get("enabled", True),
            "folder_id": cfg.get("folder_id", ""),
            "folder_name": cfg.get("folder_name", "AuraShorts Exports"),
            "auto_cleanup_intermediates": cfg.get("auto_cleanup_intermediates", True),
            "auto_delete_local_mp4": cfg.get("auto_delete_local_mp4_post_upload", False),
            "last_upload": cfg.get("last_upload"),
            "has_service_account": SERVICE_ACCOUNT_FILE.exists(),
            "has_credentials_file": CREDENTIALS_FILE.exists()
        }

    @classmethod
    def upload_video(
        cls,
        file_path: Path,
        title: str,
        folder_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Uploads an MP4 video file to Google Drive using Resumable MediaUpload.
        Grants public read permission (if enabled) so video can be previewed/downloaded.
        """
        p = Path(file_path)
        if not p.exists():
            return {
                "success": False,
                "error": f"File does not exist: {file_path}"
            }

        file_size_mb = round(p.stat().st_size / (1024 * 1024), 2)
        cfg = cls.get_config()
        target_folder = folder_id or cfg.get("folder_id") or None

        creds = cls.get_credentials()
        if not creds:
            # Deterministic simulated cloud link for offline/testing development
            simulated_id = f"gdrive_sim_{int(time.time())}"
            simulated_view = f"https://drive.google.com/file/d/{simulated_id}/view?usp=sharing"
            simulated_download = f"https://drive.google.com/uc?export=download&id={simulated_id}"
            
            # Record last upload in config
            cfg["last_upload"] = {
                "file_name": p.name,
                "title": title,
                "file_size_mb": file_size_mb,
                "uploaded_at": datetime.now(timezone.utc).isoformat(),
                "view_url": simulated_view,
                "is_simulated": True
            }
            cls.save_config(cfg)

            return {
                "success": True,
                "is_simulated": True,
                "file_id": simulated_id,
                "title": title,
                "web_view_link": simulated_view,
                "web_content_link": simulated_download,
                "file_size_mb": file_size_mb,
                "message": "Đã tạo liên kết lưu trữ Google Drive (Chế độ mô phỏng đám mây - Kết nối service_account.json để đồng bộ thực tế)"
            }

        try:
            from googleapiclient.discovery import build
            from googleapiclient.http import MediaFileUpload

            service = build('drive', 'v3', credentials=creds, cache_discovery=False)

            # Resolve daily folder if enabled
            if not target_folder and cfg.get("auto_create_daily_folder", True):
                target_folder = cls.get_or_create_daily_folder(service, cfg.get("folder_name", "AuraShorts"))

            file_metadata = {
                'name': f"{title}.mp4" if not title.endswith(".mp4") else title,
                'description': 'Rendered by AuraShorts OS v2.0'
            }
            if target_folder:
                file_metadata['parents'] = [target_folder]

            media = MediaFileUpload(
                str(p),
                mimetype='video/mp4',
                resumable=True,
                chunksize=1024 * 1024 * 5  # 5MB chunks
            )

            request = service.files().create(
                body=file_metadata,
                media_body=media,
                fields='id, name, webViewLink, webContentLink, size'
            )

            response = None
            while response is None:
                status, response = request.next_chunk()
                if status:
                    pct = int(status.progress() * 100)
                    print(f"[GoogleDrive Upload] Uploading {p.name}: {pct}%")

            file_id = response.get('id')
            web_view = response.get('webViewLink') or f"https://drive.google.com/file/d/{file_id}/view?usp=sharing"
            web_download = response.get('webContentLink') or f"https://drive.google.com/uc?export=download&id={file_id}"

            # Make public viewable so anyone with link can play
            if cfg.get("make_public_viewable", True):
                try:
                    service.permissions().create(
                        fileId=file_id,
                        body={'role': 'reader', 'type': 'anyone'},
                        fields='id'
                    ).execute()
                except Exception as perm_err:
                    print(f"[GoogleDrive Permission Notice]: {perm_err}")

            # Zero Disk Mode: If auto_delete_local_mp4_post_upload is enabled, delete local rendered video
            if cfg.get("auto_delete_local_mp4_post_upload", False):
                try:
                    if p.exists():
                        p.unlink()
                        print(f"[GoogleDrive] Zero Disk Mode: Cleaned up local file {p.name}")
                except Exception as del_err:
                    print(f"[GoogleDrive Cleanup Warning]: {del_err}")

            # Update config record
            cfg["last_upload"] = {
                "file_id": file_id,
                "file_name": p.name,
                "title": title,
                "file_size_mb": file_size_mb,
                "uploaded_at": datetime.now(timezone.utc).isoformat(),
                "view_url": web_view,
                "is_simulated": False
            }
            cls.save_config(cfg)

            return {
                "success": True,
                "is_simulated": False,
                "file_id": file_id,
                "title": title,
                "web_view_link": web_view,
                "web_content_link": web_download,
                "file_size_mb": file_size_mb
            }

        except Exception as e:
            print(f"[GoogleDrive Upload Error]: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    @classmethod
    def get_or_create_daily_folder(cls, service, root_folder_name: str = "AuraShorts") -> Optional[str]:
        """
        Ensures a root folder exists on Google Drive (e.g. 'AuraShorts') and a subfolder with
        today's date (e.g. 'YYYY-MM-DD') exists inside it. Returns the daily subfolder ID.
        """
        try:
            # 1. Search for root folder
            query = f"name = '{root_folder_name}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false"
            results = service.files().list(q=query, spaces='drive', fields='files(id, name)').execute()
            items = results.get('files', [])
            if items:
                root_id = items[0]['id']
            else:
                meta = {
                    'name': root_folder_name,
                    'mimeType': 'application/vnd.google-apps.folder'
                }
                folder = service.files().create(body=meta, fields='id').execute()
                root_id = folder.get('id')

            # 2. Daily subfolder YYYY-MM-DD
            today_str = datetime.now().strftime("%Y-%m-%d")
            query_daily = f"name = '{today_str}' and '{root_id}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false"
            results_daily = service.files().list(q=query_daily, spaces='drive', fields='files(id, name)').execute()
            daily_items = results_daily.get('files', [])
            if daily_items:
                return daily_items[0]['id']
            else:
                meta_daily = {
                    'name': today_str,
                    'parents': [root_id],
                    'mimeType': 'application/vnd.google-apps.folder'
                }
                daily_folder = service.files().create(body=meta_daily, fields='id').execute()
                return daily_folder.get('id')
        except Exception as e:
            print(f"[GoogleDrive Daily Folder Warning]: {e}")
            return None

    @classmethod
    def get_oauth_auth_url(cls, redirect_uri: str) -> Optional[str]:
        """Builds Google OAuth consent URL for user to grant Drive scope."""
        cfg = cls.get_config()
        client_id = cfg.get("client_id") or os.getenv("GOOGLE_CLIENT_ID", "")
        if not client_id:
            return None
        scope = "https://www.googleapis.com/auth/drive.file"
        return (
            f"https://accounts.google.com/o/oauth2/v2/auth"
            f"?client_id={client_id}"
            f"&redirect_uri={redirect_uri}"
            f"&response_type=code"
            f"&scope={scope}"
            f"&access_type=offline"
            f"&prompt=consent"
        )

    @classmethod
    def exchange_oauth_code(cls, code: str, redirect_uri: str) -> Dict[str, Any]:
        """Exchanges authorization code for credentials and saves to storage/gdrive_credentials.json."""
        import httpx
        cfg = cls.get_config()
        client_id = cfg.get("client_id") or os.getenv("GOOGLE_CLIENT_ID", "")
        client_secret = cfg.get("client_secret") or os.getenv("GOOGLE_CLIENT_SECRET", "")
        if not client_id or not client_secret:
            return {"success": False, "error": "Client ID or Client Secret missing"}
        try:
            resp = httpx.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "code": code,
                    "client_id": client_id,
                    "client_secret": client_secret,
                    "redirect_uri": redirect_uri,
                    "grant_type": "authorization_code"
                },
                timeout=15.0
            )
            if resp.status_code != 200:
                return {"success": False, "error": f"Token exchange failed: {resp.text}"}
            token_data = resp.json()
            CREDENTIALS_FILE.parent.mkdir(parents=True, exist_ok=True)
            with open(CREDENTIALS_FILE, "w", encoding="utf-8") as f:
                json.dump({
                    "token": token_data.get("access_token"),
                    "refresh_token": token_data.get("refresh_token"),
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "client_id": client_id,
                    "client_secret": client_secret,
                    "scopes": ["https://www.googleapis.com/auth/drive.file"]
                }, f, indent=2)
            cfg["enabled"] = True
            cls.save_config(cfg)
            return {"success": True, "message": "Google Drive OAuth connected successfully"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    @classmethod
    def cleanup_intermediates(cls, project_id: str, keep_rendered_mp4: bool = True) -> Dict[str, Any]:
        """
        Deletes all intermediate processing files for project_id:
        - sc_audio_*, sc_raw_* (individual TTS audios)
        - frame_* (individual scene PNGs)
        - motion_clip_* (individual scene MP4s)
        - video_track_* (raw video track without subtitles)
        - mixed_audio_*, mixed_* (temporary audio mix tracks)
        - *concat*.txt (concat playlists)
        - subs_*.ass (temporary subtitle script)
        
        Saves disk space and stops file watchers from getting flooded.
        """
        if not project_id:
            return {"deleted_count": 0, "freed_mb": 0.0}

        deleted_files: List[str] = []
        freed_bytes = 0

        # Patterns matching intermediate files
        prefixes = [
            f"sc_audio_{project_id}_",
            f"sc_raw_{project_id}_",
            f"frame_{project_id}_",
            f"motion_clip_{project_id}_",
            f"video_track_{project_id}",
            f"mixed_{project_id}",
            f"mixed_audio_{project_id}",
            f"audio_concat_{project_id}",
            f"clips_concat_{project_id}",
            f"ffmpeg_concat_{project_id}",
            f"subs_{project_id}",
            f"subtitles_{project_id}"
        ]

        if not keep_rendered_mp4:
            prefixes.append(f"rendered_{project_id}")

        for item in ARTIFACTS_DIR.glob("*"):
            if not item.is_file():
                continue
            name = item.name
            # Check if name starts with any prefix or contains project_id intermediates
            if any(name.startswith(pfx) for pfx in prefixes):
                try:
                    f_size = item.stat().st_size
                    item.unlink()
                    deleted_files.append(name)
                    freed_bytes += f_size
                except Exception as err:
                    print(f"[Cleanup Error] Could not delete {item}: {err}")

        freed_mb = round(freed_bytes / (1024 * 1024), 2)
        print(f"[Storage Cleanup] Cleaned up {len(deleted_files)} intermediate files ({freed_mb} MB freed) for project {project_id}")

        return {
            "deleted_count": len(deleted_files),
            "freed_mb": freed_mb,
            "deleted_files": deleted_files
        }
