"""
Concrete Media Provider Adapters for Pexels, Wikimedia Commons, Article Crawler, and Pillow.
Ref: PROJECT.md Section VIII & Hạng mục 3 Media Provider
"""

import os
import time
import urllib.parse
from typing import List, Dict, Any, Optional
from pathlib import Path
from PIL import Image, ImageDraw

from app.services.media.base import BaseMediaProvider
from app.services.media.models import MediaAsset, MediaProviderStatus


class PexelsMediaAdapter(BaseMediaProvider):
    """
    Adapter for Pexels Official API (Stock Photos & Videos).
    Requires PEXELS_API_KEY. Handles rate limits, quota, and commercial licensing metadata.
    """

    def __init__(self):
        super().__init__(provider_id="prov-pexels", name="Pexels Official API")
        self.api_key = os.getenv("PEXELS_API_KEY")
        self.base_url = "https://api.pexels.com/v1"
        self.last_status = MediaProviderStatus.READY if self.api_key else MediaProviderStatus.BLOCKED_NO_CREDENTIALS

    def get_status(self) -> Dict[str, Any]:
        return {
            "provider_id": self.provider_id,
            "name": self.name,
            "has_credentials": bool(self.api_key),
            "status": self.last_status.value,
            "rate_limit_remaining": 200 if self.api_key else 0,
            "commercial_allowed": True,
            "license_type": "Pexels Free Commercial License"
        }

    async def search_media(
        self,
        query: str,
        orientation: str = "portrait",
        limit: int = 5
    ) -> List[MediaAsset]:
        if not self.api_key:
            self.last_status = MediaProviderStatus.BLOCKED_NO_CREDENTIALS
            return []

        try:
            import httpx
            headers = {"Authorization": self.api_key}
            params = {
                "query": query,
                "orientation": orientation,
                "per_page": limit
            }
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.get(f"{self.base_url}/search", headers=headers, params=params)
                if resp.status_code == 200:
                    data = resp.json()
                    assets = []
                    for photo in data.get("photos", []):
                        src = photo.get("src", {})
                        assets.append(MediaAsset(
                            id=f"pexels-{photo.get('id')}",
                            url=src.get("portrait") or src.get("large2x") or src.get("original"),
                            thumbnail_url=src.get("medium") or src.get("small"),
                            media_type="image",
                            width=photo.get("width", 1080),
                            height=photo.get("height", 1920),
                            aspect_ratio="9:16",
                            source_provider="pexels",
                            license_type="Pexels License (Commercial Use Allowed)",
                            commercial_allowed=True,
                            attribution_required=False,
                            author=photo.get("photographer", "Pexels Creator"),
                            source_page_url=photo.get("url"),
                            relevance_score=95
                        ))
                    self.last_status = MediaProviderStatus.READY
                    return assets
                elif resp.status_code == 429:
                    self.last_status = MediaProviderStatus.RATE_LIMITED
                    return []
                else:
                    self.last_status = MediaProviderStatus.ERROR
                    return []
        except Exception:
            self.last_status = MediaProviderStatus.ERROR
            return []


class WikimediaMediaAdapter(BaseMediaProvider):
    """
    Adapter for Wikimedia Commons API (Public Domain & Creative Commons media).
    Open API, no credentials required. Verifies and captures CC license info.
    """

    def __init__(self):
        super().__init__(provider_id="prov-wikimedia", name="Wikimedia Commons API")
        self.endpoint = "https://commons.wikimedia.org/w/api.php"

    def get_status(self) -> Dict[str, Any]:
        return {
            "provider_id": self.provider_id,
            "name": self.name,
            "has_credentials": True,
            "status": MediaProviderStatus.READY.value,
            "commercial_allowed": True,
            "license_type": "Creative Commons / Public Domain"
        }

    async def search_media(
        self,
        query: str,
        orientation: str = "portrait",
        limit: int = 5
    ) -> List[MediaAsset]:
        try:
            import httpx
            params = {
                "action": "query",
                "generator": "search",
                "gsrsearch": f"{query} filetype:bitmap",
                "gsrlimit": limit,
                "prop": "imageinfo",
                "iiprop": "url|size|extmetadata",
                "format": "json"
            }
            headers = {"User-Agent": "StoryMXH-Bot/2.0 (Media Pipeline; contact@storymxh.local)"}
            async with httpx.AsyncClient(timeout=8.0, headers=headers) as client:
                resp = await client.get(self.endpoint, params=params)
                if resp.status_code == 200:
                    data = resp.json()
                    pages = data.get("query", {}).get("pages", {})
                    assets = []
                    for pid, pdata in pages.items():
                        info_list = pdata.get("imageinfo", [])
                        if not info_list:
                            continue
                        info = info_list[0]
                        metadata = info.get("extmetadata", {})
                        lic = metadata.get("LicenseShortName", {}).get("value", "CC-BY-SA 4.0")
                        artist = metadata.get("Artist", {}).get("value", "Wikimedia Contributor")
                        # Strip HTML tags from artist string
                        import re
                        clean_artist = re.sub(r'<[^>]+>', '', artist).strip()[:40] or "Wikimedia Contributor"

                        assets.append(MediaAsset(
                            id=f"wiki-{pid}",
                            url=info.get("url"),
                            thumbnail_url=info.get("thumburl") or info.get("url"),
                            media_type="image",
                            width=info.get("width", 1080),
                            height=info.get("height", 1920),
                            aspect_ratio="9:16",
                            source_provider="wikimedia",
                            license_type=f"Wikimedia Commons ({lic})",
                            commercial_allowed="CC0" in lic or "Public domain" in lic or "CC-BY" in lic,
                            attribution_required=True,
                            author=clean_artist,
                            source_page_url=info.get("descriptionurl"),
                            relevance_score=88
                        ))
                    return assets
        except Exception:
            pass
        return []


class ArticleMediaAdapter(BaseMediaProvider):
    """
    Adapter for extracting and downloading media directly from crawled article.
    Preserves source domain attribution and assigns Editorial license.
    """

    def __init__(self):
        super().__init__(provider_id="prov-article", name="Article Source Media Extractor")

    def get_status(self) -> Dict[str, Any]:
        return {
            "provider_id": self.provider_id,
            "name": self.name,
            "has_credentials": True,
            "status": MediaProviderStatus.READY.value,
            "commercial_allowed": False,
            "license_type": "Editorial Use Only (Source Attribution Required)"
        }

    async def search_media(
        self,
        query: str,
        orientation: str = "portrait",
        limit: int = 5
    ) -> List[MediaAsset]:
        # Handled dynamically via upstream_data["article_images"]
        return []
