# Lab 6 — frozen-model held-out evaluation

The existing 100-epoch bottle checkpoint was evaluated without retraining on
2026-11-05. The original training/validation artifact and checkpoint were unchanged.
The new test labels were checked by the assistant before inference. The user
reviewed and approved all 18 annotations on 2026-11-05. Approval is bound to the
exact image/label hashes in `review-decisions.json`; a fresh frozen-model run
confirmed identical metrics with `review_status: user_approved`.

| Split | Images | Bottle boxes | Precision | Recall | mAP@50 | mAP@50–95 |
|---|---:|---:|---:|---:|---:|---:|
| Original validation | 8 | 12 | 79.6% | 75.0% | 74.3% | 65.6% |
| New held-out test | 18 | 27 | 83.6% | 70.4% | 80.1% | 59.7% |

These are separate small-sample estimates. Higher test mAP@50 does not establish
improved training: the checkpoint is identical and the images differ. The lower
mAP@50–95 indicates stricter box alignment is less reliable on this test subset.
Ultralytics summary precision/recall use its evaluation operating point; they
are not the fixed 0.25-confidence inference counts.

## Test selection and annotation

The local test set comes from new public validation-pool photographs, not the
official Open Images test benchmark. New source IDs and photographers were kept
separate from the original data. All 50 previously inspected candidates were
excluded before selection. Exact decoded pixels and conservative perceptual
hash checks (dHash distance at most 3) found no overlap with the 38 baseline
images. These checks do not prove absence of all scene similarity or overlap
with YOLO pretraining; no such claim is made.

Twenty-four new candidates were inspected before frozen-model inference.
Six were excluded for ambiguous class boundaries or incomplete source labels:
a rendered product, a jar/glass, aerosol containers, and two complex partially
occluded scenes. Exclusion reasons and the fixed 18 source IDs are versioned in
`backend/scripts/bottle_test_selection.json`. No candidate was selected or
removed based on the detector's results. Published human bounding boxes were
converted to normalized YOLO; assistant review is not represented as newly
hand-drawn annotations or user approval.

The test set contains only bottle-positive photos. It is not a measurement of
background-only false alarms, physical-webcam reliability, or broad real-world
accuracy. Public image and annotation attribution remains in the local manifest
and attribution CSV. The application presents photos without exposing local paths.

## Review record

Open the self-contained local page:

`backend/.cache/lab6/datasets/bottle-heldout-test-v1/review.html`

It contains 18 embedded images with boxes, approval/fix/reject buttons, notes,
and a review JSON export. All 18 were approved following the user’s explicit
review response in conversation, recorded with that statement and current hashes.
For future changes, export decisions, apply justified corrections and rerun
evaluation under a new run name. Keep the original result
as historical evidence. Annotation changes after inspecting detector outputs
must be documented; do not silently tune the test set to improve metrics.

## Reproduce

Use the existing optional Lab 6 runtime and the original approved 38-image pack.
From the repository root:

```sh
backend/.venv/bin/python backend/scripts/prepare_bottle_test.py
backend/.venv/bin/python backend/scripts/evaluate_yolo.py \
  --data backend/.cache/lab6/datasets/bottle-heldout-test-v1/data.yaml \
  --name bottle-heldout-v1
```

Both commands refuse to overwrite their previous output. Use a new output/name
when intentionally reproducing. Image downloads are explicit; no request handler
starts training, downloads weights, or evaluates a dataset.

The pack copies original train/val image and label bytes into its structure so
the validator can check all three splits together. It does not modify the
original data. `verify_test_inputs` checks the training-only fingerprint against
the completed run, rejects exact duplicate decoded images across splits, and
checks the frozen checkpoint hash. Test-label cache is discarded before execution
so same-length corrections reload correctly. Dataset hashes are rechecked before
publishing. User approval requires exported review decisions matching the manifest
fingerprint and current test image/label bytes, not a standalone status flag. Evaluation calls `YOLO.val(split='test')`,
with CPU, 640 px, batch 4, seed 42, confidence 0.001 and NMS IoU 0.7. It never
calls training or replaces weights.

Local artifacts:

- `.cache/lab6/evaluation.json`: current separate test metrics and provenance.
- `.cache/lab6/test-evaluations/bottle-heldout-v1/`: first retained result, log and plots.
- `.cache/lab6/test-evaluations/bottle-heldout-confirmed-v1/`: identical repeat after
  adding fresh-cache and approval verification guards.
- `.cache/lab6/test-evaluations/bottle-heldout-approved-v1/`: final run after hash-verified
  user approval, with unchanged checkpoint, labels, and numerical metrics.
- `new-image-inference.json` in the first run: an actual API request on unseen source
  `2db0a13fe42bd957`, detecting its two bottles at the UI's confidence 0.25.

Lab 6 **Training & evaluation** compares validation and test metrics in a table,
shows the review state, and offers Test details and Test JSON.
The status API only exposes a test artifact whose model and training-dataset
hashes match the completed custom run. Unknown evaluation settings and local
paths are not returned. Original training history and validation metrics remain
unchanged.

## Requirements that need external evidence

The public-data route and held-out test labels were approved by the user. If the instructor requires
personally captured photos or newly hand-drawn annotations, those still need to
be supplied; review/conversion of public labels is not claimed to satisfy that
interpretation. A physical webcam check also requires the user's device.
The exact Lab 2 `input.jpg` remains absent from the supplied activity materials.
Lab 7's IoU is conditional on compatible ground truth, which this project does
not currently have; no IoU is fabricated or required unconditionally.

Verification: 72 backend tests pass; frozen-model CPU test evaluation and actual
held-out custom inference completed. Frontend lint/build and desktop/mobile checks passed, including missing-artifact
fallback, provenance drawer readability, and zero axe violations in the tested views. Local results do not establish deployment capacity.

Sources: [Ultralytics validation](https://docs.ultralytics.com/modes/val/),
[Open Images metadata and downloads](https://storage.googleapis.com/openimages/web/download_v7.html).

Checkpoint SHA-256: `4ae0818d5eb6eec00d1d563e741f45c3fb1055552043eaad334d67812c92f5da`.
Original train/val fingerprint: `d1578090232337957b46d592202475bd7c414d5b5ca53a630b657f8778d0de0d`.
Combined held-out pack fingerprint: `a8a821de193169a8e0560f6c0329b19a980434d39d5b34dec3258dbf062b84e0`.
