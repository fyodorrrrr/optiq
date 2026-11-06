"""Export the existing mascot as a bounded, reproducible laboratory sample."""
import hashlib
import json
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
DESTINATION = ROOT / 'backend/assets/mascot.png'


def prepare():
    records = {}
    for variant in ('start', 'compare', 'understand'):
        source = ROOT / f'frontend/src/assets/learning/{variant}.png'
        destination = DESTINATION if variant == 'start' else DESTINATION.with_name(f'mascot-{variant}.png')
        records[variant] = prepare_scene(source, destination, variant)
    DESTINATION.with_suffix('.json').write_text(json.dumps({'variants': records}, indent=2) + '\n')


def prepare_scene(source, destination, variant):
    original = Image.open(source).convert('RGBA')
    bounds = original.getbbox()
    if bounds is None:
        raise ValueError('The mascot artwork is empty.')
    sprite = original.crop(bounds)
    rgba = np.asarray(sprite).copy()
    rgb = rgba[:, :, :3].astype(np.float64) / 255
    # CSS saturate(2.15), clamped before brightness(1.04), in sRGB.
    luminance = rgb @ np.array([.213, .715, .072])
    saturated = np.clip(luminance[:, :, None] + 2.15 * (rgb - luminance[:, :, None]), 0, 1)
    rgba[:, :, :3] = np.rint(np.clip(saturated * 1.04, 0, 1) * 255).astype(np.uint8)
    enlarged = Image.fromarray(rgba).resize((sprite.width * 2, sprite.height * 2), Image.Resampling.NEAREST)
    canvas = Image.new('RGBA', (480, 360), '#f7f7f5')
    position = ((canvas.width - enlarged.width) // 2, (canvas.height - enlarged.height) // 2)
    canvas.alpha_composite(enlarged, position)
    canvas.convert('RGB').save(destination, optimize=True)
    record = {'source': f'Optiq learning-card mascot scene: {variant}', 'source_sha256': hashlib.sha256(source.read_bytes()).hexdigest(),
              'crop': list(bounds), 'scale': 2, 'interpolation': 'nearest neighbor; no added detail',
              'saturation': 2.15, 'brightness': 1.04, 'background': '#f7f7f5', 'border': None,
              'width': 480, 'height': 360, 'file': destination.name,
              'sample_sha256': hashlib.sha256(destination.read_bytes()).hexdigest()}
    print(f'Prepared {destination.relative_to(ROOT)} ({record["sample_sha256"]})')
    return record


if __name__ == '__main__':
    prepare()
