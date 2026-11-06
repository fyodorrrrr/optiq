from time import perf_counter

import cv2
import numpy as np

from schemas.lab4 import Capabilities, Capability, FeatureComparison, FeatureResult, FeatureSettings, SamplePair
from services.images import ImageError, decode_image, frame, mascot_image

ALGORITHMS = [("surf", "SURF"), ("sift", "SIFT"), ("orb", "ORB")]
from services.runtime_profile import PROFILE

MAX_FEATURE_PIXELS = min(1_000_000, PROFILE.max_pixels)
MAX_MATCH_PIXELS = min(2_000_000, PROFILE.max_pixels * 2)


def grayscale_image(content):
    image, notes = decode_image(content)
    if image.shape[0] * image.shape[1] > MAX_FEATURE_PIXELS:
        raise ImageError("Feature experiments support at most one million pixels per image. Resize the image in Lab 1 first.")
    if image.ndim == 3:
        image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        notes.append("Converted to grayscale for feature comparison.")
    return image, notes


def load_image(content):
    image, notes = grayscale_image(content)
    return frame(image, notes)


def detector_factory(name, settings):
    if name == "surf":
        return cv2.xfeatures2d.SURF_create(hessianThreshold=settings.hessian_threshold, upright=settings.upright, extended=False)
    if name == "sift":
        return cv2.SIFT_create(nfeatures=settings.max_features)
    return cv2.ORB_create(nfeatures=settings.max_features)


def unavailable_message(name):
    if name == "surf":
        return "SURF is not enabled in this OpenCV build. A SURF-enabled build is required; SIFT and ORB are separate comparisons, not SURF substitutes."
    return f"{name.upper()} is unavailable in this OpenCV build."


def capabilities():
    algorithms = []
    for name, title in ALGORITHMS:
        try:
            detector_factory(name, FeatureSettings())
            algorithms.append(Capability(id=name, title=title, available=True))
        except (cv2.error, AttributeError):
            algorithms.append(Capability(id=name, title=title, available=False, reason=unavailable_message(name)))
    return Capabilities(engine=f"OpenCV {cv2.__version__}", algorithms=algorithms)


def detect_and_describe(detector, image, maximum):
    start = perf_counter()
    keypoints = sorted(detector.detect(image, None), key=lambda point: point.response, reverse=True)[:maximum]
    if keypoints:
        keypoints, descriptors = detector.compute(image, keypoints)
    else:
        descriptors = None
    return keypoints, descriptors, (perf_counter() - start) * 1000


def compare_algorithm(name, first, second, settings):
    try:
        detector = detector_factory(name, settings)
    except (cv2.error, AttributeError):
        return FeatureResult(algorithm=name, status="unavailable", message=unavailable_message(name))
    try:
        keypoints_first, descriptors_first, first_ms = detect_and_describe(detector, first, settings.max_features)
        keypoints_second, descriptors_second, second_ms = detect_and_describe(detector, second, settings.max_features)
        norm = cv2.NORM_HAMMING if name == "orb" else cv2.NORM_L2
        start = perf_counter()
        good = []
        if descriptors_first is not None and descriptors_second is not None and len(descriptors_second) >= 2:
            neighbors = cv2.BFMatcher(norm, crossCheck=False).knnMatch(descriptors_first, descriptors_second, k=2)
            good = [pair[0] for pair in neighbors if len(pair) == 2 and pair[0].distance < settings.ratio_threshold * pair[1].distance]
            good.sort(key=lambda match: match.distance)
        match_ms = (perf_counter() - start) * 1000
        shown = good[:settings.max_matches]
        color = (80, 150, 40)
        first_view = cv2.drawKeypoints(first, keypoints_first, None, color, cv2.DRAW_MATCHES_FLAGS_DRAW_RICH_KEYPOINTS)
        second_view = cv2.drawKeypoints(second, keypoints_second, None, color, cv2.DRAW_MATCHES_FLAGS_DRAW_RICH_KEYPOINTS)
        matches = cv2.drawMatches(first, keypoints_first, second, keypoints_second, shown, None,
                                  matchColor=color, singlePointColor=color, flags=cv2.DrawMatchesFlags_NOT_DRAW_SINGLE_POINTS)
        message = None if descriptors_first is not None and descriptors_second is not None else "No usable descriptors in one or both images. Try a textured image or different settings."
        return FeatureResult(
            algorithm=name, status="ok", message=message,
            keypoints_first=len(keypoints_first), keypoints_second=len(keypoints_second),
            descriptor_dimensions=detector.descriptorSize(), descriptor_dtype="uint8" if detector.descriptorType() == cv2.CV_8U else "float32",
            norm="Hamming" if name == "orb" else "L2", first_ms=round(first_ms, 5), second_ms=round(second_ms, 5), match_ms=round(match_ms, 5),
            good_matches=len(good), displayed_matches=len(shown),
            keypoints_first_image=frame(first_view), keypoints_second_image=frame(second_view), matches_image=frame(matches),
        )
    except cv2.error:
        return FeatureResult(algorithm=name, status="error", message="This detector could not process the image pair. Try another pair or settings.")


def execute(first_content, second_content, settings):
    first, first_notes = grayscale_image(first_content)
    second, second_notes = grayscale_image(second_content)
    if (first.shape[1] + second.shape[1]) * max(first.shape[0], second.shape[0]) > MAX_MATCH_PIXELS:
        raise ImageError("The combined match canvas is too large. Use smaller, similarly sized images.")
    results = [compare_algorithm(name, first, second, settings) for name, _ in ALGORITHMS]
    return FeatureComparison(algorithms=results, parameters=settings, engine=f"OpenCV {cv2.__version__}", notes=[
        *first_notes, *second_notes,
        "All algorithms receive the same grayscale pair and feature budget; SURF is response-capped after detection.",
        "Ratio test: nearest distance < ratio × second-nearest distance. Match counts are not accuracy or geometric verification.",
        "Timings are measured for this single run, including detect/describe per image and matching separately; they are not controlled benchmarks.",
    ])


def sample_pair(kind):
    if kind == 'mascot':
        image, notes = mascot_image('compare')
        height, width = image.shape[:2]
        transform = cv2.getRotationMatrix2D((width / 2, height / 2), 25, .9)
        target = cv2.warpAffine(image, transform, (width, height), flags=cv2.INTER_LINEAR, borderValue=(245, 247, 247))
        return SamplePair(first=frame(image, notes), second=frame(target, [*notes, '25° rotation, scale 0.9, linear resampling.']),
                          notes=[*notes, 'Second mascot view: 25° rotation, scale 0.9, linear resampling.',
                                 'Candidate matches are not automatically scored against the known transform.'])
    image = np.full((480, 640), 225, np.uint8)
    rng = np.random.default_rng(42)
    for index in range(40):
        x, y = 20 + index % 8 * 76, 18 + index // 8 * 90
        shade = int(rng.integers(15, 160))
        cv2.rectangle(image, (x, y), (x + 52, y + 60), shade, 2)
        cv2.circle(image, (x + 26, y + 22), int(rng.integers(4, 15)), shade, -1)
        cv2.putText(image, str(index), (x + 8, y + 52), cv2.FONT_HERSHEY_SIMPLEX, .42, shade, 1, cv2.LINE_AA)
        cv2.line(image, (x, y + 60), (x + int(rng.integers(10, 50)), y + 3), shade, 1)
    angle, scale = (25, .9) if kind == "rotated" else (0, .65)
    transform = cv2.getRotationMatrix2D((320, 240), angle, scale)
    target = cv2.warpAffine(image, transform, (640, 480), flags=cv2.INTER_LINEAR, borderValue=225)
    return SamplePair(first=frame(image), second=frame(target), notes=[
        f"Optiq-generated feature target, seed 42; second image: {angle}° rotation, scale {scale}, linear resampling.",
        "No external sample asset; geometry is known for exploration, but matches are not automatically scored against it.",
    ])
