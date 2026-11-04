# Lab 6 experiment workspace audit

Date: 2026-11-05. Scope: Detect, Dataset, Training & evaluation, and experiment details. Learning Canvas excluded; no application code changed during this audit.

Method: inspected current React/CSS and live browser at 1440×1000 and 390×1000. Used the actual completed bottle run; simulated pending, running, failed, and backend-unavailable status responses. Simulations did not alter training artifacts. Ran axe within `.lab-workspace`, including a separate expanded-panel pass, and the Impeccable detector on `frontend/src/labs/lab6`.

## Integrity verdict

Pass on shared product identity and real computation; needs refinement in state handling and information hierarchy. Shared sample picker, controls, image panels, and metadata drawers remain coherent with the other labs. Dataset and Training use a reference-document layout inside an experiment shell: setup instructions compete with completed results, and unrelated image details remain visible. Detector returned no findings; this does not clear the verified issues below.

## Health score

| Dimension | Score / 4 | Evidence |
| --- | --- | --- |
| Accessibility | 3 | Default desktop/mobile workspace axe scans found no violations; loss series depend on color. Expanded scroll regions need cross-browser verification. |
| Performance | 3 | No motion/layout-thrashing issue found in inspected code; expanded raw history creates a very large DOM presentation. No profiling or network performance benchmark performed. |
| Responsive design | 2 | No outer workspace overflow at tested widths; mobile dataset table and chart scroll internally, while low-value sidebar content precedes results. |
| Theming | 3 | Main surfaces use shared tokens; three chart series use literal colors. No alternate theme exists to test. |
| Implementation integrity | 2 | Shared components are reused, but completed-state hierarchy, fallback states, duplicated facts, and hash-dependent copy need work. |
| **Total** | **13 / 20** | **Acceptable: significant improvements needed** |

8 grouped findings: 0 P0, 2 P1, 6 P2. No task-blocking defect was observed in the tested flows. Ratings are scoped audit judgments, not a WCAG certification.

## Findings, in priority order

### 1. [P1] Raw history expands the page by approximately 35,500 px

Location: `frontend/src/labs/lab6/TrainingView.tsx`, Recorded metrics & provenance disclosure (line 32); shared `.lab-preprocessing pre` styles.

Category: implementation integrity / responsive design.

Evidence: expanding the real 100-epoch training artifact produced a 35,491 px tall `pre` at both viewport widths. Its horizontal content measured 928 px versus a 324 px mobile container.

Impact: one secondary action pushes later content and navigation far away. The raw view repeats every epoch already represented by the chart, making it hard to find model provenance.

Recommendation: present concise provenance using existing shared run-metadata tables/drawers; keep complete history in a JSON download or bounded, labeled, keyboard-accessible raw region. Retain every original field in the raw artifact.

Suggested command: `$impeccable distill`, then `$impeccable harden` for the scroll region.

### 2. [P1] Loss curves require color identification and lack a readable value scale

Location: `frontend/src/labs/lab6/TrainingView.tsx:28`, `.detection-chart` in `Lab6.css:16`.

Category: accessibility / implementation integrity.

Evidence: three solid polylines are distinguished solely by green/brown/blue, matched to a color-named sentence. No numeric Y-axis ticks or individually labeled series are present. Mobile SVG minimum width is 500 px within approximately 324 px of available space.

Impact: users who cannot distinguish those colors cannot reliably identify each curve. All users can see a trend but cannot read approximate loss values from the plot. Horizontal panning separates chart endpoints on phones.

Standard: color-only series identification conflicts with WCAG 1.4.1; missing numeric ticks are a comprehension issue, not a standalone WCAG failure.

Recommendation: distinguish lines with dash patterns or direct labels, add a compact numeric loss axis, use semantic chart tokens, and fit the chart responsively while preserving legible labels. Offer structured values separately from the full training JSON.

Suggested commands: `$impeccable harden`, `$impeccable adapt`.

### 3. [P2] Unavailable, running, and failed states lack distinct presentation

Locations: `TrainingView.tsx:13`, `DatasetView.tsx:3`, `Lab6.tsx:57`, `useDetectionExperiment.ts:49`.

Category: implementation integrity / accessibility.

Evidence: when status fetching fails, Training still says “Checking local training artifacts…” and the sidebar says “checking”; Dataset says no dataset has been validated. The error heading says “Could not process the image.” Running and failed simulations retain the same setup checklist. A failed training message is an ordinary paragraph rather than the existing failure component.

Impact: users cannot distinguish unknown status from genuinely absent data, or ongoing work from preparation. A service failure is described as an image failure even on Dataset/Training.

Recommendation: use explicit loading/unavailable/empty/running/failed/completed states, route errors to the relevant section, retain previous confirmed artifacts with a stale indication on refresh failure, and keep one useful recovery action such as Refresh status or the retained log.

Suggested command: `$impeccable harden`.

### 4. [P2] Setup instructions take priority over the prepared dataset and completed model

Locations: `DatasetView.tsx:3`, `TrainingView.tsx:15`.

Category: implementation integrity / readability.

Evidence: the populated Dataset heading is “Prepare your object dataset”; its introduction is a backend validation sentence. Completed Training leads with a three-step preparation checklist and local commands before About this model or metrics.

Impact: students encounter instructions for work already finished before learning what is available to experiment with. Phrases such as decoded-image split separation, class IDs, and normalized labels receive more prominence than the current dataset's size and supported class.

Recommendation: for ready/completed states, lead with the current dataset/model summary and measured outputs. Group existing preparation instructions, folder format, and CLI commands in secondary help. Keep the empty-state setup path visible when needed. Reorder and shorten existing text rather than expanding it.

Suggested commands: `$impeccable distill`, `$impeccable clarify`.

### 5. [P2] Dataset/Training inherit an image-oriented sidebar with little relevant action

Locations: `frontend/src/labs/lab6/Lab6.tsx:45`, controls block; shared `LabWorkspace.tsx` responsive ordering.

Category: responsive design / implementation integrity.

Evidence: Dataset/Training sidebar contains a repeated section heading, Refresh status, repeated training status/instructions, settings help, and Image details for the current detection photo. On mobile that block was approximately 299 px tall before the actual dataset or training content. Upload/sample controls also remain available on these reference sections.

Impact: the shell suggests editable experiment settings where there are none. On mobile it delays the content users selected; image details imply relevance to the training dataset despite referring to one inference input.

Recommendation: make controls and details section-specific. Keep image actions/details in Detect; consolidate relevant refresh/log/provenance actions for Dataset/Training near their content using an existing shared pattern. Avoid adding a second competing sidebar or new explanation paragraphs.

Suggested command: `$impeccable layout`.

### 6. [P2] Completed training facts repeat across four different presentations

Location: `frontend/src/labs/lab6/TrainingView.tsx:18` through metrics block at line 27.

Category: implementation integrity / readability.

Evidence: mAP@50 appears in About this model and the metrics grid; epoch count and evaluation split recur in the table and completion paragraph; completed status also appears in the sidebar and introduction. mAP labels vary between `mAP@50` and `mAP@0.50`.

Impact: the center column becomes longer without adding information, and repeated labels compete with the key model facts.

Recommendation: retain About this model for class/model/data/training context and one metrics presentation for evaluation values. Use one completed status and consistent metric labels. Preserve the validation-versus-test distinction.

Suggested command: `$impeccable distill`.

### 7. [P2] Dataset counts need a small-screen table treatment

Location: `frontend/src/labs/lab6/DatasetView.tsx:4`, `Lab6.css:7` through table styles.

Category: responsive design / readability.

Evidence: at 390 px viewport width, the counts table had 336 px of content within a 322 px scroll container. “Background images” wraps and row labels remain raw `train` / `val` identifiers. The table introduces horizontal panning for only two small rows.

Impact: users must pan for simple counts that should be readable at a glance.

Recommendation: use familiar Training/Validation labels, reduce narrow-screen cell padding, and adapt or stack the existing table at small widths. Preserve background counts in secondary details if they are not useful in the compact view; do not silently omit them from the underlying artifact.

Suggested command: `$impeccable adapt`.

### 8. [P2] Reviewed-photo copy is coupled to one hard-coded dataset hash

Location: `frontend/src/labs/lab6/TrainingView.tsx:9`, model scope row at line 19.

Category: implementation integrity.

Evidence: “reviewed photos” and the validation-sample note are enabled by a literal dataset SHA. Counts correctly require a dataset/run SHA match, but approval/sample provenance does not come from typed metadata. The class formatter also transforms any `bottle` class to “Bottles only,” even if a future dataset has additional classes.

Impact: a regenerated approved dataset silently loses its reviewed label; a multi-class successor could make the scope row misleading. This is a maintainability and future-state issue, not an incorrect count in the current run.

Recommendation: record approval and sample split provenance in validated artifacts, expose only the necessary typed fields, and derive singular/multiple class scope from the actual class list. Preserve the current protection against mixing counts from different datasets/runs.

Suggested command: `$impeccable harden`.

## Automated checks and limits

- Impeccable detector: `[]`; no deterministic finding. Visual/hierarchy findings above are independently verified.
- Axe: zero findings in six default desktop/mobile workspace scans.
- Expanded Training and Dataset code blocks: axe reported `scrollable-region-focusable`. Manual Chromium Tab navigation did focus the expanded raw `pre`, so this is not treated as a confirmed Chromium keyboard failure. Explicit focusability, region labeling, and Safari/Firefox checks are recommended for predictable cross-browser access.
- No outer workspace overflow at 1440 or 390 px. Internal mobile table and plot scrolling verified.
- Completed state uses actual artifacts. Pending/running/failed/unavailable checks used intercepted responses; they did not start or interrupt training.
- Physical camera, screen-reader behavior, non-Chromium browsers, full text-zoom behavior, and performance profiling were not tested.
- Audit screenshots and raw measurements were saved under `/private/tmp/lab6-*`; these are local temporary evidence, not committed assets.

## Preserve

- Shared dropdown and controls, visible field labels, clear focus styles, and consistent palette.
- Real metrics with an explicit evaluation split; model weight and dataset/run matching checks.
- Native disclosures for optional setup material and right-side metadata overlays that do not resize the workspace.
- Existing semantic row headers, captions, and metric definitions as description lists.
- The distinction between validation samples, independent testing, and illustrative learning content.

## Recommended order

1. `$impeccable distill`: reorganize completed Dataset/Training, remove duplicated summaries, bound raw history.
2. `$impeccable harden`: distinct service/run states, robust provenance, accessible chart identification and scroll regions.
3. `$impeccable adapt`: compact mobile table, fitted plot, and shorter section-specific controls.
4. `$impeccable polish`: final spacing and typography pass within the experiment workspace only.

These can be run individually, together, or in another preferred order. Re-run `$impeccable audit` after fixes to reassess the score.

## Implementation follow-up (2026-11-05)

All eight grouped findings were addressed together in the experiment workspace.
Ready datasets and completed model results now lead; setup/format/provenance use
shared drawers, and full training JSON preserves all epoch records as a download.
Dataset/Training omit the image-oriented settings rail. The responsive loss chart
has numeric axes and solid/dashed/dotted series; tables fit at 320, 390, 1024, and
1440 px. Status errors are distinct from image-processing errors and refresh
failures retain previous artifacts. Reviewed counts come from validated approval
hashes, and sample-split copy comes from matching image/dataset provenance rather
than one hard-coded dataset SHA. Learning Canvas markup/content was preserved.

Browser verification covered all four widths, empty/pending/running/failed and
backend-unavailable states, retained data after refresh failure, drawer escape
and sizing, 100-epoch JSON download content, real custom inference, and shared
workspace smoke checks on Labs 1/5/7. Automated workspace and opened-drawer
accessibility checks passed; the Impeccable detector returned no findings.
The original score above describes the pre-change audit, not a new certification.
