# Lab 7 — Segmentation

Lab 7 at `/labs/7` compares four method families on generated samples and uploaded
images. It does not depend on Lab 6 custom training or the bottle dataset.

## Setup

Thresholding, growing, watershed and edge-guided regions use the normal backend
dependencies. Semantic segmentation uses the already selected PyTorch/torchvision
packages from the optional Lab 6 dependency lock. If these are not installed,
follow the dependency instructions in [LAB6_SETUP.md](LAB6_SETUP.md), preserving
the single SURF-enabled OpenCV provider. Then, from the repository root:

```sh
backend/.venv/bin/python backend/scripts/prepare_segmentation.py
```

This explicitly downloads the official DeepLabV3 MobileNetV3 Large
`COCO_WITH_VOC_LABELS_V1` checkpoint and checksum-verifies it. It also prepares
the Ultralytics bus photo used as a natural-scene sample. Files and a provenance
manifest are stored in ignored `backend/.cache/lab7/`; the shared photo stays in
`.cache/lab6/bus.jpg`. No model download happens during an experiment request.
Select **Check model setup** after preparation. Classical methods stay usable
without semantic weights. No semantic model training is required by the source.

## Methods and outputs

- **Thresholding:** actual Otsu and adaptive Gaussian masks on the same grayscale
  input. Adaptive defaults are block31 and C5. Invert for dark foreground objects.
- **Regions & watershed:** select a seed on the original image or enter x/y.
  Growing uses fixed seed-relative intensity tolerance20 and4-connectivity.
  Watershed uses Otsu foreground,3×3 opening twice, L2 distance transform,
  marker threshold0.7×maximum distance and dilated background markers. It shows
  actual separated regions and marker seeds; marker fraction is configurable.
- **Edge-guided regions:** Gaussian3×3, Canny60/150, closing3×3, exterior flood
  fill, and connected-region filtering (minimum50pixels). It returns both
  boundaries and filled enclosed masks. Open contours can produce no region.
- **Semantic classes:** actual DeepLab pixel predictions using21 VOC IDs
  (background plus20objects). Results include color map, aligned overlay, class
  legend/pixel counts, checkpoint hash and runtime versions. Colors are display
  aids, not encoded class values or instance identities.

All results include actual settings, elapsed processing/encoding time and notes.
First semantic runs include model loading; timings are not controlled benchmarks.
Changing controls retains a labeled previous result until the next successful
run; changing the input clears it. Superseded requests are aborted in the client.

## Semantic preprocessing and label exports

RGB values are rescaled to[0,1] and normalized with mean[.485,.456,.406] and
std[.229,.224,.225]. To bound memory even for extreme aspect ratios, input is
bilinearly resized to a **longest side of520**, rather than the checkpoint's
default shortest-side resize. This is an intentional preprocessing adaptation,
recorded in provenance. Inference is CPU/eval/inference_mode; argmax labels are
restored to original dimensions with nearest-neighbor resampling. A process-local
lock rejects overlapping semantic runs; weights are loaded lazily and reused.

Downloadable watershed label PNGs are uint16:0boundary/unassigned,1background,
2+region IDs. Semantic label PNGs are uint8:0–20VOC IDs. Background is a predicted
class, not an ignored/unknown label. Display PNGs and JSON measurements can also
be downloaded. Do not interpret the dark raw label image as a binary mask.

## Limits and verification

Inputs: PNG/JPEG,5MiB,4096px per side and at most1million pixels. Classical
methods use grayscale; semantic inference expands grayscale to RGB. Standard
alpha/EXIF handling follows the earlier labs. Watershed rejects more than999
foreground markers rather than silently merging them. Generated samples are
deterministic geometry, not ground-truth annotations for the learned model.

Tests cover actual masks, seed connectivity/bounds, touching-object separation,
filled contours, blank input, bounds, opacity, semantic availability/concurrency,
and actual semantic label alignment/counts when weights are prepared. Browser
checks exercise inputs, methods, seed picking, exports, errors and small screens.
No compatible annotated ground truth was supplied; **IoU is not computed**.
A future IoU workflow must explicitly align class IDs/dimensions/ignored labels.
Performance and deployment concurrency limits still need target verification.

References: [Torchvision model and preprocessing](https://docs.pytorch.org/vision/stable/models/generated/torchvision.models.segmentation.deeplabv3_mobilenet_v3_large.html),
[OpenCV watershed](https://docs.opencv.org/4.x/d3/db4/tutorial_py_watershed.html).

## Recorded semantic presentation on the demo branch

On `feat/lab5-demo`, Semantic classes uses actual saved DeepLab results on Bus
and Bottle at overlay opacity .25/.5/.75. It opens a fixed recorded sample,
independently of any uploaded classical input, and provides real class maps,
overlays, class counts, raw VOC label IDs and measurement downloads. Inference
and encoding timings are explicitly recorded, not a new server run.

Thresholding, Regions & watershed, and Edge-guided regions retain live backend
processing. Switching to Semantic classes makes no inference/status request;
its own sample/opacity controls only fetch static files. Returning to a classical
method preserves its original input and clears the prior method's result. Live
semantic execution is guarded out of the classical frontend hook.

`backend/scripts/export_heavy_demos.py` produces these real recordings alongside
Lab 6. The 480px-longest-side samples retain attribution and input hashes; the
existing service still performs its documented 520px preprocessing and restores
labels to the recorded input dimensions. Files are manifest/hash-bound under
`frontend/public/demos/lab7/`. IoU is still unavailable without compatible labels.
The full live semantic/upload implementation is retained in GitHub `full-local`.
