import base64
import io

import cv2
import numpy as np
from PIL import Image, UnidentifiedImageError

from schemas.lab1 import Frame

MAX_BYTES = 5 * 1024 * 1024
MAX_SIDE = 4096
MAX_PIXELS = 4_000_000


class ImageError(ValueError):
    def __init__(self, message, status=422):
        super().__init__(message)
        self.status = status


def check_dimensions(width, height, status=413):
    if width > MAX_SIDE or height > MAX_SIDE or width * height > MAX_PIXELS:
        raise ImageError("Images must be at most 4096px per side and 4 million pixels total.", status)


def decode_image(content):
    if not content:
        raise ImageError("Choose a non-empty PNG or JPEG image.")
    if len(content) > MAX_BYTES:
        raise ImageError("Choose an image no larger than 5 MiB.", 413)
    try:
        with Image.open(io.BytesIO(content)) as header:
            if header.format not in {"PNG", "JPEG"}:
                raise ImageError("Only PNG and JPEG images are supported.", 415)
            check_dimensions(*header.size)
            if header.mode not in {"RGB", "RGBA", "L", "LA", "P"}:
                raise ImageError("Use an 8-bit grayscale, RGB, or RGBA PNG/JPEG image.", 415)
            header.verify()
    except ImageError:
        raise
    except (Image.DecompressionBombError, Image.DecompressionBombWarning):
        raise ImageError("The decoded image is too large.", 413) from None
    except (UnidentifiedImageError, OSError, ValueError, SyntaxError):
        raise ImageError("The image is invalid or incomplete. Choose a valid PNG or JPEG.") from None
    try:
        image = cv2.imdecode(np.frombuffer(content, dtype=np.uint8), cv2.IMREAD_UNCHANGED)
    except cv2.error:
        raise ImageError("OpenCV could not decode this image.") from None
    if image is None or image.dtype != np.uint8:
        raise ImageError("OpenCV requires a valid 8-bit image.")
    check_dimensions(image.shape[1], image.shape[0])
    notes = ["EXIF orientation is not applied; coordinates follow the decoded pixel array."]
    if image.ndim == 3 and image.shape[2] == 4:
        alpha = image[:, :, 3:4].astype(np.float32) / 255
        image = np.rint(image[:, :, :3] * alpha + 255 * (1 - alpha)).astype(np.uint8)
        notes.append("Transparency was composited onto white before processing.")
    if image.ndim not in {2, 3} or (image.ndim == 3 and image.shape[2] != 3):
        raise ImageError("Unsupported channel layout.", 415)
    return image, notes


def encode_png(image):
    success, encoded = cv2.imencode(".png", image)
    if not success:
        raise ImageError("The result could not be encoded.")
    return "data:image/png;base64," + base64.b64encode(encoded).decode("ascii")


def frame(image, notes=None):
    return Frame(image=encode_png(image), width=image.shape[1], height=image.shape[0],
                 channels=1 if image.ndim == 2 else 3, shape=list(image.shape),
                 dtype=str(image.dtype), color_space="Grayscale" if image.ndim == 2 else "BGR",
                 notes=notes or [])


def sample_image(kind):
    image = np.full((480, 640, 3), (207, 224, 230), dtype=np.uint8)
    cv2.rectangle(image, (70, 65), (299, 234), (62, 82, 201), -1)
    cv2.circle(image, (435, 160), 95, (70, 178, 230), -1)
    cv2.rectangle(image, (255, 255), (554, 409), (122, 95, 49), -1)
    cv2.fillPoly(image, [np.array([[60, 410], [180, 245], [280, 410]], np.int32)], (80, 117, 71))
    if kind == "grayscale":
        image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    return frame(image, ["Optiq-generated geometric color study; no external image asset."])
