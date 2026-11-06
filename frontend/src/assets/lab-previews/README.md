# Homepage lab examples

The homepage displays these assets without calling the backend. Labs 1–4/7
use recorded real service outputs; Labs 5–6 use approved mascot concept
illustrations, identified as artwork in the existing preview descriptions. They are not model results
and are never used as default lab inputs. Lab 6's illustrative “glass” label
does not imply the detector recognizes the mascot.

`provenance.json` records the retained real computations, including historical
Lab 5 eigenface and Lab 6 bus previews. `illustrations/provenance.json` separately
records the generated artwork, prompts, reference sources, and file hashes.
The real computed files are retained for inspection. Labs 1–3/7 use aligned
fixed 50/50 before/after previews; Lab 4 shows SIFT candidate matches. Lab 7 shows watershed
regions, not semantic predictions.

To regenerate from the repository root:

```sh
backend/.venv/bin/python backend/scripts/export_home_previews.py
```

Prepare the local LFW dataset and YOLO11n assets first, following the existing
Lab 5 and Lab 6 setup documentation. The exporter does not download assets.
Lab 6 uses the Ultralytics bus demonstration image; its source URL is recorded
in the provenance file. Other sources are generated Optiq samples or LFW PCA
components. Keep the image descriptions and provenance aligned when replacing previews.

## Default mascot examples

Labs 1–4 and classical Lab 7 now open with an emerald mascot sample. Their
homepage previews use the same sample and actual processing services; existing
shape/noise/photo samples remain in each dropdown. The default Lab 3 input is a
labeled low-contrast color adaptation. Lab 4 uses a 25° rotated, 90%-scale pair.
Lab 7 uses inverted foreground for a dark mascot on its light background.
These examples demonstrate classical image regions, not mascot recognition.

The committed sources are `backend/assets/mascot.png` (Start scene),
`mascot-compare.png` (Labs 2/4), and `mascot-understand.png` (Labs 3/7).
`mascot.json` records each source hash, crop, 2× nearest-neighbor enlargement,
emerald treatment and neutral paper background. A single UI border frames the
homepage preview; no decorative border is baked into or processed with samples.
Rebuild it explicitly with `backend/scripts/prepare_mascot_sample.py` after
editing the original learning-card artwork. Enlargement adds no image detail.

Regenerate only the mascot previews without running PCA or detection:

```sh
backend/.venv/bin/python backend/scripts/export_home_previews.py --labs 1 2 3 4 7
```

Selective export preserves unselected files and their provenance. The exporter
does not overwrite `illustrations/`. Labs 5–6 and recorded semantic demonstrations
retain their original meaningful inputs and outputs when opened.

## Approved conceptual artwork

The user reviewed and approved the two illustrations on 2026-11-06. Original
generated PNGs and production WebP versions are in `illustrations/`. The
built-in imagegen tool created them using the existing learning-card mascot as
a style/identity reference. WebP conversion uses `cwebp -q 90` without resizing.
Do not run the shared mascot CSS filter over this artwork: its colors are
already part of the approved images. Captions and alt text distinguish these
concepts from the actual PCA and detector experiments.
