"""Cached deployment resource checks; no model fitting, inference or downloads."""
import importlib
import json
import logging
from tempfile import TemporaryFile
from threading import Lock
from time import monotonic

from services import lab4
from services.runtime_profile import PROFILE

LOGGER = logging.getLogger(__name__)


def _writable(directory=None):
    with TemporaryFile(dir=directory) as file:
        file.write(b'optiq')
        file.flush()
    return True


def _detection_runtime():
    for name in ('torch', 'torchvision', 'ultralytics'):
        importlib.import_module(name)
    return True


def _semantic_weights():
    from services import lab6, lab7_semantic
    manifest = json.loads((lab7_semantic.ROOT / 'manifest.json').read_text())
    digest = lab6.weight_hash(lab7_semantic.WEIGHTS)
    return digest.startswith('fc3c493d') and digest == manifest.get('sha256')


def inspect_resources():
    checks = {}
    def check(name, function):
        try:
            checks[name] = bool(function())
        except Exception:
            # Paths, exception text and model internals stay out of public probes.
            LOGGER.warning('Readiness check failed: %s', name)
            checks[name] = False

    check('feature_algorithms', lambda: all(item.available for item in lab4.capabilities().algorithms))
    if PROFILE.render_free:
        check('temporary_storage', _writable)
        return checks
    from services import lab5, lab6
    check('face_dataset', lambda: len(lab5.load_dataset().target) > 0)
    check('detection_runtime', _detection_runtime)
    status = None
    try:
        status = lab6.status()
    except Exception:
        LOGGER.warning('Readiness check failed: detection artifacts')
    checks['detection_models'] = bool(status and all(model.available for model in status.models))
    checks['reviewed_evaluation'] = bool(
        status and status.dataset.get('ready') and status.evaluation
        and status.evaluation.review_status == 'user_approved'
        and status.dataset.get('sha256') == status.training.get('dataset_sha256'))
    check('segmentation_weights', _semantic_weights)
    check('sample_images', lambda: all((lab6.ROOT / name).is_file() and
                                     (lab6.ROOT / name).stat().st_size > 0
                                     for name in ('bus.jpg', 'bottle.jpg')))
    check('temporary_storage', _writable)
    check('model_settings_storage', lambda: _writable(lab6.ROOT / 'settings'))
    return checks


class Readiness:
    def __init__(self, *, clock=monotonic, ttl=60):
        self._clock = clock
        self._ttl = ttl
        self._expires = 0
        self._report = None
        self._lock = Lock()

    def report(self):
        with self._lock:
            if self._report is None or self._clock() >= self._expires:
                checks = inspect_resources()
                self._report = {'status': 'ready' if checks and all(checks.values()) else 'not_ready',
                                'checks': checks}
                self._expires = self._clock() + self._ttl
            return self._report
