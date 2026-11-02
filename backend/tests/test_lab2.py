import base64
import io
import json
import unittest

import cv2
import numpy as np
from fastapi.testclient import TestClient
from PIL import Image

from main import app


def image_bytes(image):
    return cv2.imencode(".png", image)[1].tobytes()


class Lab2Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.step = np.zeros((64, 96), np.uint8)
        cls.step[:, 48:] = 255
        cls.image = image_bytes(cls.step)

    def run_edges(self, settings=None, image=None):
        return self.client.post("/api/labs/2/experiment", files={"file": ("input.png", self.image if image is None else image, "image/png")},
                                data={"settings": json.dumps(settings or {})})

    def decode(self, frame):
        return np.asarray(Image.open(io.BytesIO(base64.b64decode(frame["image"].split(",")[1]))))

    def test_baseline_uses_shared_grayscale_blur_and_preserves_dimensions(self):
        response = self.run_edges()
        self.assertEqual(response.status_code, 200, response.text)
        data = response.json()
        self.assertEqual(data["parameters"], {"blur_kernel": 3, "sobel_kernel": 3, "low_threshold": 100, "high_threshold": 200})
        blur = cv2.GaussianBlur(self.step, (3, 3), 0)
        np.testing.assert_array_equal(self.decode(data["original"]), self.step)
        np.testing.assert_array_equal(self.decode(data["blurred"]), blur)
        np.testing.assert_array_equal(self.decode(data["canny"]), cv2.Canny(blur, 100, 200))
        for name in ["original", "blurred", "sobel", "canny", "sobel_x", "sobel_y"]:
            self.assertEqual(data[name]["shape"], [64, 96])
            self.assertEqual(data[name]["channels"], 1)

    def test_directional_gradients_and_scaled_magnitude(self):
        data = self.run_edges().json()
        self.assertGreater(self.decode(data["sobel_x"]).max(), 0)
        self.assertEqual(self.decode(data["sobel_y"]).max(), 0)
        self.assertEqual(self.decode(data["sobel"]).max(), 255)
        self.assertTrue(np.any(self.decode(data["canny"])[:, 46:50]))
        self.assertEqual(data["statistics"]["sobel_max"], 764.0)
        self.assertIn("255", data["display_scaling"])

    def test_uniform_image_has_no_edges_or_division_errors(self):
        data = self.run_edges(image=image_bytes(np.full((32, 40), 120, np.uint8))).json()
        for name in ["sobel", "sobel_x", "sobel_y", "canny"]:
            self.assertEqual(int(self.decode(data[name]).sum()), 0)
        self.assertEqual(data["statistics"]["sobel_max"], 0)
        self.assertEqual(data["statistics"]["canny_edge_pixels"], 0)

    def test_color_input_conversion_and_single_pixel_input(self):
        color = np.zeros((4, 5, 3), np.uint8)
        color[:, :] = (0, 0, 255)
        data = self.run_edges(image=image_bytes(color)).json()
        self.assertEqual(int(self.decode(data["original"])[0, 0]), 76)
        tiny = self.run_edges(image=image_bytes(np.zeros((1, 1), np.uint8)))
        self.assertEqual(tiny.status_code, 200, tiny.text)

    def test_noise_is_reproducible_and_settings_change_actual_outputs(self):
        responses = [self.client.get("/api/labs/2/sample?kind=noisy") for _ in range(2)]
        self.assertEqual(responses[0].status_code, 200)
        self.assertEqual(responses[0].json()["image"], responses[1].json()["image"])
        content = base64.b64decode(responses[0].json()["image"].split(",")[1])
        low = self.run_edges({"low_threshold": 20, "high_threshold": 40}, content).json()
        high = self.run_edges({"low_threshold": 200, "high_threshold": 400}, content).json()
        self.assertGreater(low["statistics"]["canny_edge_pixels"], high["statistics"]["canny_edge_pixels"])
        smooth = self.run_edges({"blur_kernel": 7}, content).json()
        self.assertFalse(np.array_equal(self.decode(low["blurred"]), self.decode(smooth["blurred"])))

    def test_load_and_sample_provenance(self):
        response = self.client.post("/api/labs/2/load", files={"file": ("input.png", self.image, "image/png")})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["channels"], 1)
        sample = self.client.get("/api/labs/2/sample?kind=shapes")
        self.assertEqual(sample.status_code, 200)
        self.assertEqual(sample.json()["shape"], [480, 640])
        self.assertIn("replacement", " ".join(sample.json()["notes"]).lower())
        self.assertEqual(self.client.get("/api/labs/2/sample?kind=unknown").status_code, 422)

    def test_reject_invalid_settings_and_files(self):
        invalid = [{"blur_kernel": 2}, {"blur_kernel": 11}, {"sobel_kernel": 9},
                   {"blur_kernel": True}, {"low_threshold": -1}, {"high_threshold": 2049},
                   {"low_threshold": 200, "high_threshold": 100}, {"low_threshold": 100, "high_threshold": 100},
                   {"low_threshold": 10.5}, {"unexpected": 1}]
        for settings in invalid:
            with self.subTest(settings=settings):
                self.assertEqual(self.run_edges(settings).status_code, 422)
        self.assertEqual(self.run_edges(image=b"not an image").status_code, 422)
        self.assertEqual(self.run_edges(image=b"x" * (5 * 1024 * 1024 + 1)).status_code, 413)
        response = self.client.post("/api/labs/2/experiment", files={"file": ("a.png", self.image, "image/png")}, data={"settings": "bad JSON"})
        self.assertEqual(response.status_code, 422)


if __name__ == "__main__":
    unittest.main()
