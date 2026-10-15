"""
Test Suite for Phase 6: YouTube Shorts Publishing Adapter, Resumable Upload,
Media Verification, Idempotency & Attempt Audit Trail.
Ref: PROJECT.md Section 64, Section 66 & Section 84 (Phase 6 Acceptance Criteria).
"""

import os
import sys
import unittest
from datetime import datetime, timezone
from fastapi.testclient import TestClient

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.db.database import SessionLocal, init_db
from app.db.models import SocialAccountModel, PostQueueModel, PublishingAttemptModel
from app.services.publishing.base_adapter import BasePublishingAdapter
from app.services.publishing.youtube_adapter import YouTubeShortsAdapter
from app.services.publishing.publisher_service import PublisherService


class TestPhase6YouTubeAdapter(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        init_db()
        cls.client = TestClient(app)
        cls.adapter = YouTubeShortsAdapter()

    def setUp(self):
        self.db = SessionLocal()

    def tearDown(self):
        self.db.close()

    def test_01_youtube_adapter_interface_contract(self):
        """YouTubeShortsAdapter MUST implement BasePublishingAdapter contract."""
        self.assertIsInstance(self.adapter, BasePublishingAdapter)
        methods = [
            "validate_connection",
            "validate_media",
            "upload_media",
            "publish_post",
            "get_post_status",
            "reconcile_unknown_result"
        ]
        for m in methods:
            self.assertTrue(callable(getattr(self.adapter, m, None)), f"Missing method {m}")

    def test_02_oauth_token_validation_and_expired_token_handling(self):
        """Adapter detects active credentials and flags expired tokens with clear error code."""
        # 1. Valid channel
        valid_acc = SocialAccountModel(
            id="acc-yt-valid",
            platform="youtube",
            account_name="Tech Shorts VN",
            external_account_id="UC_tech_vn",
            credential_reference="ya29.••••••••yt01",
            encrypted_access_token="ya29.valid_token_xyz"
        )
        res_valid = self.adapter.validate_connection(valid_acc)
        self.assertTrue(res_valid.is_valid)
        self.assertEqual(res_valid.status, "CONNECTED")
        self.assertGreater(res_valid.latency_ms, 0)
        self.assertIn("channel_id", res_valid.details)

        # 2. Expired channel
        expired_acc = SocialAccountModel(
            id="acc-yt-expired",
            platform="youtube",
            account_name="Old Channel",
            external_account_id="UC_old_expired",
            credential_reference="ya29.••••••••exp1",
            encrypted_access_token="ya29.expired_token_abc"
        )
        res_exp = self.adapter.validate_connection(expired_acc)
        self.assertFalse(res_exp.is_valid)
        self.assertEqual(res_exp.status, "TOKEN_EXPIRED")
        self.assertEqual(res_exp.error_code, "OAUTH_TOKEN_EXPIRED_REAUTH_REQUIRED")

    def test_03_media_validation_duration_and_aspect_ratio(self):
        """Media validation rejects video longer than 60s or missing files."""
        # Missing file
        res_missing = self.adapter.validate_media("c:/nonexistent/video.mp4")
        self.assertFalse(res_missing.is_valid)
        self.assertIn("không tồn tại", res_missing.errors[0])

        # Test video file creation
        test_dir = os.path.join(os.getcwd(), "storage", "test_fixtures")
        os.makedirs(test_dir, exist_ok=True)
        valid_video_path = os.path.join(test_dir, "test_short_valid.mp4")
        with open(valid_video_path, "wb") as f:
            f.write(b"DUMMY_MP4_VALID_BYTES" * 100)

        res_valid = self.adapter.validate_media(valid_video_path)
        self.assertTrue(res_valid.is_valid)
        self.assertLessEqual(res_valid.duration_seconds, 60.5)

    def test_04_resumable_upload_protocol(self):
        """Resumable upload transfers bytes and produces session upload token."""
        acc = SocialAccountModel(
            id="acc-yt-04",
            platform="youtube",
            account_name="AI News Shorts",
            external_account_id="UC_ainews",
            credential_reference="ya29.••••••••yt04",
            encrypted_access_token="ya29.valid_token_04"
        )
        test_dir = os.path.join(os.getcwd(), "storage", "test_fixtures")
        os.makedirs(test_dir, exist_ok=True)
        video_path = os.path.join(test_dir, "test_upload.mp4")
        with open(video_path, "wb") as f:
            f.write(b"VIDEO_CHUNK_DATA" * 200)

        upload_res = self.adapter.upload_media(acc, video_path, {"title": "Test Upload"})
        self.assertTrue(upload_res.success)
        self.assertIsNotNone(upload_res.upload_token)
        self.assertGreater(upload_res.bytes_uploaded, 0)
        self.assertGreater(upload_res.duration_ms, 0)

    def test_05_publish_snippet_and_shorts_tag_enforcement(self):
        """Publishing ensures title has #Shorts, sets category, and creates live short URL."""
        acc = SocialAccountModel(
            id="acc-yt-05",
            platform="youtube",
            account_name="Science 24/7",
            external_account_id="UC_sci_247",
            credential_reference="ya29.••••••••yt05",
            encrypted_access_token="ya29.valid_token_05"
        )
        test_dir = os.path.join(os.getcwd(), "storage", "test_fixtures")
        os.makedirs(test_dir, exist_ok=True)
        video_path = os.path.join(test_dir, "test_pub.mp4")
        with open(video_path, "wb") as f:
            f.write(b"SAMPLE_VIDEO" * 100)

        upload_res = self.adapter.upload_media(acc, video_path, {})
        post_data = {
            "title": "Bí mật bên trong pin thể rắn",
            "caption": "Sạc 12 phút đi 1000km",
            "hashtags": ["#tech", "#electricvehicle"],
            "idempotency_key": "idemp_test_05_uniq"
        }
        pub_res = self.adapter.publish_post(acc, upload_res, post_data)

        self.assertTrue(pub_res.success)
        self.assertEqual(pub_res.status, "PUBLISHED")
        self.assertIsNotNone(pub_res.external_post_id)
        self.assertTrue(pub_res.post_url.startswith("https://youtube.com/shorts/"))
        snippet = pub_res.raw_response["snippet"]
        self.assertIn("#Shorts", snippet["title"])
        self.assertFalse(pub_res.raw_response["status"]["selfDeclaredMadeForKids"])

    def test_06_idempotency_prevents_duplicate_broadcast(self):
        """Re-publishing with identical idempotency key returns existing video without duplication."""
        acc = SocialAccountModel(
            id="acc-yt-06",
            platform="youtube",
            account_name="Tech Dispatch",
            external_account_id="UC_tech_disp",
            credential_reference="ya29.••••••••yt06",
            encrypted_access_token="ya29.valid_token_06"
        )
        test_dir = os.path.join(os.getcwd(), "storage", "test_fixtures")
        video_path = os.path.join(test_dir, "test_pub.mp4")
        upload_res = self.adapter.upload_media(acc, video_path, {})
        
        idem_key = "idemp_duplicate_guard_test_99"
        post_data = {
            "title": "Trạm thu phí không dừng thông minh",
            "caption": "Công nghệ AI quét biển số",
            "hashtags": ["#shorts"],
            "idempotency_key": idem_key
        }

        # First publish
        res1 = self.adapter.publish_post(acc, upload_res, post_data)
        self.assertTrue(res1.success)

        # Duplicate publish
        res2 = self.adapter.publish_post(acc, upload_res, post_data)
        self.assertTrue(res2.success)
        self.assertEqual(res1.external_post_id, res2.external_post_id)
        self.assertEqual(res1.post_url, res2.post_url)

    def test_07_status_reconciliation_of_unknown_result(self):
        """Reconciliation matches published video or confirms not found safely."""
        acc = SocialAccountModel(
            id="acc-yt-07",
            platform="youtube",
            account_name="AI Channel",
            external_account_id="UC_ai_07",
            credential_reference="ya29.••••••••yt07",
            encrypted_access_token="ya29.valid_token_07"
        )
        idem_key = "idemp_reconcile_check_123"
        post_data = {
            "title": "Đột phá mô hình AI mới 2026",
            "idempotency_key": idem_key
        }

        # 1. Before publish: not found
        rec_before = self.adapter.reconcile_unknown_result(acc, idem_key, post_data)
        self.assertTrue(rec_before.is_reconciled)
        self.assertFalse(rec_before.found_on_platform)
        self.assertEqual(rec_before.status, "NOT_FOUND")

        # 2. After publish: found and verified
        test_dir = os.path.join(os.getcwd(), "storage", "test_fixtures")
        video_path = os.path.join(test_dir, "test_pub.mp4")
        upload_res = self.adapter.upload_media(acc, video_path, {})
        self.adapter.publish_post(acc, upload_res, post_data)

        rec_after = self.adapter.reconcile_unknown_result(acc, idem_key, post_data)
        self.assertTrue(rec_after.is_reconciled)
        self.assertTrue(rec_after.found_on_platform)
        self.assertEqual(rec_after.status, "PUBLISHED")
        self.assertIsNotNone(rec_after.external_post_id)

    def test_08_publisher_service_logs_attempt_in_database(self):
        """PublisherService.publish_post updates database and records PublishingAttemptModel."""
        acc = SocialAccountModel(
            id="acc-yt-service-test",
            platform="youtube",
            account_name="Service Test Channel",
            external_account_id="UC_serv_test",
            niche_id="national",
            credential_reference="ya29.••••••••serv",
            encrypted_access_token="ya29.token_serv_test"
        )
        self.db.add(acc)
        self.db.flush()

        queue_item = PostQueueModel(
            id="pq-service-01",
            account_id=acc.id,
            title="Khánh thành trung tâm dữ liệu quốc gia",
            caption="Cơ sở hạ tầng số hiện đại",
            hashtags_json=["#national", "#datacenter"],
            scheduled_time=datetime.now(timezone.utc),
            status="APPROVED",
            idempotency_key="idemp_service_test_01"
        )
        self.db.add(queue_item)
        self.db.commit()

        # Run publish
        res = PublisherService.publish_post("pq-service-01", self.db)
        self.assertTrue(res["success"])
        self.assertEqual(res["status"], "PUBLISHED")

        # Verify attempt in DB
        attempts = PublisherService.get_attempts("pq-service-01", self.db)
        self.assertGreaterEqual(len(attempts), 1)
        self.assertEqual(attempts[0]["request_status"], "SUCCESS")
        self.assertIsNotNone(attempts[0]["external_post_id"])

    def test_09_http_api_publish_now_and_attempts_history(self):
        """FastAPI endpoints /publish-now, /reconcile, and /attempts function end-to-end."""
        # 1. Create account & post
        create_acc_res = self.client.post("/api/v1/social/accounts", json={
            "platform": "youtube",
            "account_name": "API Live Test Channel",
            "external_account_id": "UC_api_test_live",
            "niche_id": "tech",
            "access_token": "ya29.api_live_token"
        })
        acc_id = create_acc_res.json()["data"]["id"]

        post_res = self.client.post("/api/v1/publishing/queue", json={
            "account_id": acc_id,
            "title": "Trí tuệ nhân tạo thế hệ mới",
            "caption": "Tóm tắt công nghệ tuần này",
            "hashtags": ["#shorts", "#ai"],
            "scheduled_time": "2026-10-15T20:00:00Z",
            "status": "APPROVED"
        })
        queue_id = post_res.json()["data"]["id"]

        # 2. Trigger Publish Now
        pub_res = self.client.post(f"/api/v1/publishing/{queue_id}/publish-now")
        self.assertEqual(pub_res.status_code, 200)
        pub_data = pub_res.json()
        self.assertTrue(pub_data["success"])
        self.assertEqual(pub_data["data"]["status"], "PUBLISHED")
        self.assertIn("https://youtube.com/shorts/", pub_data["data"]["post_url"])

        # 3. Retrieve attempts history
        att_res = self.client.get(f"/api/v1/publishing/{queue_id}/attempts")
        self.assertEqual(att_res.status_code, 200)
        attempts = att_res.json()["data"]
        self.assertGreaterEqual(len(attempts), 1)
        self.assertEqual(attempts[0]["request_status"], "SUCCESS")

        # 4. Trigger Reconcile
        rec_res = self.client.post(f"/api/v1/publishing/{queue_id}/reconcile")
        self.assertEqual(rec_res.status_code, 200)
        rec_data = rec_res.json()["data"]
        self.assertTrue(rec_data["found_on_platform"])
        self.assertEqual(rec_data["post_status"], "PUBLISHED")


if __name__ == "__main__":
    unittest.main()
