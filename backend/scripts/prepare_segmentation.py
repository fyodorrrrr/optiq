"""Explicitly download the official Lab 7 semantic checkpoint and natural-scene sample."""
import hashlib
import json
from pathlib import Path
import sys
from urllib.request import urlretrieve

BACKEND=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(BACKEND))

if __name__=='__main__':
    import torch
    from torchvision.models.segmentation import DeepLabV3_MobileNet_V3_Large_Weights
    from services.lab7_semantic import ROOT, WEIGHTS
    ROOT.mkdir(parents=True,exist_ok=True)
    weights=DeepLabV3_MobileNet_V3_Large_Weights.COCO_WITH_VOC_LABELS_V1
    if not WEIGHTS.is_file():
        temporary=WEIGHTS.with_suffix('.download')
        try:
            torch.hub.download_url_to_file(weights.url,str(temporary),hash_prefix='fc3c493d')
            temporary.replace(WEIGHTS)
        finally:
            temporary.unlink(missing_ok=True)
    sample=BACKEND/'.cache/lab6/bus.jpg'
    sample.parent.mkdir(parents=True,exist_ok=True)
    if not sample.is_file():
        temporary=sample.with_suffix('.download')
        try:
            urlretrieve('https://raw.githubusercontent.com/ultralytics/ultralytics/main/ultralytics/assets/bus.jpg',temporary)
            temporary.replace(sample)
        finally:
            temporary.unlink(missing_ok=True)
    digest=hashlib.sha256(WEIGHTS.read_bytes()).hexdigest()
    if not digest.startswith('fc3c493d'):
        raise ValueError('Checkpoint checksum does not match the official prefix.')
    (ROOT/'manifest.json').write_text(json.dumps({'url':weights.url,'sha256':digest,'classes':weights.meta['categories']},indent=2)+'\n')
    print('Semantic segmentation prepared:',digest)
