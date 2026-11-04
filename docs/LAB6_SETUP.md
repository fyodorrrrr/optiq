# Lab 6 — YOLO11 setup and local training

Lab 6 currently provides real pretrained image/camera detection and a local
custom-training workflow. **A user-approved 38-image bottle subset completed a local 100-epoch custom
training run on 2026-11-05.** Opening Optiq never starts training.

The activity filename says YOLOv8; its body specifies YOLO11. Optiq follows the
body with the official `yolo11n.pt` checkpoint, preserving the numbering conflict
in `LAB_REQUIREMENTS.md`.

## Dependencies and pretrained setup

From the repository root, install the normal backend requirements first. Then:

```sh
backend/.venv/bin/python -m pip install --no-deps -r backend/requirements-lab6-lock.txt
backend/.venv/bin/python backend/scripts/build_surf.py --install
backend/.venv/bin/python backend/scripts/prepare_yolo.py
```

Restart FastAPI afterward. Open `/labs/6` or check `/api/labs/6/status`.
The build needs native C++ tools and can take several minutes. The current
OpenCV build includes SURF plus highgui/videoio symbols required by Ultralytics.
The headless build does not provide native GUI windows; camera access happens
in the browser. FFmpeg and native capture integrations remain disabled.

Ultralytics declares `opencv-python`, but Optiq already uses the same `cv2` API
through its SURF-enabled `opencv-contrib-python-headless`. Installing two OpenCV
providers can overwrite shared files and disable SURF. The separate pinned Lab 6
lock includes the additional dependency closure and must be installed with
`--no-deps`, after the main lock. Do not run an unconstrained `pip install
ultralytics` in this environment. `pip check` may report the unsatisfied package
name `opencv-python`; actual cv2 compatibility is verified through the tests.
The recorded packages were verified on macOS ARM64/Python 3.12. Other platforms,
especially GPU-specific PyTorch installations, require their own verification.

Explicit setup downloads official pretrained weights and the Ultralytics bus
image into ignored `backend/.cache/lab6/`. Prediction requests do not download
weights. The first inference loads the model; later requests reuse it. Inference
uses CPU, imgsz640, confidence0.25, IoU0.7, and at most100 detections. Uploaded
images use the existing 5MiB/4096px-side/4M-pixel limits and are not retained.
Camera frames are JPEG, at most640px per side, sequential, capped at2 requests
per second; this is not a guaranteed video frame rate. Stop/leave/hide the view
to release camera tracks. Use localhost or HTTPS for browser camera permission.

## Prepare your dataset

A local public-data bottle review pack is now available; see
[LAB6_DATASET_REVIEW.md](LAB6_DATASET_REVIEW.md). All 38 images were approved by the user on 2026-11-05; the documented local
100-epoch baseline completed with validation evaluation and published custom weights. See the review guide and local training
artifact for its outcome.

Collect varied images and annotate them with an external tool. Use:

```text
dataset/
  data.yaml
  images/train/    labels/train/
  images/val/      labels/val/
  images/test/     labels/test/   # optional independent test split
```

Example `data.yaml` (paths relative to this file):

```yaml
train: images/train
val: images/val
names: [bottle, notebook]
# test: images/test
```

Each image needs a matching `.txt` label file. Each line is
`class_id x_center y_center width height`, normalized by image width/height.
Class IDs start at0; boxes must stay inside the image. Empty files explicitly
identify background images. Every class must occur in training data. Split
independent scenes before training; related video frames can leak information.

```sh
backend/.venv/bin/python backend/scripts/train_yolo.py --data /path/to/dataset/data.yaml --validate-only
```

Validation checks images, class names, label pairing, normalized boxes, orphan
labels, and exact decoded-image duplicates across files/splits. It cannot verify
annotation quality or identify every near-duplicate scene. Only directory splits
under the configured root are supported; text-file lists and automatic dataset
download definitions are deliberately outside this workflow.

## Train explicitly and review results

Start with a short hardware check, which is not the completed lab baseline:

```sh
backend/.venv/bin/python backend/scripts/train_yolo.py --data /path/to/dataset/data.yaml --epochs 2 --batch 4 --name check
```

Then run the source baseline (100epochs,640px):

```sh
backend/.venv/bin/python backend/scripts/train_yolo.py --data /path/to/dataset/data.yaml --epochs 100 --batch 4 --name baseline
```

CPU is the default. `--device mps` can use supported Apple GPU acceleration;
that path has not been verified here. Lower `--batch` if memory is limited.
No training duration is promised. The script uses seed42, workers0, ampFalse,
and patience0 (no early stop); GPU numerical results can still vary.

Evaluation defaults to the actual **validation** split. To evaluate a separate
test set, configure `test: images/test` and pass `--split test`. Do not call
validation metrics test performance. Repeated inspection of validation/test
results during tuning affects the independence of final evaluation.

Artifacts stay in `.cache/lab6/`: validated dataset manifest, timestamped training
provenance, run CSV/arguments/weights, `training.log`, evaluation outputs, and
published `custom/best.pt`. The UI shows precision/recall/mAP, recorded loss,
actual evaluation split, epoch count, and provenance; it marks exploratory runs
as below the source baseline. Select **Refresh status** after running the CLI.
Custom inference becomes available only when completed artifacts and published
weight SHA-256 agree. Only trusted local checkpoints are accepted; there is no
web weight upload or training endpoint. Keep models, personal data, caches and
logs out of Git.

A one-epoch synthetic smoke test verified local train→evaluate→publish in an
isolated cache; it is not the student's custom dataset or a completed activity.
Physical webcam hardware and MPS training remain unverified; browser lifecycle
checks used a synthetic camera. Production compute/concurrency limits need
separate validation. One inference is allowed per server process; training is
separate and can compete for machine resources if you run both simultaneously.

References: [YOLO11](https://docs.ultralytics.com/models/yolo11/),
[YOLO dataset format](https://docs.ultralytics.com/datasets/detect/),
[installation](https://docs.ultralytics.com/quickstart/).
