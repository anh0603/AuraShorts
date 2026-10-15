"""
Integration Tests for Phase 5: Social Account Management, Content Calendar,
Approval Workflow, and AI Caption/Hashtags Generator.
Ref: PROJECT.md Section 76 & Section 84 & docs/API_SPEC.md
"""

import unittest
import os
import sys
from fastapi.testclient import TestClient

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.db.database import SessionLocal, init_db
from app.db.repository import mask_credential, SocialPublishingRepository


class TestPhase5SocialAndPublishing(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        init_db()
        with SessionLocal() as db:
            SocialPublishingRepository.seed_default_social_data(db)
        cls.client = TestClient(app)

    def test_01_secret_token_masking(self):
        """Tokens and secrets must be masked with bullet points and never exposed raw."""
        token = "ya29.a0AWY7Ckkk_test_long_secret_123456"
        masked = mask_credential(token)
        self.assertEqual(masked, "ya29••••••••3456")
        self.assertNotIn("test_long_secret", masked)

        short_token = "12345"
        self.assertEqual(mask_credential(short_token), "••••••••")
        self.assertEqual(mask_credential(""), "")

    def test_02_create_social_account_and_masking(self):
        """Account registration masks secret credentials and initializes default posting schedule."""
        raw_secret = "ya29.a0AWY7C_secret_token_xyz999"
        payload = {
            "platform": "youtube",
            "account_name": "Kênh Khoa Học Tương Lai 9:16",
            "external_account_id": "UC_khoahoctuonglai_test",
            "niche_id": "science",
            "access_token": raw_secret,
            "videos_per_day": 3,
            "post_times": ["09:00", "15:00", "20:30"]
        }
        res = self.client.post("/api/v1/social/accounts", json=payload)
        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertTrue(data["success"])
        acc = data["data"]
        self.assertIsNotNone(acc["id"])
        self.assertEqual(acc["account_name"], "Kênh Khoa Học Tương Lai 9:16")
        self.assertEqual(acc["videos_per_day"], 3)
        self.assertEqual(acc["post_times"], ["09:00", "15:00", "20:30"])

        # Raw token MUST NOT be exposed
        self.assertNotIn("access_token", acc)
        self.assertIn("••••", acc["credential_reference"])
        self.assertNotIn("secret_token_xyz", acc["credential_reference"])

    def test_03_list_social_accounts(self):
        """Listing accounts returns platform, status, and schedule times."""
        res = self.client.get("/api/v1/social/accounts")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        accounts = data["data"]
        self.assertGreaterEqual(len(accounts), 3)

        platforms = [a["platform"] for a in accounts]
        self.assertIn("youtube", platforms)
        self.assertIn("tiktok", platforms)
        self.assertIn("facebook", platforms)

    def test_04_test_channel_connection(self):
        """Testing channel connection validates credentials and returns latency."""
        # Test on first available account
        res_list = self.client.get("/api/v1/social/accounts")
        first_id = res_list.json()["data"][0]["id"]

        res = self.client.post(f"/api/v1/social/accounts/{first_id}/test")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["data"]["status"], "CONNECTED")
        self.assertGreater(data["data"]["latency_ms"], 0)

    def test_05_enqueue_post_with_idempotency(self):
        """Enqueue video post with idempotency protection against duplicate submissions."""
        res_list = self.client.get("/api/v1/social/accounts")
        account_id = res_list.json()["data"][0]["id"]

        post_payload = {
            "account_id": account_id,
            "title": "Phát hiện siêu vật liệu mới tăng tốc AI Clusters",
            "caption": "Bước nhảy vọt vật liệu quang học cho phép kết nối máy chủ AI siêu nhanh không độ trễ. Xem ngay!",
            "hashtags": ["#shorts", "#tech", "#ai", "#sieuvatlieu"],
            "scheduled_time": "2026-10-15T20:00:00Z",
            "status": "PENDING_APPROVAL"
        }

        # First insert: creates new record
        res1 = self.client.post("/api/v1/publishing/queue", json=post_payload)
        self.assertEqual(res1.status_code, 201)
        data1 = res1.json()["data"]
        self.assertEqual(data1["status"], "PENDING_APPROVAL")
        queue_id = data1["id"]

        # Duplicate insert: returns existing without duplicating
        res2 = self.client.post("/api/v1/publishing/queue", json=post_payload)
        self.assertEqual(res2.status_code, 201)
        data2 = res2.json()["data"]
        self.assertEqual(data1["id"], data2["id"])

    def test_06_operator_approval_workflow(self):
        """Operator can approve or reject queued posts."""
        res_queue = self.client.get("/api/v1/publishing/queue?status=PENDING_APPROVAL")
        self.assertEqual(res_queue.status_code, 200)
        items = res_queue.json()["data"]
        self.assertGreater(len(items), 0)
        target_id = items[0]["id"]

        # 1. Approve post
        res_appr = self.client.post(f"/api/v1/publishing/{target_id}/approve")
        self.assertEqual(res_appr.status_code, 200)
        self.assertEqual(res_appr.json()["data"]["status"], "SCHEDULED")

        # 2. Reject post
        res_rej = self.client.post(f"/api/v1/publishing/{target_id}/reject", json={"reason": "Tư liệu ảnh cần thay thế"})
        self.assertEqual(res_rej.status_code, 200)
        self.assertEqual(res_rej.json()["data"]["status"], "REJECTED")

    def test_07_ai_metadata_and_hashtag_generation(self):
        """AI Router generates SEO-optimized viral title, caption, and platform hashtags."""
        # 1. YouTube Shorts format
        yt_res = self.client.post("/api/v1/publishing/generate-metadata", json={
            "title": "Pin thể rắn xe điện sạc 12 phút đi 1000km",
            "content_summary": "Loại bỏ nguy cơ cháy nổ, sạc siêu tốc 12 phút",
            "platform": "youtube",
            "niche": "tech"
        })
        self.assertEqual(yt_res.status_code, 200)
        yt_data = yt_res.json()["data"]
        self.assertIn("title", yt_data)
        self.assertIn("caption", yt_data)
        self.assertGreater(len(yt_data["hashtags"]), 2)
        self.assertTrue(any("shorts" in h.lower() for h in yt_data["hashtags"]))

        # 2. TikTok format
        tk_res = self.client.post("/api/v1/publishing/generate-metadata", json={
            "title": "Đột phá thông xe cao tốc Bắc Nam thế kỷ",
            "content_summary": "Hạ tầng giao thông quốc gia hiện đại",
            "platform": "tiktok",
            "niche": "national"
        })
        self.assertEqual(tk_res.status_code, 200)
        tk_data = tk_res.json()["data"]
        self.assertTrue(any("tiktok" in h.lower() or "fyp" in h.lower() or "xuhuong" in h.lower() for h in tk_data["hashtags"]))

    def test_08_delete_social_account(self):
        """Deleting an account removes it cleanly."""
        # Create temp account
        create_res = self.client.post("/api/v1/social/accounts", json={
            "platform": "facebook",
            "account_name": "Temporary Test Page",
            "external_account_id": "fb_temp_123"
        })
        acc_id = create_res.json()["data"]["id"]

        # Delete it
        del_res = self.client.delete(f"/api/v1/social/accounts/{acc_id}")
        self.assertEqual(del_res.status_code, 200)
        self.assertTrue(del_res.json()["data"]["deleted"])

        # Query again must return 404
        get_res = self.client.get(f"/api/v1/social/accounts/{acc_id}")
        self.assertEqual(get_res.status_code, 404)


if __name__ == "__main__":
    unittest.main()
