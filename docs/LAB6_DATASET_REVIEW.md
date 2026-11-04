# Lab 6 bottle dataset and annotation review

A public-data subset has been prepared locally at
`backend/.cache/lab6/datasets/openimages-bottle-reviewed-v1/`.
Open its `review.html` in a browser, inspect each boxed image, and export the review
JSON. The images and generated labels are ignored by Git; only preparation code
and the selected source IDs/curation notes are versioned.

The review pack contains 38 images and 56 published Open Images bottle boxes
converted to normalized YOLO class 0. Local splits contain 30 training images and
8 validation images, with one photograph per photographer. It has no independent
test set or background-only examples. These are public photos, not user-captured
photos. Existing annotation labels were not presented as newly hand-drawn work.

Fifty initial candidates were inspected in contact sheets; twelve ambiguous or
incorrect-class examples were excluded. The retained cases have assistant notes. The user reviewed and approved all 38
images in conversation on 2026-11-05. Approval is recorded in the local
`review-decisions.json`, `review.csv`, and `manifest.json`; source image and
label hashes and the original review fingerprint are preserved. Class scope includes beverage, household,
food/sauce, and cosmetic bottles; it excludes glasses, cups, cans, jars, vases,
and shakers. Review class boundaries and partial/occluded instances carefully.

Open Images lists selected images as CC BY 2.0 and annotations as CC BY 4.0.
The pack preserves authors, source pages, license links, source metadata hashes,
image hashes, source boxes, and converted labels in `attribution.csv` and
`manifest.json`. Consult the pack's README for source licensing qualifications.

## Review flow

```sh
open backend/.cache/lab6/datasets/openimages-bottle-reviewed-v1/review.html
```

Use Approve, Needs fixes, or Reject and enter comments. Review state stays in the
browser. Download the review decisions JSON and provide it for label corrections;
this does not automatically approve labels on disk or train/publish a model.
The pack also includes contact sheets and `review.csv` for offline review.

Structural validation passed using `services.lab6_dataset.validate_dataset`.
Before approval, validation was saved only inside the review pack. Following
explicit user approval, the local training CLI published the dataset manifest
and completed the 100-epoch CPU baseline (640 px, batch 4, seed 42). Training
completion and evaluation are recorded separately in `.cache/lab6/training.json`.
The best checkpoint achieved precision 0.7963, recall 0.7500, mAP50 0.7432, and
mAP50–95 0.6556 on 8 validation images / 12 boxes. There is no independent test
set. The published model is `.cache/lab6/custom/best.pt`; the retained run is
`.cache/lab6/runs/bottle-baseline2/`.

## Reproduction

After installing the standard backend dependencies:

```sh
backend/.venv/bin/python backend/scripts/prepare_bottle_review.py \
  --output backend/.cache/lab6/datasets/openimages-bottle-reviewed-v2
```

The default curated selection is stored in
`backend/scripts/bottle_review_selection.json`. `--seed` defaults to 42. The
script uses official Open Images metadata and image URLs, records provenance,
checks image/label bounds, and refuses to overwrite an existing review manifest.
A network connection is needed for uncached source assets. No new packages are
required beyond the existing backend environment.

The `bottle_review.html` template has no external scripts, API calls, or training
actions. It embeds the review photographs in standard HTML images, so viewing does not
depend on local SVG image loading or adjacent image folders. Individual label-file
links still use the dataset folder. It exports decisions with image/label hashes.
Training remains the explicitly invoked workflow in [LAB6_SETUP.md](LAB6_SETUP.md)
after annotations are reviewed and any requested corrections are applied.

For this pack, run the CLI from its dataset directory because `data.yaml` uses
`path: .`, which Ultralytics resolves from the working directory:

```sh
cd backend/.cache/lab6/datasets/openimages-bottle-reviewed-v1
../../../../.venv/bin/python ../../../../scripts/train_yolo.py \
  --data data.yaml --epochs 100 --batch 4 --name bottle-baseline
```
