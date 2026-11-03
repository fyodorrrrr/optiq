import base64
import json
import unittest
from unittest.mock import patch

import cv2
import numpy as np
from fastapi.testclient import TestClient

from main import app


class Lab4Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def pair(self, kind="rotated"):
        response = self.client.get(f"/api/labs/4/sample?kind={kind}")
        self.assertEqual(response.status_code, 200, response.text)
        data = response.json()
        return tuple(base64.b64decode(data[name]["image"].split(",")[1]) for name in ["first", "second"])

    def compare(self, pair=None, settings=None):
        first, second = pair or self.pair()
        return self.client.post("/api/labs/4/experiment", files={"first": ("a.png", first, "image/png"), "second": ("b.png", second, "image/png")},
                                data={"settings": json.dumps(settings or {})})

    def test_capabilities_and_samples_are_explicit_and_repeatable(self):
        response = self.client.get("/api/labs/4/capabilities")
        self.assertEqual(response.status_code, 200)
        algorithms = response.json()["algorithms"]
        self.assertEqual([entry["id"] for entry in algorithms], ["surf", "sift", "orb"])
        self.assertTrue(next(entry for entry in algorithms if entry["id"] == "sift")["available"])
        self.assertTrue(next(entry for entry in algorithms if entry["id"] == "orb")["available"])
        self.assertEqual(self.pair(), self.pair())
        self.assertEqual(len(self.pair("scaled")), 2)

    def test_real_feature_descriptors_matches_and_timings(self):
        response = self.compare()
        self.assertEqual(response.status_code, 200, response.text)
        data = response.json()
        for result in data["algorithms"]:
            if result["status"] == "unavailable":
                self.assertEqual(result["algorithm"], "surf")
                self.assertIsNone(result["matches_image"])
                self.assertIsNone(result["good_matches"])
                continue
            self.assertEqual(result["status"], "ok", result)
            self.assertGreater(result["keypoints_first"], 0)
            self.assertLessEqual(result["keypoints_first"], 500)
            self.assertGreater(result["keypoints_second"], 0)
            self.assertGreater(result["good_matches"], 0)
            self.assertLessEqual(result["displayed_matches"], 50)
            self.assertLessEqual(result["displayed_matches"], result["good_matches"])
            self.assertGreaterEqual(result["first_ms"], 0)
            self.assertGreaterEqual(result["match_ms"], 0)
            self.assertEqual(result["matches_image"]["width"], 1280)
            if result["algorithm"] == "orb":
                self.assertEqual(result["norm"], "Hamming")
                self.assertEqual(result["descriptor_dtype"], "uint8")
                self.assertEqual(result["descriptor_dimensions"], 32)
            else:
                self.assertEqual(result["norm"], "L2")
                self.assertEqual(result["descriptor_dtype"], "float32")
                self.assertEqual(result["descriptor_dimensions"], 64 if result["algorithm"] == "surf" else 128)

    def test_limits_ratio_and_display_count_change_real_results(self):
        pair = self.pair()
        strict = self.compare(pair, {"ratio_threshold": 0.5, "max_features": 150, "max_matches": 5}).json()
        loose = self.compare(pair, {"ratio_threshold": 0.9, "max_features": 150, "max_matches": 5}).json()
        for a, b in zip(strict["algorithms"], loose["algorithms"]):
            if a["status"] != "ok":
                continue
            self.assertLessEqual(a["keypoints_first"], 150)
            self.assertLessEqual(a["displayed_matches"], 5)
            self.assertLessEqual(a["good_matches"], b["good_matches"])

    def test_uniform_input_handles_no_descriptors(self):
        content = cv2.imencode(".png", np.zeros((96, 96), np.uint8))[1].tobytes()
        response = self.compare((content, content))
        self.assertEqual(response.status_code, 200)
        for result in response.json()["algorithms"]:
            if result["status"] == "ok":
                self.assertEqual(result["keypoints_first"], 0)
                self.assertEqual(result["good_matches"], 0)
                self.assertEqual(result["displayed_matches"], 0)

    def test_upright_surf_executes_when_available(self):
        caps = self.client.get("/api/labs/4/capabilities").json()["algorithms"]
        if not next(item for item in caps if item["id"] == "surf")["available"]:
            self.skipTest("The installed OpenCV wheel does not enable SURF.")
        data = self.compare(settings={"upright": True, "hessian_threshold": 600}).json()
        surf = data["algorithms"][0]
        self.assertEqual(surf["status"], "ok")
        self.assertGreater(surf["keypoints_first"], 0)
        self.assertTrue(data["parameters"]["upright"])
        self.assertEqual(data["parameters"]["hessian_threshold"], 600)

    def test_unavailable_surf_is_not_replaced_or_faked(self):
        from services.lab4 import detector_factory

        def available_except_surf(name, settings):
            if name == "surf":
                raise cv2.error("SURF disabled for capability test")
            return detector_factory(name, settings)

        with patch("services.lab4.detector_factory", side_effect=available_except_surf):
            data = self.compare().json()
        self.assertEqual(data["algorithms"][0]["status"], "unavailable")
        self.assertIsNone(data["algorithms"][0]["keypoints_first_image"])
        self.assertEqual(data["algorithms"][1]["status"], "ok")
        self.assertEqual(data["algorithms"][2]["status"], "ok")

    def test_file_and_parameter_validation(self):
        pair = self.pair()
        for settings in [{"hessian_threshold": 0}, {"hessian_threshold": 100001},
                         {"ratio_threshold": 0}, {"ratio_threshold": 1}, {"max_features": 0},
                         {"max_features": 1001}, {"max_features": 10.5}, {"upright": "yes"},
                         {"max_matches": 101}, {"unexpected": 1}]:
            with self.subTest(settings=settings):
                self.assertEqual(self.compare(pair, settings).status_code, 422)
        self.assertEqual(self.compare((b"invalid", pair[1])).status_code, 422)
        large = cv2.imencode(".png", np.zeros((1100, 1100), np.uint8))[1].tobytes()
        self.assertEqual(self.compare((large, pair[1])).status_code, 422)


if __name__ == "__main__":
    unittest.main()
