"""
AI-assisted Caption and Hashtags Generator for Multi-Platform Publishing.
Generates platform-tailored SEO titles, descriptions, and hashtags using AiRouter.
Ref: PROJECT.md Section 76 & Section 84
"""

import json
import re
import asyncio
from typing import Dict, Any, List
from app.services.ai.router import ai_router
from app.services.ai.models import AiCapability


def _clean_json_str(text: str) -> str:
    t = text.strip()
    if t.startswith("```json"):
        t = t[7:]
    elif t.startswith("```"):
        t = t[3:]
    if t.endswith("```"):
        t = t[:-3]
    return t.strip()


class CaptionGenerator:

    @staticmethod
    async def generate_metadata(
        title: str,
        content_summary: str = "",
        platform: str = "youtube",
        niche: str = "tech"
    ) -> Dict[str, Any]:
        """
        Generates SEO-optimized viral Title, Caption and Hashtags for Shorts/Reels/TikTok.
        """
        platform_rules = {
            "youtube": "Tối ưu hóa cho YouTube Shorts: Tiêu đề dưới 70 ký tự, caption có lời kêu gọi Sub kênh, kèm thẻ #Shorts.",
            "tiktok": "Tối ưu hóa cho TikTok: Mở đầu giật gân, caption ngắn gọn kích thích bình luận, kèm #fyp và #tiktok.",
            "facebook": "Tối ưu hóa cho Facebook Reels: Thân thiện, kích hoạt tính năng chia sẻ, kèm #reels và thẻ ngách.",
            "instagram": "Tối ưu hóa cho Instagram Reels: Ngắn gọn, thẩm mỹ, hashtag chuẩn ngách."
        }
        rule_desc = platform_rules.get(platform.lower(), platform_rules["youtube"])

        prompt = (
            f"Bạn là chuyên gia tăng trưởng video ngắn (Shorts/TikTok/Reels). Hãy viết Tiêu Đề, Đoạn Caption Mô Tả và Danh Sách Hashtags tiếng Việt cho video sau:\n"
            f"Chủ đề / Tiêu đề gốc: {title}\n"
            f"Nội dung tóm tắt: {content_summary or title}\n"
            f"Nền tảng mục tiêu: {platform.upper()} ({rule_desc})\n"
            f"Ngách nội dung: {niche}\n\n"
            f"Bắt buộc trả về duy nhất một JSON object có cấu trúc:\n"
            f"{{\n"
            f"  \"viral_title\": \"Tiêu đề video ngắn giật gân, súc tích...\",\n"
            f"  \"caption\": \"Đoạn mô tả ngắn gọn 2-3 câu khơi gợi sự tò mò và lời kêu gọi theo dõi kênh...\",\n"
            f"  \"hashtags\": [\"#hashtag1\", \"#hashtag2\", \"#hashtag3\", \"#hashtag4\", \"#hashtag5\"]\n"
            f"}}"
        )

        try:
            raw_text, meta = await asyncio.wait_for(
                ai_router.route_and_generate(
                    capability=AiCapability.STRUCTURED_OUTPUT,
                    prompt=prompt,
                    json_schema={"type": "object"},
                    fallback_mock=True
                ),
                timeout=1.5
            )
            parsed = json.loads(_clean_json_str(raw_text))
            if isinstance(parsed, dict) and parsed.get("caption") and parsed.get("hashtags"):
                return {
                    "title": str(parsed.get("viral_title", title)).strip(),
                    "caption": str(parsed.get("caption")).strip(),
                    "hashtags": [str(h).strip() if str(h).startswith("#") else f"#{h.strip()}" for h in parsed.get("hashtags", [])][:8],
                    "platform": platform,
                    "engine": meta.get("provider_id", "ai_router")
                }
        except Exception:
            pass

        # Deterministic offline fallback
        hashtags = ["#shorts", "#trending", "#viral"]
        if platform == "tiktok":
            hashtags.extend(["#tiktok", "#fyp", "#xuhuong"])
        elif platform == "facebook":
            hashtags.extend(["#reels", "#fbshorts", "#kienthuc"])
        else:
            hashtags.extend(["#youtubeshorts", "#khampha", "#vietnam"])

        if niche in ("national", "history"):
            hashtags.extend(["#vietnam", "#haohung", "#datnuoc"])
        elif niche == "tech":
            hashtags.extend(["#congnghe", "#ai", "#techreview"])

        return {
            "title": title,
            "caption": (
                f"{title}! Bạn nghĩ sao về bước tiến công nghệ này? "
                f"Bấm theo dõi kênh ngay để không bỏ lỡ những phát minh và tin tức nóng hổi tiếp theo!"
            ),
            "hashtags": list(dict.fromkeys(hashtags))[:7],
            "platform": platform,
            "engine": "offline_fallback"
        }
