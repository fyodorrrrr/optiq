# Labs 5–7: middle columns and details-state audit

## Verdict and scope

**Implementation integrity: pass with layout and information-hierarchy issues.**
The labs use a coherent shared shell and show real computations. The middle
column does not yet have a consistent presentation for empty, loading, result,
and reference states. Run details renders the response structure too literally.

No UI was modified during this audit. Recommendations prioritize rearranging,
formatting, and collapsing existing content rather than adding explanations.

Evidence: 26 middle-column states at 1600px, 390px, and 320px; 15 details states
at the same widths, including absent Run details before a run. Completed real
PCA, detection, thresholding, watershed/regions, edge-guided segmentation, and
semantic inference. Checked all tool panels, pending local training, and API
failure states. Physical camera use, actual custom training, screen-reader
sessions, browser text zoom, and performance profiling were not tested.

The semantic run used the existing touching-object sample and returned
background-only output. This is an actual model result, not a fabricated success;
it is not an evaluation of semantic accuracy on suitable natural photographs.

## Health scores

| Lab | Accessibility | Performance | Responsive | Theming | Integrity | Total |
| --- | --- | --- | --- | --- | --- | --- |
| 5 | 3 | 3 | 3 | 3 | 2 | 14/20 · Good |
| 6 | 3 | 3 | 3 | 3 | 2 | 14/20 · Good |
| 7 | 3 | 3 | 3 | 3 | 2 | 14/20 · Good |

Scores are qualitative, scoped judgments. No verified P0/P1 blocker was found.
Thirteen actionable P2 findings are described below; no P3-only noise is listed.
The detector returned no findings for these lab modules and RunMetadata.

## Middle-column findings

### M1 · P2 · Lab 5 has a footer-style empty state at the top

**Location:** `frontend/src/labs/lab5/Lab5.tsx:61`,
`frontend/src/components/lab/LabUI.css:70`.

The first middle-column element is LabStatus, which adds a top border, 20px
margin, and 18px padding. “Ready…” is followed immediately by a larger paragraph
saying to run the experiment. Neither is a visual result heading. At desktop,
these occupy roughly the first 136px of a 423px middle column, leaving a large
blank area below. The screenshot's awkwardness is therefore a hierarchy and
placement problem, not a missing algorithm output.

**Change:** use one intentional empty-state group from the existing content,
without the footer divider at the top. Constrain the instruction line length and
give the group deliberate placement. Keep the Run action in the right controls;
do not add a second primary button or fabricate eigenfaces before a run.
**Command:** `$impeccable layout`.

### M2 · P2 · Lab 5 loading still tells the student to run

**Location:** `frontend/src/labs/lab5/Lab5.tsx:61,80`.

During the first real request, the status says fitting is in progress while the
empty paragraph still says “Run an experiment…”. The loading text also says
previous results remain available even when no prior result exists.

**Change:** make the existing empty and busy states mutually exclusive. Retain
completed results during subsequent reruns and their existing prior-result
context. Do not add speculative percentages or simulated progress.
**Command:** `$impeccable harden`.

### M3 · P2 · Lab 5 variance chart clips its axis endpoints

**Location:** `frontend/src/labs/lab5/VarianceChart.tsx:5`,
`frontend/src/labs/lab5/Lab5.css:21,27`.

The 100% and 0% labels are partly clipped in desktop and mobile captures.
`.pca-chart-scroll` has `overflow-x:auto`, which computes vertical overflow as
`auto` too. The tested desktop element has 276px client height and 285px scroll
height, creating an unintended vertical scroller around chart labels.

Axe reports `scrollable-region-focusable` at 1600px and 320px. **Manual Tab
navigation in the tested Chromium/Brave browser does reach the chart**, so the
warning is not treated as a verified keyboard failure there. Focus behavior may
differ across browsers; the component has no explicit tabindex/name for the
scroll region. The visible label clipping is independently confirmed.

**Change:** reserve space inside the chart for endpoint labels and remove the
accidental vertical overflow. If intentional scrolling remains, explicitly name
and keyboard-enable the region. Preserve the real variance curve and threshold.
**Commands:** `$impeccable adapt`, `$impeccable harden`.

### M4 · P2 · Lab 5 results lack a compact comparison rhythm

**Location:** `frontend/src/labs/lab5/Lab5.tsx:65`,
`frontend/src/labs/lab5/Lab5.css:6`.

At 390px, eigenfaces occupy about 2378px of middle-column height and recognition
about 2481px. Twelve first components and three tail components repeat the same
image/caption pattern; the classification report uses its own scroll area before
another twelve-image gallery. Results are correct, but important comparisons
become separated by several screens.

**Change:** group existing first/tail component galleries more deliberately;
keep headline measurements and the relevant figure together. Keep exact metrics
and every required component/prediction accessible. Improve composition rather
than removing required outputs or adding prose.
**Commands:** `$impeccable layout`, `$impeccable adapt`.

### M5 · P2 · Lab 6 camera instructions lead an uploaded-image workflow

**Location:** `frontend/src/labs/lab6/Lab6.tsx:57`,
`frontend/src/labs/lab6/CameraCapture.tsx`.

The middle column starts with camera buttons, a multi-line camera explanation,
and “Camera stopped,” even when the student is using the bus sample. At desktop,
input/output image captions begin around 239px below the middle-column top. On
mobile, this material takes priority over the actual image comparison.

**Change:** make uploaded-image comparison the default visual anchor. Group or
collapse the existing camera controls and show the expanded camera workflow when
chosen. Preserve camera status and stop controls when a stream is active.
**Commands:** `$impeccable layout`, `$impeccable distill`.

### M6 · P2 · Lab 6 dataset/training modes read like unstructured documents

**Location:** `frontend/src/labs/lab6/DatasetView.tsx:3`,
`frontend/src/labs/lab6/TrainingView.tsx:7`.

Dataset content runs from readiness into preparation instructions with weak
separation. Pending training displays two adjacent paragraphs restating that
training is incomplete, followed by a list and a collapsed commands section.
The controls repeat custom-training status as well. The middle-column desktop
paragraphs span approximately 930px, making short reference sections feel loose.

**Change:** separate current readiness from the existing preparation steps and
collapse secondary local instructions. Keep text to a readable measure and use
the existing headings/list structure consistently. Do not invent web training
controls: training remains a trusted local workflow.
**Commands:** `$impeccable typeset`, `$impeccable distill`.

### M7 · P2 · Lab 7 leaves the first row visually half empty

**Location:** `frontend/src/labs/lab7/Lab7.tsx:49` and shared ImagePanel styles.

The source figure spans the middle area, but its contained 4:3 stage is capped
at 320px high and occupies roughly 427px of a 930px desktop content width. There
is no matching result beside it. Outputs then begin as another section beneath
the status line. This separates the source from masks while leaving broad unused
space above. Region results reach about 2140px on mobile.

**Change:** use a deliberate comparison layout: source beside the principal
output after a run, with secondary views grouped below. Before a result, show the
source as an intentionally sized preview rather than an accidental half-row.
Retain all required masks, markers, overlays, legends, and raw-label downloads.
**Command:** `$impeccable layout`.

### M8 · P2 · Error/status and cross-method state compete

**Location:** `frontend/src/labs/lab6/Lab6.tsx`,
`frontend/src/labs/lab7/Lab7.tsx`,
`frontend/src/labs/lab7/useSegmentation.ts:58`.

On API failure, Lab 6 can show an error, “Checking detector setup…”, and generic
start/run guidance together. Lab 7 shows an error but still says to choose a
method and run. Switching Lab 7 methods retains previous-method outputs, marked
previous; students must reconcile new controls with old-method images.

**Change:** let error, setup, busy, and result states have one clear priority.
Suppress irrelevant existing instructions. Keep previous results only with clear
existing previous-result treatment, or align cross-concept switching with Lab 1's
clear-result policy. Do not silently relabel old masks as current results.
**Command:** `$impeccable harden`.

## Dataset details and Run details: both states

| Panel | Before a run | After a completed run | After settings change |
| --- | --- | --- | --- |
| Lab 5 Dataset details | Four facts plus collapsed identities. Fits the tested viewport. | Same content, correctly unchanged. | Dataset facts remain valid. |
| Lab 5 Run details | Absent, correctly. | 24 nested rows; about 2041px desktop / 2125px at 320px. | Identical drawer text despite changed component count. |
| Lab 6 Image details | Original-only table. | Original/result table with one explanation. | Completed output remains represented. |
| Lab 6 Run details | Absent, correctly. | 17 nested rows; about 1502px desktop / 1586px at 320px. | Identical drawer text despite changed confidence. |
| Lab 7 Image details | Original-only table. | Original and outputs tables with one explanation. | Retained result metadata remains represented. |
| Lab 7 Run details | Absent, correctly. | 22 nested rows; about 1931px desktop / 2019px at 320px. | Identical drawer text despite changed adaptive constant. |

These heights were measured with raw JSON collapsed. A drawer's minimum height
is one viewport, so a 1000px scrollHeight alone does not mean its short content
needs scrolling. Dataset details is **not** the long-content problem.

### D1 · P2 · Recursive labels waste half the drawer width

**Location:** `frontend/src/components/lab/RunMetadata.tsx:11`,
`frontend/src/components/lab/LabUI.css:300,336`.

At desktop drawer width, “Provenance” occupies the left half of an outer row while
all nested fields occupy the right half. The large empty left column persists
for most of the drawer. On mobile, the nested list becomes a long vertical stack.

**Change:** use the existing Parameters/Measurements/Timings labels as full-width
section headings, with compact two-column label/value tables underneath. Avoid
recursively nesting a table-like layout inside another value cell.
**Command:** `$impeccable layout`.

### D2 · P2 · Provenance is fully expanded before useful timing information

**Location:** `frontend/src/components/lab/RunMetadata.tsx:18` and lab callers.

Hashes, library versions, random seeds, solver names, and execution metadata are
all visible by default. Lab 5 timings appear after the entire provenance block;
Lab 6 inference timing appears after the checkpoint hash and runtime versions.
The raw JSON disclosure at the bottom repeats the entire same object.

**Change:** show current-run settings and concise measurements/timings first.
Collapse existing provenance and raw JSON separately. Retain exact hashes,
versions, and seeds for reproducibility; do not delete them just to shorten the
panel. Dataset details should keep its already-compact four-fact layout.
**Command:** `$impeccable distill`.

### D3 · P2 · Raw precision and automatic labels reduce scanability

**Location:** `frontend/src/components/lab/RunMetadata.tsx:1,15`.

Values include `0.02364429199951701` seconds and
`33.00012499676086` milliseconds. Labels include “Pca”, “Svm”, “Iou”, “Imgsz”,
and “Stages ms”. These expose serialization instead of readable lab terminology.

**Change:** format visible timings to an appropriate number of decimals and show
units with values. Normalize existing abbreviations and label capitalization.
Keep exact values in the already-existing raw JSON; add no explanatory paragraphs.
**Command:** `$impeccable typeset`.

### D4 · P2 · Lab 7 includes settings for methods that did not run

**Location:** `frontend/src/labs/lab7/Lab7.tsx:46`,
`frontend/src/labs/lab7/SegmentationControls.tsx`, shared RunMetadata.

A threshold run displays Seed x/y, region tolerance, watershed fraction, Canny
thresholds, closing size, minimum area, and opacity alongside adaptive settings.
Those fields are present in the shared settings response but are not all used by
the selected algorithm. Showing them together makes an unrelated value appear to
have influenced the result.

**Change:** show settings applicable to the completed run's method in the compact
view. Preserve the full serialized settings in raw JSON. Derive relevance from
the actual algorithm branches, not whichever tool is currently selected.
**Commands:** `$impeccable distill`, `$impeccable harden`.

### D5 · P2 · Run details does not identify retained previous runs

**Location:** `frontend/src/components/lab/RunMetadata.tsx:18` and Labs 5–7 callers.

The captured Run details text is exactly identical before and after changing the
PCA count, confidence, or adaptive constant. The values correctly belong to the
completed output, but the drawer does not carry the workspace's previous-result
state. Lab 1's specialized RunDetails already handles this distinction.

**Change:** reuse the existing previous-result treatment and preserve actual
returned parameters. Do not replace them with unexecuted draft controls.
**Command:** `$impeccable harden`.

## Positive findings and verification

- All inspected real experiments completed; no browser runtime errors occurred.
- No page-wide overflow at 1600px, 390px, or 320px in the inspected states.
- Shared Image details tables are materially more compact than the recursive Run
  details layout and keep one explanation.
- Dataset details stays stable across execution; Run details appears only when
  a result exists, which is the correct initial-state behavior.
- Details overlays passed scoped Axe checks and restore trigger focus on Escape.
- The only automated main-content finding in this deeper pass was the variance
  scroll-region warning, qualified by successful manual Tab navigation above.
- Physical camera and actual completed custom-training states remain outside
  verification; pending local training was inspected without fabricating history.

## Recommended sequence, without additional UI prose

1. `$impeccable layout`: Lab 5 empty-state placement and Lab 7 comparison structure.
2. `$impeccable adapt`: correct chart clipping/scroll behavior.
3. `$impeccable distill`: compact Run details; collapse provenance; filter active
   method settings; relocate Lab 6 camera/reference content.
4. `$impeccable harden`: mutually exclusive loading/error states and previous-run
   context in details.
5. `$impeccable typeset`: readable line length, proper labels, and timing precision.
6. `$impeccable polish`: final spacing/alignment pass after those changes.

These can be addressed one at a time or together, followed by another audit.

## Implementation follow-up

The approved readability/layout pass is now implemented without new explanatory
paragraphs. Lab 5 uses one empty/busy presentation, a four-column desktop gallery,
and unclipped variance axes. Lab 6 puts comparison first and collapses camera
controls; collapsing stops the stream. Lab 7 compares source and primary output
and clears outputs when switching method families. Run details uses compact
settings/measurement tables, applicable method parameters, readable timing units,
collapsed provenance/notes, full raw JSON, and previous-result state.

The confirmation pass exercised the same 26 middle-column states and 15 details
states across 1600px, 390px, and 320px. No tested page/overlay overflow or Axe
violations remained; the variance warning was eliminated. Default compact Run
details fit the tested 1000px-high viewport with provenance/JSON collapsed.
A simulated camera-stream check confirmed closing the camera section releases
tracks. Physical camera hardware and actual custom training were not tested.
The measurements and findings above remain the pre-change audit evidence.
