"""
Test Suite for Trends API: listing, scanning, and converting trend to DAG plan.
"""

import os
import sys
import unittest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.db.database import init_db


class TestTrendsApi(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        init_db()
        cls.client = TestClient(app)

    def test_01_get_trends_all(self):
        """GET /api/v1/trends returns list of trending topics."""
        res = self.client.get("/api/v1/trends")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        self.assertIsInstance(data["data"], list)
        self.assertGreaterEqual(len(data["data"]), 5)

    def test_02_get_trends_filtered_by_niche(self):
        """GET /api/v1/trends?niche=tech returns only tech trends."""
        res = self.client.get("/api/v1/trends?niche=tech")
        self.assertEqual(res.status_code, 200)
        data = res.json()["data"]
        self.assertTrue(all(item["niche_id"] == "tech" for item in data))

    def test_03_scan_trends(self):
        """POST /api/v1/trends/scan triggers RSS / news rescan."""
        res = self.client.post("/api/v1/trends/scan")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        self.assertIn("scanned_sources", data["data"])

    def test_04_convert_trend_to_dag_plan(self):
        """POST /api/v1/trends/{id}/convert-to-plan creates an autonomous DAG plan."""
        res = self.client.post("/api/v1/trends/tr-01/convert-to-plan", json={
            "target_duration_seconds": 45,
            "aspect_ratio": "9:16",
            "auto_start": False
        })
        self.assertIn(res.status_code, [200, 201])
        data = res.json()
        self.assertTrue(data["success"])
        plan = data["data"]
        self.assertIn("plan_id", plan)
        self.assertGreater(len(plan["tasks"]), 0)


if __name__ == "__main__":
    unittest.main()
