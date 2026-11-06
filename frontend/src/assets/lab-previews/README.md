# Homepage lab examples

The homepage lab detail cards display borderless mascot illustrations above
their titles. Labs 1–4/7 use curated transparent edits of the learning-card mascot poses;
Labs 5–6 retain the approved concept illustrations here, distinguished from model
outputs in image descriptions and existing preview copy. They are never used
as default lab inputs. The “glass” label does not imply mascot recognition.

The computed assets remain available for inspection and regeneration but are
not rendered by the homepage cards. `provenance.json` records these real
computations. `illustrations/provenance.json` separately records the generated
artwork, prompts, references and hashes.

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
retained computational previews use the same sample and actual processing services; existing
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

## Curated mascot props

The Lab 1/2/3/4/7 PNG masters and WebP display assets live in `illustrations/`.
They were edited with built-in imagegen from the existing Start and Compare
poses: grayscale picture, edge map, contrast pair, matching keypoints and
segmentation regions. Original learning-card PNG/Piskel sources remain intact.
The edits have transparent backgrounds and their own emerald treatment; do not
apply the learning-card saturation filter again. WebP conversion preserves
alpha without resizing. Full prompts, references and output hashes are in
`illustrations/provenance.json`. These assets are conceptual illustrations,
not outputs from the lab algorithms.
