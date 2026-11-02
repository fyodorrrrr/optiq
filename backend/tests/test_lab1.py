import io
import json
import unittest

from fastapi.testclient import TestClient
from PIL import Image

from main import app


def png(mode="RGB", size=(3, 2), pixels=None):
    image = Image.new(mode, size)
    if pixels is not None:
        image.putdata(pixels)
    stream = io.BytesIO()
    image.save(stream, format="PNG")
    return stream.getvalue()


class Lab1Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.image = png(pixels=[(255, 0, 0), (0, 255, 0), (0, 0, 255),
                                (255, 255, 255), (0, 0, 0), (10, 20, 30)])

    def upload(self, data=None, filename="test.png", mime="image/png"):
        return self.client.post("/api/labs/1/load", files={"file": (filename, self.image if data is None else data, mime)})

    def run_op(self, operation, data=None, **params):
        return self.client.post("/api/labs/1/experiment", files={"file": ("test.png", data or self.image, "image/png")},
                                data={"settings": json.dumps({"operation": operation, **params})})

    def decoded(self, frame):
        import base64
        return Image.open(io.BytesIO(base64.b64decode(frame["image"].split(",")[1])))

    def test_load_metadata_and_color_order(self):
        response = self.upload()
        self.assertEqual(response.status_code, 200, response.text)
        frame = response.json()
        self.assertEqual(frame["shape"], [2, 3, 3])
        self.assertEqual(frame["color_space"], "BGR")
        self.assertEqual(self.decoded(frame).getpixel((0, 0)), (255, 0, 0))

    def test_pixel_inspection_and_grayscale(self):
        response = self.run_op("inspect", x=0, y=0)
        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(response.json()["pixel"]["before"]["bgr"], [0, 0, 255])
        self.assertEqual(response.json()["pixel"]["before"]["rgb"], [255, 0, 0])
        result = self.run_op("grayscale").json()["result"]
        self.assertEqual(result["shape"], [2, 3])
        self.assertEqual(result["channels"], 1)
        self.assertEqual(self.decoded(result).getpixel((0, 0)), 76)

    def test_edit_changes_only_one_pixel_and_original_is_preserved(self):
        response = self.run_op("edit", x=1, y=0, color=[12, 34, 56])
        self.assertEqual(response.status_code, 200, response.text)
        result = self.decoded(response.json()["result"])
        self.assertEqual(result.getpixel((1, 0)), (12, 34, 56))
        self.assertEqual(result.getpixel((0, 0)), (255, 0, 0))
        self.assertEqual(response.json()["pixel"]["after"]["bgr"], [56, 34, 12])
        again = self.run_op("inspect", x=1, y=0).json()
        self.assertEqual(again["pixel"]["before"]["rgb"], [0, 255, 0])

    def test_crop_resize_and_clockwise_rotation(self):
        crop = self.run_op("crop", x=1, y=0, width=2, height=2).json()["result"]
        self.assertEqual(crop["shape"], [2, 2, 3])
        self.assertEqual(self.decoded(crop).getpixel((0, 0)), (0, 255, 0))
        resize = self.run_op("resize", width=6, height=4, interpolation="nearest").json()["result"]
        self.assertEqual(resize["shape"], [4, 6, 3])
        self.assertEqual(self.decoded(resize).getpixel((1, 1)), (255, 0, 0))
        small = self.run_op("resize", width=1, height=1, interpolation="area")
        self.assertEqual(small.status_code, 200)
        rotation = self.run_op("rotate").json()["result"]
        self.assertEqual(rotation["shape"], [3, 2, 3])
        self.assertEqual(self.decoded(rotation).getpixel((0, 0)), (255, 255, 255))
        self.assertEqual(self.decoded(rotation).getpixel((1, 0)), (255, 0, 0))

    def test_grayscale_upload_and_pixel_edit(self):
        gray = png("L", (1, 1), [123])
        self.assertEqual(self.upload(gray).json()["channels"], 1)
        pixel = self.run_op("inspect", gray, x=0, y=0).json()["pixel"]
        self.assertEqual(pixel["before"]["intensity"], 123)
        edited = self.run_op("edit", gray, x=0, y=0, intensity=200).json()["result"]
        self.assertEqual(self.decoded(edited).getpixel((0, 0)), 200)
        self.assertEqual(self.run_op("edit", gray, x=0, y=0, color=[1, 2, 3]).status_code, 422)

    def test_alpha_is_composited_on_white(self):
        rgba = png("RGBA", (1, 1), [(255, 0, 0, 0)])
        frame = self.upload(rgba).json()
        self.assertEqual(self.decoded(frame).getpixel((0, 0)), (255, 255, 255))
        self.assertTrue(frame["notes"])

    def test_jpeg_upload(self):
        stream = io.BytesIO()
        Image.new("RGB", (4, 5), (20, 40, 80)).save(stream, format="JPEG")
        response = self.upload(stream.getvalue(), "test.jpg", "image/jpeg")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["shape"], [5, 4, 3])

    def test_samples_are_actual_color_and_grayscale_images(self):
        for kind, channels in [("color", 3), ("grayscale", 1)]:
            response = self.client.get(f"/api/labs/1/sample?kind={kind}")
            self.assertEqual(response.status_code, 200, response.text)
            self.assertEqual(response.json()["channels"], channels)
            self.assertEqual(self.decoded(response.json()).size, (640, 480))

    def test_reject_corrupt_unsupported_and_oversized_images(self):
        for content in [b"", b"not an image", self.image[:30]]:
            self.assertEqual(self.upload(content).status_code, 422)
        stream = io.BytesIO()
        Image.new("RGB", (1, 1)).save(stream, format="GIF")
        self.assertEqual(self.upload(stream.getvalue()).status_code, 415)
        self.assertEqual(self.upload(self.image, mime="text/plain").status_code, 415)
        self.assertEqual(self.upload(png(size=(4097, 1))).status_code, 413)
        self.assertEqual(self.upload(png(size=(2100, 2100))).status_code, 413)
        self.assertEqual(self.upload(b"x" * (5 * 1024 * 1024 + 1)).status_code, 413)

    def test_unsupported_depth_and_pixel_zoom_at_boundary(self):
        stream = io.BytesIO()
        Image.new("I;16", (2, 2)).save(stream, format="PNG")
        self.assertEqual(self.upload(stream.getvalue()).status_code, 415)
        pixel = self.run_op("inspect", x=0, y=0).json()["pixel"]
        zoom = self.decoded({"image": pixel["before_zoom"]})
        self.assertEqual(zoom.size, (180, 180))
        self.assertEqual(zoom.getpixel((90, 90)), (255, 0, 0))
        self.assertEqual(zoom.getpixel((0, 0)), (255, 0, 0))

    def test_parameter_validation(self):
        cases = [("inspect", {"x": 3, "y": 0}), ("inspect", {"x": -1, "y": 0}),
                 ("inspect", {"x": 0.5, "y": 0}), ("crop", {"x": 2, "y": 0, "width": 2, "height": 1}),
                 ("resize", {"width": 0, "height": 1}), ("resize", {"width": 4096, "height": 4096}),
                 ("resize", {"width": 3, "height": 2, "interpolation": "invalid"}),
                 ("edit", {"x": 0, "y": 0, "color": [256, 0, 0]}),
                 ("rotate", {"unknown": 1}), ("invalid", {})]
        for operation, params in cases:
            with self.subTest(operation=operation, params=params):
                self.assertEqual(self.run_op(operation, **params).status_code, 422)
        response = self.client.post("/api/labs/1/experiment", files={"file": ("a.png", self.image, "image/png")}, data={"settings": "bad JSON"})
        self.assertEqual(response.status_code, 422)


if __name__ == "__main__":
    unittest.main()
