import hashlib
import importlib.util
from pathlib import Path
from threading import Lock

import cv2
import numpy as np
from services.images import ImageError

ROOT = Path(__file__).resolve().parents[1] / '.cache' / 'lab7'
WEIGHTS = ROOT / 'deeplabv3_mobilenet_v3_large-fc3c493d.pth'
MODEL = None
MODEL_SIGNATURE = None
LOCK = Lock()


def status():
    return {'available': WEIGHTS.is_file() and importlib.util.find_spec('torch') is not None and importlib.util.find_spec('torchvision') is not None,
            'model': 'DeepLabV3 MobileNetV3 Large', 'weights': 'COCO_WITH_VOC_LABELS_V1',
            'message': 'Pretrained semantic segmentation uses 20 VOC object classes plus background.' if WEIGHTS.is_file() else 'Semantic weights are not prepared. Run the Lab 7 setup script; classical methods remain available.'}


def predict(image):
    global MODEL, MODEL_SIGNATURE
    if not status()['available']:
        raise ImageError('Semantic model setup is required on this server. Classical methods remain available.',503)
    if not LOCK.acquire(blocking=False):
        raise ImageError('Semantic segmentation is processing another image. Wait and retry.',409)
    try:
        import torch
        import torchvision
        from torchvision.models.segmentation import deeplabv3_mobilenet_v3_large, DeepLabV3_MobileNet_V3_Large_Weights
        signature=(str(WEIGHTS), WEIGHTS.stat().st_mtime_ns)
        torch.set_num_threads(2)
        if MODEL_SIGNATURE != signature:
            model=deeplabv3_mobilenet_v3_large(weights=None,weights_backbone=None,num_classes=21,aux_loss=True)
            model.load_state_dict(torch.load(WEIGHTS,map_location='cpu',weights_only=True))
            MODEL=model.eval()
            MODEL_SIGNATURE=signature
        height,width=image.shape[:2]
        scale=520/max(height,width)
        working=cv2.resize(image,(max(1,round(width*scale)),max(1,round(height*scale))),interpolation=cv2.INTER_LINEAR)
        rgb=cv2.cvtColor(working,cv2.COLOR_BGR2RGB)
        tensor=torch.from_numpy(rgb.transpose(2,0,1).copy()).float()/255
        tensor=(tensor-torch.tensor([.485,.456,.406])[:,None,None])/torch.tensor([.229,.224,.225])[:,None,None]
        with torch.inference_mode():
            logits=MODEL(tensor.unsqueeze(0))['out'][0]
            labels=logits.argmax(0).numpy().astype(np.uint8)
        labels=cv2.resize(labels,(width,height),interpolation=cv2.INTER_NEAREST)
        names=DeepLabV3_MobileNet_V3_Large_Weights.COCO_WITH_VOC_LABELS_V1.meta['categories']
        provenance={'model':'deeplabv3_mobilenet_v3_large','weights':'COCO_WITH_VOC_LABELS_V1',
                    'weight_sha256':hashlib.sha256(WEIGHTS.read_bytes()).hexdigest(), 'torch':torch.__version__,
                    'torchvision':torchvision.__version__, 'device':'cpu','working_width':working.shape[1],'working_height':working.shape[0],
                    'normalization':'RGB [0,1]; mean .485/.456/.406; std .229/.224/.225',
                    'resize':'longest side520, bilinear input; nearest label restore'}
        return labels,names,provenance
    except (OSError,RuntimeError,ImportError,ValueError) as error:
        raise ImageError('The semantic model could not process this input. Check the setup or try a different image.',503) from error
    finally:
        LOCK.release()
