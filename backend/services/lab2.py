import cv2
import numpy as np

from schemas.lab2 import EdgeResult, EdgeStatistics
from services.images import decode_image, frame


def grayscale_image(content):
    image, notes = decode_image(content)
    if image.ndim == 3:
        image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        notes.append("Converted from BGR to grayscale before edge processing.")
    return image, notes


def load_grayscale(content):
    image, notes = grayscale_image(content)
    return frame(image, notes)


def scaled_display(values):
    magnitude = np.abs(values)
    maximum = float(magnitude.max())
    if maximum == 0:
        return np.zeros(values.shape, np.uint8)
    return np.rint(magnitude / maximum * 255).astype(np.uint8)


def execute(content, settings):
    image, notes = grayscale_image(content)
    blurred = cv2.GaussianBlur(image, (settings.blur_kernel, settings.blur_kernel), 0)
    sobel_x = cv2.Sobel(blurred, cv2.CV_64F, 1, 0, ksize=settings.sobel_kernel)
    sobel_y = cv2.Sobel(blurred, cv2.CV_64F, 0, 1, ksize=settings.sobel_kernel)
    magnitude = cv2.magnitude(sobel_x, sobel_y)
    # Keep OpenCV's aperture=3 and L2gradient=False defaults from the lab script.
    canny = cv2.Canny(blurred, settings.low_threshold, settings.high_threshold)
    edges = int(np.count_nonzero(canny))
    scaling = "Sobel display: round(abs(value) / maximum × 255), separately per view; zero maximum gives black. Raw gradients are float64."
    return EdgeResult(
        original=frame(image, notes), blurred=frame(blurred),
        sobel=frame(scaled_display(magnitude), [scaling]),
        sobel_x=frame(scaled_display(sobel_x), ["Absolute horizontal derivative; signed range is reported separately.", scaling]),
        sobel_y=frame(scaled_display(sobel_y), ["Absolute vertical derivative; signed range is reported separately.", scaling]),
        canny=frame(canny), parameters=settings, engine=f"OpenCV {cv2.__version__}", display_scaling=scaling,
        statistics=EdgeStatistics(sobel_max=float(magnitude.max()), sobel_x_min=float(sobel_x.min()),
                                  sobel_x_max=float(sobel_x.max()), sobel_y_min=float(sobel_y.min()),
                                  sobel_y_max=float(sobel_y.max()), canny_edge_pixels=edges,
                                  canny_edge_percent=round(edges / image.size * 100, 3)),
    )


def sample_image(kind):
    image = np.full((480, 640), 80, np.uint8)
    cv2.rectangle(image, (70, 65), (299, 234), 210, -1)
    cv2.circle(image, (435, 160), 95, 130, -1)
    cv2.rectangle(image, (255, 255), (554, 409), 35, -1)
    cv2.fillPoly(image, [np.array([[60, 410], [180, 245], [280, 410]], np.int32)], 105)
    notes = ["Optiq-generated replacement sample; the source's input.jpg was not supplied."]
    if kind == "noisy":
        noise = np.random.default_rng(42).normal(0, 18, image.shape)
        image = np.clip(image.astype(np.float64) + noise, 0, 255).astype(np.uint8)
        notes.append("Gaussian noise: seed 42, standard deviation 18, clipped to uint8.")
    return frame(image, notes)
