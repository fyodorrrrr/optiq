import hashlib
import importlib.util
from importlib.metadata import PackageNotFoundError, version
import json
import os
from pathlib import Path
from threading import Lock
from time import perf_counter

import cv2
import numpy as np

from schemas.lab6 import DatasetArtifact, Detection, ModelInfo, Result, Settings, Status, TrainingArtifact
from pydantic import ValidationError
from services.images import ImageError, decode_image, frame
from services.public_metadata import public_message, public_training

ROOT = Path(__file__).resolve().parents[1] / '.cache' / 'lab6'
INFERENCE_LOCK = Lock()
MODEL_CACHE = {}


def read_artifact(name, fallback):
    path = ROOT / name
    if not path.exists():
        return fallback
    try:
        if path.stat().st_size > 2_000_000:
            raise ValueError('Artifact too large')
        value = json.loads(path.read_text())
        if not isinstance(value, dict):
            raise ValueError('Expected object')
        return value
    except (ValueError, OSError):
        return {'status': 'invalid', 'message': 'The local artifact is invalid. Recreate it using the Lab 6 scripts.'}


def model_path(kind):
    return ROOT / ('yolo11n.pt' if kind == 'pretrained' else 'custom/best.pt')


def runtime_version(name):
    try:
        return version(name)
    except PackageNotFoundError:
        return 'not installed'


def weight_hash(path):
    digest = hashlib.sha256()
    with path.open('rb') as content:
        for chunk in iter(lambda: content.read(1024 * 1024), b''):
            digest.update(chunk)
    return digest.hexdigest()


def status():
    runtime = importlib.util.find_spec('ultralytics') is not None and importlib.util.find_spec('torch') is not None and hasattr(cv2, 'imshow') and hasattr(cv2, 'VideoCapture')
    training = read_artifact('training.json', {'status': 'pending', 'message': 'Custom training is pending. Prepare an annotated dataset and run the local training workflow.'})
    dataset = read_artifact('dataset.json', {'ready': False, 'message': 'No custom dataset has been validated yet.'})
    try:
        training = TrainingArtifact.model_validate(training).model_dump(exclude_none=True)
        if training['status'] == 'completed' and not all(training.get(key) for key in ['metrics', 'epochs_completed', 'history', 'weight_sha256', 'dataset_sha256', 'evaluation_split']):
            raise ValueError('Incomplete completed run')
    except (ValidationError, ValueError):
        training = {'status': 'invalid', 'message': 'Training artifacts are incomplete or invalid. Recreate them with the local script.'}
    bottle_split = None
    try:
        validated_dataset = DatasetArtifact.model_validate(dataset)
        if (ROOT / 'bottle.jpg').is_file() and training.get('dataset_sha256') == validated_dataset.sha256:
            bottle_split = validated_dataset.image_splits.get(weight_hash(ROOT / 'bottle.jpg'))
        dataset = validated_dataset.model_dump(exclude_none=True)
    except ValidationError:
        dataset = {'ready': False, 'message': 'The dataset manifest is invalid. Validate the dataset again.'}
    dataset['message'] = public_message(dataset.get('message', ''))
    custom = model_path('custom')
    custom_ready = False
    if runtime and training.get('status') == 'completed' and custom.is_file():
        custom_ready = training.get('weight_sha256') == weight_hash(custom)
    return Status(models=[
        ModelInfo(id='pretrained', title='YOLO11n · pretrained COCO', available=runtime and model_path('pretrained').is_file(),
                  message='Detects COCO classes using pretrained weights.' if runtime and model_path('pretrained').is_file() else 'Pretrained model setup is required on this server.'),
        ModelInfo(id='custom', title='Your custom model', available=custom_ready,
                  message='Custom weights match the completed training artifact.' if custom_ready else 'No verified custom model is available yet.'),
    ], training_log_available=(ROOT / 'training.log').is_file(), bottle_sample_split=bottle_split, bottle_sample_available=(ROOT / 'bottle.jpg').is_file(), sample_available=(ROOT / 'bus.jpg').is_file(), dataset=dataset, training=public_training(training))


def get_model(kind):
    path = model_path(kind)
    if not path.is_file() or (kind == 'custom' and not status().models[1].available):
        raise ImageError('This model is not prepared on the server. Check the model setup or custom training status.', 503)
    signature = (str(path), path.stat().st_mtime_ns, path.stat().st_size)
    if signature not in MODEL_CACHE:
        try:
            (ROOT / 'settings').mkdir(parents=True, exist_ok=True)
            os.environ.setdefault('YOLO_CONFIG_DIR', str(ROOT / 'settings'))
            os.environ.setdefault('YOLO_AUTOINSTALL', 'false')
            from ultralytics import YOLO
            model = YOLO(str(path), task='detect')
            MODEL_CACHE.clear()
            MODEL_CACHE[signature] = (model, weight_hash(path))
        except (ImportError, OSError, RuntimeError, ValueError, AttributeError):
            raise ImageError('The model runtime could not load these local weights. Check the Lab 6 setup.', 503) from None
    return MODEL_CACHE[signature]


def sample(kind='bus'):
    path = ROOT / ('bottle.jpg' if kind == 'bottle' else 'bus.jpg')
    if not path.is_file():
        raise ImageError('The sample image is not prepared. Upload a PNG/JPEG or run the model setup.', 503)
    image, notes = decode_image(path.read_bytes())
    credit = ('Open Images bottle validation sample (also used for model evaluation, not an independent test); '
              'Feeling My Age, CC BY 2.0; https://www.flickr.com/photos/feelingmyage/14956869955'
              if kind == 'bottle' else 'Ultralytics bus demonstration image; downloaded during explicit setup.')
    return frame(image, [*notes, credit])


def execute(content, settings):
    image, notes = decode_image(content)
    if image.ndim == 2:
        image = cv2.cvtColor(image, cv2.COLOR_GRAY2BGR)
        notes.append('Grayscale input expanded to three channels for detection.')
    if not INFERENCE_LOCK.acquire(blocking=False):
        raise ImageError('The detector is processing another frame. Wait a moment and retry.', 409)
    try:
        model, checksum = get_model(settings.model)
        started = perf_counter()
        try:
            prediction = model.predict(source=image, conf=settings.confidence, iou=.7, imgsz=640,
                                       max_det=100, device='cpu', verbose=False, save=False)[0]
        except (RuntimeError, ValueError, OSError, cv2.error):
            raise ImageError('The detector could not process this image. Try another image or check the model setup.') from None
        elapsed = (perf_counter() - started) * 1000
        output = image.copy()
        detections = []
        font_scale = max(.45, max(image.shape[:2]) / 500)
        thickness = max(1, round(max(image.shape[:2]) / 500))
        # CPU numpy arrays preserve the original-image coordinates returned by YOLO.
        boxes = prediction.boxes
        for box, confidence, class_id in zip(np.asarray(boxes.xyxy), np.asarray(boxes.conf), np.asarray(boxes.cls)):
            x1, y1, x2, y2 = [float(value) for value in box]
            x1, x2 = np.clip([x1, x2], 0, image.shape[1]).tolist()
            y1, y2 = np.clip([y1, y2], 0, image.shape[0]).tolist()
            name = prediction.names[int(class_id)]
            detections.append(Detection(class_id=int(class_id), label=name, confidence=float(confidence), xyxy=[x1, y1, x2, y2]))
            cv2.rectangle(output, (round(x1), round(y1)), (min(image.shape[1] - 1, round(x2)), min(image.shape[0] - 1, round(y2))), (55, 125, 55), thickness)
            text = f'{name} {confidence:.2f}'
            (text_width, text_height), baseline = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, font_scale, thickness)
            text_x = max(0, min(round(x1), image.shape[1] - text_width - 4))
            text_y = min(image.shape[0] - baseline - 3, max(text_height + 4, round(y1) - 5))
            cv2.rectangle(output, (text_x, text_y - text_height - 4), (min(image.shape[1] - 1, text_x + text_width + 4), text_y + baseline + 2), (35, 70, 35), -1)
            cv2.putText(output, text, (text_x + 2, text_y), cv2.FONT_HERSHEY_SIMPLEX, font_scale, (255, 255, 255), thickness, cv2.LINE_AA)
        return Result(output=frame(output, notes), detections=detections, parameters=settings, elapsed_ms=elapsed,
                      stages_ms={key: float(value) for key, value in prediction.speed.items()},
                      provenance={'model': 'yolo11n.pt' if settings.model == 'pretrained' else 'custom/best.pt',
                                  'weight_sha256': checksum, 'device': 'cpu', 'imgsz': 640, 'iou': .7, 'max_detections': 100,
                                  'ultralytics': runtime_version('ultralytics'), 'torch': runtime_version('torch'), 'opencv': cv2.__version__})
    finally:
        INFERENCE_LOCK.release()
