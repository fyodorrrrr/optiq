import cv2
import numpy as np

from schemas.lab3 import ContrastResult, ContrastView, IntensityStatistics, LinearTransform
from services.images import ImageError, decode_image, frame


def channel_of(image):
    return image if image.ndim == 2 else cv2.cvtColor(image, cv2.COLOR_BGR2YUV)[:, :, 0]


def view(image, notes=None):
    # Measure the final display image, not an intermediate Y channel that might
    # change through YUV -> BGR gamut clipping and integer rounding.
    channel = channel_of(image)
    counts = np.bincount(channel.ravel(), minlength=256)
    return ContrastView(
        frame=frame(image, notes), histogram=counts.tolist(),
        statistics=IntensityStatistics(minimum=int(channel.min()), maximum=int(channel.max()),
                                       mean=float(channel.mean()), standard_deviation=float(channel.std()),
                                       occupied_bins=int(np.count_nonzero(counts))),
    )


def execute(content, settings):
    image, notes = decode_image(content)
    if settings.mode == "color" and image.ndim != 3:
        raise ImageError("This image is already grayscale. Choose Grayscale mode or upload a color image.")
    yuv = None
    if settings.mode == "grayscale":
        original = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if image.ndim == 3 else image.copy()
        channel = original
        channel_name = "Grayscale intensity"
    else:
        original = image.copy()
        yuv = cv2.cvtColor(image, cv2.COLOR_BGR2YUV)
        channel = yuv[:, :, 0]
        channel_name = "Y brightness (YUV)"

    def rebuild(processed):
        if yuv is None:
            return processed
        result = yuv.copy()
        result[:, :, 0] = processed
        return cv2.cvtColor(result, cv2.COLOR_YUV2BGR)

    equalized = rebuild(cv2.equalizeHist(channel))
    adaptive = cv2.createCLAHE(clipLimit=settings.clip_limit, tileGridSize=(settings.tiles_x, settings.tiles_y))
    clahe = rebuild(adaptive.apply(channel))
    scale, offset = settings.alpha, float(settings.beta)
    linear_note = "Manual adjustment: clip(rint(alpha × intensity + beta), 0, 255)."
    if settings.linear_method == "stretch":
        minimum, maximum = int(channel.min()), int(channel.max())
        if minimum == maximum:
            scale, offset = 1.0, 0.0
            linear_note = "The input channel is constant; stretching leaves it unchanged."
        else:
            scale = 255.0 / (maximum - minimum)
            offset = -minimum * scale
            linear_note = "Full-range stretch: observed minimum maps to 0 and maximum to 255."
    linear_channel = np.clip(np.rint(channel.astype(np.float64) * scale + offset), 0, 255).astype(np.uint8)
    linear = rebuild(linear_channel)
    result_notes = ["Every method uses the same original working image; methods are not chained.",
                    "Histograms count one grayscale/Y brightness value per pixel of each final displayed image."]
    if yuv is not None:
        result_notes.append("Color mode modifies Y in YUV and retains U/V before reconstruction. Gamut clipping/rounding can affect final brightness and color; histograms measure the reconstructed BGR image.")
    return ContrastResult(
        original=view(original, notes), equalized=view(equalized), clahe=view(clahe), linear=view(linear),
        parameters=settings, channel=channel_name, engine=f"OpenCV {cv2.__version__}", notes=result_notes,
        linear_transform=LinearTransform(scale=scale, offset=offset, note=linear_note),
    )


def sample_image(kind):
    x = np.linspace(0, 1, 640)
    base = np.tile(85 + 25 * x, (480, 1)).astype(np.uint8)
    cv2.rectangle(base, (65, 70), (300, 240), 115, -1)
    cv2.circle(base, (440, 175), 90, 95, -1)
    cv2.rectangle(base, (230, 285), (565, 415), 78, -1)
    notes = ["Optiq-generated low-contrast study; no external image asset."]
    image = base
    if kind == "uneven":
        lighting = np.tile(np.linspace(-45, 60, 640), (480, 1))
        noise = np.random.default_rng(42).normal(0, 2.5, base.shape)
        image = np.clip(base.astype(np.float64) + lighting + noise, 0, 255).astype(np.uint8)
        notes.append("Uneven lighting plus Gaussian noise: seed 42, standard deviation 2.5.")
    elif kind == "color":
        image = np.stack([base - 15, base, base + 20], axis=-1)
        notes.append("Color channels derived from the same low-contrast study.")
    return frame(image, notes)
