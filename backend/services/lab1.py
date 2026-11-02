import cv2

from schemas.lab1 import ExperimentResult, PixelResult, PixelValue
from services.images import ImageError, check_dimensions, decode_image, encode_png, frame


def pixel_value(image, x, y):
    value = image[y, x]
    if image.ndim == 2:
        return PixelValue(intensity=int(value))
    bgr = [int(channel) for channel in value]
    return PixelValue(bgr=bgr, rgb=bgr[::-1])


def pixel_zoom(image, x, y):
    # Border replication keeps the selected pixel centered even at image edges.
    padded = cv2.copyMakeBorder(image, 4, 4, 4, 4, cv2.BORDER_REPLICATE)
    region = padded[y:y + 9, x:x + 9]
    return encode_png(cv2.resize(region, (180, 180), interpolation=cv2.INTER_NEAREST))


def execute(content, settings):
    image, notes = decode_image(content)
    result = image.copy()
    height, width = image.shape[:2]
    operation = settings.operation
    pixel = None
    if operation in {"inspect", "edit", "crop"}:
        if settings.x >= width or settings.y >= height:
            raise ImageError("Pixel coordinates must be inside the original image.")
    if operation == "grayscale":
        result = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if image.ndim == 3 else image.copy()
    elif operation == "crop":
        if settings.x + settings.width > width or settings.y + settings.height > height:
            raise ImageError("The entire crop region must fit inside the original image.")
        result = image[settings.y:settings.y + settings.height, settings.x:settings.x + settings.width].copy()
    elif operation == "resize":
        check_dimensions(settings.width, settings.height, status=422)
        methods = {"nearest": cv2.INTER_NEAREST, "linear": cv2.INTER_LINEAR, "area": cv2.INTER_AREA}
        result = cv2.resize(image, (settings.width, settings.height), interpolation=methods[settings.interpolation])
    elif operation == "rotate":
        rotations = {1: cv2.ROTATE_90_CLOCKWISE, 2: cv2.ROTATE_180, 3: cv2.ROTATE_90_COUNTERCLOCKWISE}
        if settings.quarter_turns:
            result = cv2.rotate(image, rotations[settings.quarter_turns])
    elif operation in {"inspect", "edit"}:
        if operation == "edit":
            if image.ndim == 2:
                if settings.intensity is None or settings.color is not None:
                    raise ImageError("For a grayscale image, supply only an intensity from 0 to 255.")
                result[settings.y, settings.x] = settings.intensity
            else:
                if settings.color is None or settings.intensity is not None:
                    raise ImageError("For a color image, supply only an RGB color with values from 0 to 255.")
                result[settings.y, settings.x] = settings.color[::-1]
        pixel = PixelResult(x=settings.x, y=settings.y,
                            before=pixel_value(image, settings.x, settings.y),
                            after=pixel_value(result, settings.x, settings.y),
                            before_zoom=pixel_zoom(image, settings.x, settings.y),
                            after_zoom=pixel_zoom(result, settings.x, settings.y))
    return ExperimentResult(result=frame(result, notes), pixel=pixel, operation=operation,
                            parameters=settings.model_dump(exclude_none=True), engine=f"OpenCV {cv2.__version__}")
