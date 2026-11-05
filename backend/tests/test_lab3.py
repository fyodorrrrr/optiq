import base64
import io
import json
import unittest

import cv2
import numpy as np
from PIL import Image

from api_client import api_client


def png(image):
    return cv2.imencode(".png", image)[1].tobytes()


class Lab3Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = api_client()
        cls.gray = np.tile(np.arange(80, 112, dtype=np.uint8), (24, 1))
        cls.image = png(cls.gray)

    def run_contrast(self, settings=None, image=None):
        return self.client.post("/api/labs/3/experiment", files={"file": ("image.png", self.image if image is None else image, "image/png")},
                                data={"settings": json.dumps(settings or {})})

    def decode(self, result):
        data = base64.b64decode(result["frame"]["image"].split(",")[1])
        return cv2.imdecode(np.frombuffer(data, np.uint8), cv2.IMREAD_UNCHANGED)

    def test_all_histograms_match_the_displayed_images_and_pixel_totals(self):
        response = self.run_contrast()
        self.assertEqual(response.status_code, 200, response.text)
        data = response.json()
        for name in ["original", "equalized", "clahe", "linear"]:
            with self.subTest(method=name):
                image = self.decode(data[name])
                expected = np.bincount(image.ravel(), minlength=256).tolist()
                self.assertEqual(data[name]["histogram"], expected)
                self.assertEqual(sum(expected), self.gray.size)
                self.assertEqual(data[name]["frame"]["shape"], [24, 32])
        self.assertEqual(data["channel"], "Grayscale intensity")

    def test_equalization_and_clahe_use_actual_opencv_processing(self):
        data = self.run_contrast().json()
        np.testing.assert_array_equal(self.decode(data["equalized"]), cv2.equalizeHist(self.gray))
        expected = cv2.createCLAHE(clipLimit=2, tileGridSize=(8, 8)).apply(self.gray)
        np.testing.assert_array_equal(self.decode(data["clahe"]), expected)
        self.assertEqual(data["equalized"]["statistics"]["minimum"], 0)
        self.assertEqual(data["equalized"]["statistics"]["maximum"], 255)
        self.assertEqual(data["parameters"]["clip_limit"], 2)

    def test_linear_adjustment_clips_without_absolute_value(self):
        image = np.array([[0, 10, 100, 200, 255]], np.uint8)
        data = self.run_contrast({"alpha": 2, "beta": -30}, png(image)).json()
        np.testing.assert_array_equal(self.decode(data["linear"]), [[0, 0, 170, 255, 255]])
        self.assertEqual(data["linear_transform"]["scale"], 2)
        self.assertEqual(data["linear_transform"]["offset"], -30)

    def test_stretch_and_constant_input(self):
        image = np.array([[40, 50, 60]], np.uint8)
        data = self.run_contrast({"linear_method": "stretch"}, png(image)).json()
        np.testing.assert_array_equal(self.decode(data["linear"]), [[0, 128, 255]])
        constant = np.full((8, 12), 90, np.uint8)
        data = self.run_contrast({"linear_method": "stretch"}, png(constant)).json()
        np.testing.assert_array_equal(self.decode(data["linear"]), constant)
        np.testing.assert_array_equal(self.decode(data["equalized"]), constant)
        for name in ["original", "equalized", "clahe", "linear"]:
            self.assertEqual(sum(data[name]["histogram"]), 96)
        self.assertIn("constant", data["linear_transform"]["note"].lower())

    def test_color_equalization_is_on_y_and_histogram_matches_final_bgr(self):
        color = np.stack([self.gray, self.gray + 15, self.gray + 35], axis=-1)
        data = self.run_contrast({"mode": "color"}, png(color)).json()
        yuv = cv2.cvtColor(color, cv2.COLOR_BGR2YUV)
        yuv[:, :, 0] = cv2.equalizeHist(yuv[:, :, 0])
        expected = cv2.cvtColor(yuv, cv2.COLOR_YUV2BGR)
        np.testing.assert_array_equal(self.decode(data["equalized"]), expected)
        self.assertEqual(data["channel"], "Y brightness (YUV)")
        for name in ["original", "equalized", "clahe", "linear"]:
            image = self.decode(data[name])
            self.assertEqual(image.shape, color.shape)
            channel = cv2.cvtColor(image, cv2.COLOR_BGR2YUV)[:, :, 0]
            self.assertEqual(data[name]["histogram"], np.bincount(channel.ravel(), minlength=256).tolist())
        gray_result = self.run_contrast({"mode": "grayscale"}, png(color)).json()
        np.testing.assert_array_equal(self.decode(gray_result["original"]), cv2.cvtColor(color, cv2.COLOR_BGR2GRAY))
        self.assertEqual(self.run_contrast({"mode": "color"}).status_code, 422)

    def test_settings_change_output_and_are_reproducible(self):
        image = np.random.default_rng(7).integers(70, 140, (64, 80), dtype=np.uint8)
        content = png(image)
        a = self.run_contrast({"clip_limit": 1, "tiles_x": 2, "tiles_y": 2}, content).json()
        b = self.run_contrast({"clip_limit": 8, "tiles_x": 8, "tiles_y": 8}, content).json()
        self.assertFalse(np.array_equal(self.decode(a["clahe"]), self.decode(b["clahe"])))
        repeated = self.run_contrast({"clip_limit": 8, "tiles_x": 8, "tiles_y": 8}, content).json()
        self.assertEqual(b["clahe"]["histogram"], repeated["clahe"]["histogram"])

    def test_samples_and_load(self):
        for kind in ["low-contrast", "uneven", "color"]:
            response = self.client.get(f"/api/labs/3/sample?kind={kind}")
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json()["channels"], 3 if kind == "color" else 1)
        self.assertEqual(self.client.get("/api/labs/3/sample?kind=uneven").json()["image"],
                         self.client.get("/api/labs/3/sample?kind=uneven").json()["image"])
        loaded = self.client.post("/api/labs/3/load", files={"file": ("a.png", self.image, "image/png")})
        self.assertEqual(loaded.status_code, 200)
        self.assertEqual(loaded.json()["shape"], [24, 32])

    def test_reject_invalid_inputs_and_settings(self):
        for settings in [{"clip_limit": 0}, {"clip_limit": 41}, {"clip_limit": float("nan")},
                         {"tiles_x": 0}, {"tiles_y": 17}, {"tiles_x": 2.5}, {"tiles_x": True},
                         {"alpha": -1}, {"alpha": 11}, {"beta": 256}, {"beta": -256},
                         {"beta": 0.5}, {"mode": "rgb"}, {"linear_method": "unknown"}, {"unexpected": 1}]:
            with self.subTest(settings=settings):
                self.assertEqual(self.run_contrast(settings).status_code, 422)
        self.assertEqual(self.run_contrast(image=b"bad image").status_code, 422)
        self.assertEqual(self.run_contrast(image=b"x" * (5 * 1024 * 1024 + 1)).status_code, 413)
        bad = self.client.post("/api/labs/3/experiment", files={"file": ("a.png", self.image, "image/png")}, data={"settings": "bad JSON"})
        self.assertEqual(bad.status_code, 422)


if __name__ == "__main__":
    unittest.main()
