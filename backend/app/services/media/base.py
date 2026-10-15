"""
Abstract Base Class for Media Providers.
Ref: PROJECT.md Section VIII & docs/ARCHITECTURE.md
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from app.services.media.models import MediaAsset, MediaProviderStatus


class BaseMediaProvider(ABC):
    """
    Contract for searching and retrieving stock footage, images, and visual assets.
    """

    def __init__(self, provider_id: str, name: str):
        self.provider_id = provider_id
        self.name = name

    @abstractmethod
    async def search_media(
        self,
        query: str,
        orientation: str = "portrait",
        limit: int = 5
    ) -> List[MediaAsset]:
        """Searches media assets matching the query and aspect ratio."""
        pass

    @abstractmethod
    def get_status(self) -> Dict[str, Any]:
        """Returns the status and health of the provider."""
        pass
