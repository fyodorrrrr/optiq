# Optiq Laboratory Requirements

## Purpose and Status

Map the seven supplied CSST106 laboratory documents to functional modules in one web application for students and developers. Users should understand techniques, experiment with parameters, compare results, and connect outputs to implementations. Every module is directly accessible without completing learning prompts. Assignment review uses this same experience; no separate instructor role or workflow is planned.

This document records source requirements and proposed web adaptations. Labs 1–5 are implemented in React and Python/OpenCV; Labs 6–7 remain unimplemented. The final section records implementation evidence.

Printed, handwritten, and PDF report submission requirements are excluded at the developer's request. Their conceptual questions and analysis tasks remain useful learning content. Standalone scripts alone do not satisfy the Web UI requirement.

## Requirement Labels

- **Required:** explicitly requested algorithm, task, output, or analysis in the source.
- **Conditional:** applies when its stated condition is met.
- **Proposed:** suggested interface, control, sample, or learning interaction; not an additional instructor requirement.
- **Open:** unresolved source ambiguity or implementation decision.

Labs use filename numbering provisionally. Preserve source discrepancies below until confirmed; do not silently rewrite assignment requirements.

## Source Register

All paths below are relative to `activities/`, which is currently excluded from Git.

| Module | Source filename | Source numbering or naming discrepancy |
| --- | --- | --- |
| Lab 1: Image Manipulation | `CSST106_Lab_Experiment_01_Images.docx` | None identified |
| Lab 2: Edge Detection | `CSST106_Lab_Experiment_02_Edge_Detection..docx` | Body calls this Exercise/Activity 3 |
| Lab 3: Histograms and Contrast | `CSST106_Lab_Experiment_03_Histogram.docx` | Also numbered Exercise 3 |
| Lab 4: Feature Detection | `CSST106_Lab_Experiment_04_SURF_Feature_Detection.docx` | Local SURF/SIFT/ORB verified; deployment builds require verification |
| Lab 5: PCA and Eigenfaces | `CSST106_Lab_Experiment_05_PCA_in_CV.docx` | No numbering conflict identified |
| Lab 6: Object Detection | `CSST106_Lab_Experiment_06_YOLOV8_Object_Detection.docx` | Filename says YOLOv8; body says YOLOv11 and Activity 5 |
| Lab 7: Segmentation | `CSST106_Lab_Experiment_07_Segmetation.docx` | Body calls this Exercise/Activity 6 |

## Shared Application Requirements

**Required:** all seven clearly labeled modules are accessible through one Web UI; real implementations and their outputs are reviewable; source code and related project files are organized for GitHub review. Support image/video inputs and execution where applicable to each lab.

**Proposed common experience:** objective → short prediction → experiment → comparison → explanation. Supply a useful sample where practical and allow user inputs appropriate to the technique. Learning prompts are optional interactions, not navigation gates. Dedicated Learn, Code, and scored Practice features are deferred.

Each experiment should identify its input, method, relevant parameters, preprocessing, and result provenance. Clearly label fresh computation, cached results, and illustrative examples. Validate inputs and provide understandable loading, error, and empty states. Do not present a missing technique or model as a successful run.

For completion, verify source requirements, representative outputs, meaningful numerical checks where applicable, and invalid-input behavior. No accuracy, latency, or coverage targets are specified by the supplied instructions; set justified targets during implementation rather than inventing assignment criteria.

## Lab 1 — Image Representation and Manipulation

**Objective:** explain images as arrays, interpret dimensions and channels, and perform basic operations.

**Required implementation and outputs:**

- Load and display a color image; show height, width, channels, and array shape.
- Explain OpenCV BGR ordering and grayscale representation.
- Convert to grayscale and display the result.
- Inspect values at selected pixel coordinates, change a pixel's color, and show the effect.
- Crop a region of interest, resize smaller/larger, and rotate by 90 degrees.
- Display original, grayscale, and manipulated images for comparison.

**Proposed inputs/controls:** sample or uploaded image; pixel coordinate picker and color values; crop bounds; output dimensions; 90-degree rotation action; reset. Preserve correct colors when converting backend images for browser display.

**Proposed learning prompt:** predict how grayscale conversion or resizing changes shape and values, then explain the observed difference and a practical use.

**Completion checks:** all listed operations run; reported dimensions match actual arrays; pixel edits affect the selected location; crop and resize bounds are validated; rotation has the expected dimensions and orientation. Include color and grayscale samples.

**Implemented choices:** OpenCV/NumPy processing with Pillow header validation. Generated color/grayscale samples require no external assets. Coordinates are zero-based `(x, y)` from the top-left; crop uses left/top/width/height. Rotation advances clockwise 90° → 180° → 270° → 0° across successful clicks, with an angle display and reset on clear/new input. The accumulated angle is applied to original pixels; other operations remain independent. See [ARCHITECTURE.md](ARCHITECTURE.md) for limits and data flow.

## Lab 2 — Sobel and Canny Edge Detection

**Objective:** understand preprocessing, gradients, and differences between Sobel and Canny edge maps.

**Required implementation and outputs:**

- Read a grayscale image and apply Gaussian smoothing.
- Calculate Sobel horizontal/vertical derivatives and combined gradient magnitude.
- Calculate Canny edges.
- Show original, combined Sobel, and Canny outputs side by side.
- Explain observed differences between the methods.

**Source baseline:** Gaussian kernel `(3, 3)`, Sobel kernel size `3`, Canny thresholds `100` and `200`. Preserve these as a reproducible starting configuration.

**Proposed inputs/controls:** sample or uploaded image; Canny lower/upper thresholds; optional validated blur/Sobel settings; optional derivative views. Clearly disclose display scaling applied to Sobel magnitudes.

**Proposed learning prompt:** predict how threshold changes affect visible edges; compare both techniques on a noisy image and justify a preferred result.

**Completion checks:** both methods use the same input/preprocessing; all three views are present; parameter changes execute actual processing; uniform and sharp-boundary samples produce sensible results; invalid settings fail clearly.

**Implemented choices:** OpenCV/NumPy; same bounded PNG/JPEG decoding as Lab 1. Generated shapes and deterministic noisy shapes (seed 42) explicitly replace the absent `input.jpg`; the assigned image can be uploaded when available. Every run computes both methods from the same Gaussian-blurred grayscale input. Gaussian sizes 1/3/5/7/9, Sobel sizes 3/5/7, and ordered Canny thresholds are validated. Sobel previews scale absolute values to 0–255 separately per view; raw gradient ranges and exact settings are retained. The 3×3/3/100/200 baseline remains one reset away.

## Lab 3 — Histograms and Contrast

**Objective:** understand contrast enhancement and compare global equalization, CLAHE, and linear adjustment.

**Required implementation and outputs:**

- Load grayscale/color inputs and calculate intensity histograms.
- Apply global histogram equalization and CLAHE.
- Implement linear contrast adjustment/stretching by scaling pixel values.
- Show original, globally equalized, and CLAHE images with corresponding histograms; expose the linear adjustment result too.
- For color equalization, operate on a luminance/brightness channel rather than independently equalizing color channels. The source suggests YUV or HSV; document the actual choice.
- Explain the purpose and operation of equalization and CLAHE, applications, detail visibility, and noise/artifact amplification.

**Proposed inputs/controls:** low-contrast and uneven-lighting samples or upload; CLAHE clip limit and tile grid; linear scale/offset with explicit clipping behavior; grayscale/color mode.

**Proposed learning prompt:** improve a dark image, compare methods, and explain whether increased contrast also amplified noise.

**Completion checks:** histograms correspond to displayed processing channels and outputs; dimensions remain consistent; test constant and low-contrast images; color conversion preserves valid image output; methods can be compared on the same input.

**Implemented choices:** OpenCV/NumPy processing and a shared SVG histogram component; no chart dependency. Grayscale intensity or Y in YUV is processed. Color histograms are measured on each final reconstructed BGR image's Y channel, including gamut clipping/rounding effects. Defaults: CLAHE clip limit 2 and 8×8 tiles; manual linear scale 1.2 and offset 0. Manual adjustment uses `clip(rint(alpha × channel + beta), 0, 255)`. Full-range stretching maps observed minimum/maximum to 0/255, leaving constant channels unchanged. All methods use the same working original; all 256-bin charts share one count scale. Generated low-contrast, uneven-lighting (noise seed 42), and color samples are provided. PNG results and histogram CSV are downloadable.

## Lab 4 — SURF Features and Matching

**Objective:** understand keypoints, descriptors, matching, and algorithm differences.

**Required implementation and outputs:**

- Detect SURF keypoints/descriptors and show rich keypoints with size/orientation and a count.
- Start from Hessian threshold `400` and explore its effect.
- Match two images using SURF descriptors.
- Compare SURF, SIFT, and ORB on the same images, including detection and speed observations.
- Explore upright SURF (U-SURF) and explain when orientation invariance matters.
- Explain descriptor purpose and the observed effect of the Hessian threshold.

**Proposed inputs/controls:** paired samples with scale/rotation changes or two uploads; algorithm selector; Hessian threshold; upright toggle; explicitly documented matching/filter settings. Show matches, descriptor dimensions, counts, and measured timings with context.

**Proposed learning prompt:** predict what rotation does to upright matching, then compare outputs and explain failures.

**Completion checks:** actual SURF executes before claiming full completion; all three algorithms use equivalent input conditions; matching handles no-keypoint/no-match cases; incompatible descriptor matching is prevented; timings are measured rather than hardcoded.

**Dependencies/open items:** local SURF execution and reproducible setup are verified in `SURF_SETUP.md`; deployment targets require their own build verification. The source permits ORB when SURF is unavailable, but ORB is not evidence of SURF execution; confirm acceptable fallback scope before marking the lab complete. Verify source algorithm availability/licensing statements against current primary documentation rather than copying them as fact.

## Lab 5 — PCA, Eigenfaces, and SVM Recognition

**Objective:** reduce dimensionality, interpret retained variance/eigenfaces, and evaluate recognition in PCA space.

**Required implementation and outputs:**

- Load LFW using `min_faces_per_person=70`, `resize=0.4`; display sample count, dimensions, feature count, classes, and target names.
- Split 80% training/20% testing with `random_state=42`.
- Fit PCA only on training data using baseline `n_components=150`, `svd_solver='randomized'`, `whiten=True`; transform both splits.
- Visualize the first 12 eigenfaces; allow analysis of the first three versus last three of the 150-component set.
- Train an RBF SVM with `class_weight='balanced'` on training projections and predict held-out identities.
- Display precision, recall, and F1 classification results.
- Plot cumulative explained variance and determine how many components retain 90% variance.
- Extract misclassified test faces programmatically and show predicted versus actual identities for failure analysis.
- Explain dimensionality reduction, component differences, lost information, centering, whitening, and recognition limitations.

**Proposed controls/learning:** baseline run plus bounded component-count exploration; compare variance, eigenfaces, and recognition outcomes. Image reconstruction is an optional teaching extension, not a substitute for classification.

**Completion checks:** prevent train/test leakage; constrain components to dataset limits; record split/PCA seeds and configuration; metrics match held-out predictions; handle no misclassifications honestly. If the computed component range never reaches 90%, report that and compute a sufficient range before claiming the threshold is known.

**Dependencies/open items:** scikit-learn and NumPy; explicit dataset setup, bounded fresh fitting, and local verification are documented in `LAB5_SETUP.md`. Deployment resource validation remains pending. Do not replace LFW with arbitrary uploaded faces without identifying the changed experiment. A cached fitted model must retain its training provenance and does not alone demonstrate the training procedure.

## Lab 6 — YOLO Object Detection

**Objective:** perform pretrained detection, prepare a custom dataset, train a detector, and evaluate/use its outputs.

**Required implementation and outputs:**

- Run pretrained detection from a webcam, showing boxes, labels, and confidence scores; observe accuracy and speed.
- Collect/annotate a custom dataset using normalized YOLO labels: `class_id x_center y_center width height`.
- Organize `images/train`, `images/val`, `labels/train`, and `labels/val`; create `data.yaml` with paths and class definitions.
- Train a custom detector and retain actual training logs, metrics, and resulting weights. Source baseline: 100 epochs and image size 640.
- Validate the trained model; show precision/recall and relevant evaluation results; run custom-model inference on new images/video.
- Explain detection versus classification using a practical example.

**Proposed inputs/controls:** browser webcam capture, uploaded media, sample inputs, confidence threshold, pretrained/custom model selector, and a view of dataset/training artifacts. An annotation editor and in-browser training controls are not explicitly required.

**Proposed learning prompt:** vary confidence settings and explain missed versus retained detections; compare pretrained and custom-model behavior within their supported classes.

**Completion checks:** boxes align with input dimensions; class/confidence outputs come from real inference; camera denial is handled; custom data and evaluation provenance are reviewable; pretrained inference alone is marked partial.

**Dependencies/open items:** body provisionally targets YOLOv11 despite the filename. Verify supported weight names and API against primary documentation before coding; do not copy `YOLOv11n.pt` unverified. Select runtime/device and safe media limits. Source says test-set validation but provides train/val paths only: document actual evaluation split and obtain a test split if required.

**Scope decision needed:** custom training is required by the lab, while general-purpose training infrastructure is outside the initial product scope. Proposed resolution: train through a reproducible local/offline workflow and integrate real artifacts plus custom inference into the UI. This is a proposal, not an approved waiver or final architecture. The training requirement remains open until its delivery is agreed.

## Lab 7 — Segmentation Techniques

**Objective:** compare thresholding, region-based, edge-based, and semantic segmentation and explain suitable applications and limitations.

**Required implementation and outputs:**

- Apply global thresholding (source suggests Otsu) and adaptive thresholding; show foreground/background results.
- Implement seed-based region growing and watershed for touching objects.
- Use edge detection to guide segmentation, such as closed-contour regions; show segmentation output, not just an edge map.
- Use a pretrained semantic model, such as DeepLab or U-Net, to label pixels and visualize classes.
- Compare results qualitatively, discuss computational complexity, and give an advantage/limitation of each method family.
- **Conditional:** quantify segmentation quality with metrics such as IoU when compatible ground truth is available.

**Proposed inputs/controls:** simple high-contrast, uneven-lighting, touching-object, and natural-scene samples or uploads; threshold settings; region seed/tolerance; watershed markers; semantic overlay opacity. Show masks, boundaries, source image, and class legend as appropriate.

**Proposed learning prompt:** choose a technique for separating touching objects, compare its result with thresholding, and explain why a semantic model addresses a different labeling problem.

**Completion checks:** every required method executes; seed coordinates map correctly; region growth terminates; watershed labels and semantic class maps are valid; overlays preserve alignment. IoU requires matching class IDs, dimensions, and documented ignored-label handling; do not equate unlabeled regions with semantic classes.

**Dependencies/open items:** OpenCV/NumPy plus selected segmentation libraries and pretrained weights. Select the semantic architecture, dataset/class mapping, preprocessing, runtime, and sample assets before implementation. Semantic model training is optional in the source.

## Decisions and Assets to Resolve Before Implementation

| Item | Required next action |
| --- | --- |
| Lab numbering and YOLO mismatch | Confirm filename-based module order and intended detector version |
| SURF capability | Local custom build verified; standard wheels explicitly expose partial capability; see `SURF_SETUP.md` |
| Training delivery | Agree how PCA fitting and custom YOLO training are executed and demonstrated |
| Sample inputs | Inventory embedded document media and choose documented, appropriately licensed standalone samples; the folder currently contains DOCX files only |
| Datasets/models | Record sources, versions, class mappings, download/cache process, and permissions; avoid committing large generated assets by default |
| Media and compute limits | Specify accepted formats, dimensions, sizes, durations, device assumptions, and timeouts in the architecture |
| Web presentation | Decide charts, comparison layout, execution states, and specialized controls in the UX specification |

## Completion Tracking

| Module | Status | Evidence |
| --- | --- | --- |
| Lab 1 | Implemented and locally verified | `backend/tests/test_lab1.py`: exact pixel values, BGR/RGB order, grayscale shape, single-pixel edits, crop, resize, rotation, upload handling, and validation. Browser checks exercised actual API requests, samples/uploads, zoom, all six tools, navigation, error/retry, stale request cancellation, and responsive layouts. |
| Lab 2 | Implemented and locally verified | `backend/tests/test_lab2.py`: baseline preprocessing/Canny equality, directional Sobel response, scaled magnitude, zero-edge uniform input, color/tiny input, deterministic noise, parameter effects, and invalid files/settings. Browser checks exercised real comparison requests, all settings sections, uploads, downloads links, intermediate views, reset, errors/retry, cancellation, keyboard operation, and layouts from 320px to 1440px. |
| Lab 3 | Implemented and locally verified | `backend/tests/test_lab3.py`: histogram counts, exact equalization/CLAHE output, linear clipping/stretching, constant/color inputs, final brightness-channel measurements, deterministic samples, and validation. Browser checks covered real methods/parameters, four histogram charts with common scales, color/grayscale switching, PNG/CSV downloads, uploads, reset, errors/retry, cancellation, and 320–1440px layouts. |
| Labs 6–7 | Not implemented | Their source requirements and open decisions remain above. |

Lab 1 code: `frontend/src/labs/lab1/`, `backend/routers/lab1.py`, `backend/schemas/lab1.py`, and `backend/services/`. Local verification is not evidence of production deployment or measured learning effectiveness. No source-required Lab 1 operation is intentionally deferred. Optional enhancements such as drag-to-crop, progress storage, and scored practice are not completion criteria.

Lab 2 code: `frontend/src/labs/lab2/`, `backend/routers/lab2.py`, `backend/schemas/lab2.py`, and `backend/services/lab2.py`. All required Lab 2 operations are implemented. Fidelity to the particular missing `input.jpg` cannot be verified until that asset is supplied. Existing source numbering conflicts remain documented in the source register.

Lab 3 code: `frontend/src/labs/lab3/`, `backend/routers/lab3.py`, `backend/schemas/lab3.py`, and `backend/services/lab3.py`; charts use `frontend/src/components/lab/Histogram.tsx`. All source-required Lab 3 methods and outputs are implemented. Color mode requires a color input; grayscale inputs retain grayscale mode. Local tests do not establish production hosting performance or measured learning effectiveness.

For subsequent modules, track required items as pending, implemented, verified, or blocked with code locations and evidence. Proposed extensions must not obscure incomplete source requirements. Preserve the reasons for approved interpretation changes.

### Lab 4 implementation evidence

`/labs/4` implements SURF detection/descriptors, rich keypoint size/orientation
views, Hessian threshold, upright SURF, two-image ratio-test matching, and real
SURF/SIFT/ORB comparisons with counts, descriptor metadata, and measured timings.
Generated pairs record seed and transform; uploaded pairs are not assumed to have
known geometry. Artifacts can be downloaded. Blank inputs and unavailable SURF
are tested explicitly. Seven API tests cover these behaviors; the custom SURF
build executes all seven without skips. See [SURF setup](SURF_SETUP.md) for
reproduction; a standard wheel provides only partial Lab 4 capability.

### Lab 5 implementation evidence

`/labs/5` loads actual LFW (70/.4), uses the source 80/20 seed42 split, fits
150-component randomized whitened PCA on training data, displays first12/final3
eigenfaces, trains balanced RBF SVM, and reports held-out precision/recall/F1.
A separate full training-only spectrum measures the 90% threshold. Failures are
extracted from predicted-versus-actual labels, with an explicit no-failure state.
Tests cover training-only inputs, split isolation, metrics, variance, reproducibility,
parameter/rank limits, missing data, lock recovery, and no misclassifications.
Actual local baseline and dataset preparation are documented in `LAB5_SETUP.md`.
