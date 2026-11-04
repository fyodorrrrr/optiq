# Labs 1–7: consistency and readability audit

## Implementation integrity verdict

**Pass, with refinements needed.** The labs share a coherent learning-workspace
system: tools, controls, real image outputs, optional details, and contextual
Learning Canvas. The bundled detector reported no findings in the shared lab
components or lab modules. Visual judgment identified the issues below; detector
silence is not evidence that those issues do not exist.

The user's final direction was to improve readability and consistency without
adding UI text. The five shared styling findings marked **resolved** were addressed
within that direction. Other recommendations remain unimplemented.

## Scope and evidence

- All seven default experiments completed against the local backend.
- Inspected 29 tool/method panels and desktop/mobile workspace screenshots.
- Checked 1600px, 390px, and 320px widths: no page overflow or Axe violations in
  the tested main-content states, before or after the styling pass.
- Compared normalized control text before/after: unchanged in all seven labs.
- Opened the available image/dataset overlays at narrow width: no overflow.
- Tested backend-unavailable entry states separately: all seven display errors
  and disable their primary run actions. Labs 6–7 retain generic start guidance
  beneath those errors, recorded below.
- Lint, TypeScript/production build, and diff whitespace checks passed.
- Limits: default runs do not cover every algorithm parameter combination.
  Physical camera operation, actual custom training, screen-reader sessions,
  browser text zoom, and device performance profiling were not performed.
  Automated accessibility results are not a WCAG conformance claim.

## Health scores

Scores are informed judgments, 0–4 per dimension, not benchmark measurements.
Theming evaluates the current light theme; dark mode is not a product requirement.

| Lab | Accessibility | Performance | Responsive | Theming | Integrity | Total |
| --- | --- | --- | --- | --- | --- | --- |
| 1 · Image fundamentals | 3 | 3 | 3 | 3 | 3 | 15/20 · Good |
| 2 · Edge detection | 3 | 3 | 3 | 3 | 3 | 15/20 · Good |
| 3 · Histograms & contrast | 3 | 3 | 3 | 3 | 3 | 15/20 · Good |
| 4 · Features & matching | 3 | 3 | 3 | 3 | 3 | 15/20 · Good |
| 5 · PCA & eigenfaces | 3 | 3 | 3 | 3 | 3 | 15/20 · Good |
| 6 · Object detection | 3 | 3 | 3 | 3 | 3 | 15/20 · Good |
| 7 · Segmentation | 3 | 3 | 3 | 3 | 2 | 14/20 · Good |

No P0 blockers or P1 issues were verified in this scoped pass. Fourteen P2
findings were recorded: five shared styling issues resolved, nine remaining.
No P3-only polish items are included.

## Shared findings

| ID / status | Location | Evidence and user impact | Recommendation / command |
| --- | --- | --- | --- |
| F01 · P2 · Resolved | `frontend/src/components/lab/LabUI.css:214` | Controls stretched to result height: Lab 4 about 1902px and Lab 5 about 1572px, producing long empty colored panels. | Applied natural-height sidebar alignment. Lab 4 controls now about 772px; Lab 5 about 467px. `$impeccable layout` |
| F02 · P2 · Resolved | `LabUI.css:351`; `labs/lab5/Lab5.css:36` | Lab 5 run/reset controls touched; Lab 7 reset was narrower than its primary action. This weakened shared action hierarchy. | Applied matching full-width action stacks with 12px gaps to Labs 5 and 7. `$impeccable layout` |
| F03 · P2 · Resolved | `components/lab/ImageMetadata.tsx`; `LabUI.css:359` | Metadata values were 13px while explanatory prose was 15px; two columns broke the range awkwardly at 320px. | Values now 15px with 13px labels; narrow screens use label/value rows and keep the numeric range together. `$impeccable typeset` |
| F04 · P2 · Resolved | `LabUI.css:355`; `labs/lab4/Lab4.css` | Lab 2 preprocessing summary was about 20px high, Lab 6 detection summary 24px, and Lab 4 method buttons 39px. These are harder touch targets. This is a usability finding, not an unqualified WCAG failure. | Applied 44px minimum heights; the confirmation scan found no sub-44px visible main-content actions in the default tested views. `$impeccable adapt` |
| F05 · P2 · Resolved | `LabUI.css:349` | Arrows were crowded against text on contextual links, while sidebar rows had deliberate separation; help spacing also varied. | Shared arrow gap and help-action spacing, without changing copy. `$impeccable polish` |
| F06 · P2 · Open · Performance | `frontend/src/App.tsx:7` | All lab routes are eagerly imported into one application chunk, approximately 491kB JS / 171kB gzip in the local build. Opening a simple lab also loads unrelated lab UI. No runtime bottleneck was measured. | Consider route-level code splitting while preserving loading/error behavior. `$impeccable optimize` |
| F07 · P2 · Open · Integrity | `labs/lab6/Lab6.tsx`; `labs/lab7/Lab7.tsx` | Backend failure displays an error but the following status still says to choose an image/method and run, while the run button is disabled. Conflicting guidance makes recovery less clear. | Suppress the generic start status when an error is displayed; no new wording needed. `$impeccable harden` |

## Per-lab findings and improvements

### Lab 1 · Image fundamentals

**Working:** clear primary action; crop drag and coordinate fields; below-image
selection caption; tool switching clears prior results. Resize computation and
its output-size validation work. Fit-to-panel images looking similar after a
same-ratio resize is expected behavior, not an algorithm defect.

**L01 · P2 · Open · Readability/integrity.** `labs/lab1/Lab1.tsx:50` and
`components/lab/ImageMetadata.tsx` repeat the dimensions/BGR/uint8 explanation in
each metadata block and again under “Shape, channels & values.” Students must
scan repeated prose to find actual measurements. Retain one existing explanation
and collapse the existing handling section. `$impeccable distill`.

### Lab 2 · Edge detection

**Working:** consistent original/Sobel/Canny captions, honest display-scaling
notes, shared processing input, and clear completed-run downloads. Preprocessing
summary touch height is now consistent.

**L02 · P2 · Open · Responsive.** `labs/lab2/Lab2.tsx:44` and
`LabUI.css:133` stack all three images on mobile. The original and Canny result
are separated by the complete Sobel panel, making direct comparison harder.
Keep all required outputs but group their existing content more compactly or
provide an image comparison presentation. Do not add explanation text.
`$impeccable adapt`.

### Lab 3 · Histograms & contrast

**Working:** shared histogram count scale, measured data, images paired with
histograms, and preserved method settings. Sidebar height no longer follows the
1265px desktop result area.

**L03 · P2 · Open · Layout/readability.** `labs/lab3/Lab3.tsx:72` renders linear
adjustment in a separate, larger two-column composition, unlike the three methods
above. On mobile the viewer area measures about 2702px at 390px width, so the
fourth result is remote from the original. Reuse the existing result-card rhythm
and group the four image/histogram pairs consistently. `$impeccable layout`.

### Lab 4 · Features & matching

**Working:** actual method measurements, explicit candidate-match limitation,
scroll-contained comparison table, and consistent source/result image panels.
Method buttons now meet the chosen 44px touch target.

**L04 · P2 · Open · Integrity/responsive.** `labs/lab4/Lab4.tsx:34,85,93`
offers method selection both in the tool sidebar and table. Selecting Compare
can leave ORB selected in the inspector, which is valid but less obvious. Mobile
viewers are about 2625px high; five images and a wide table separate selection
from the matches. Consolidate selection emphasis and prioritize the existing
matches view; keep required method metrics and keypoint images accessible.
`$impeccable layout`.

### Lab 5 · PCA & eigenfaces

**Working:** one principal parameter, training/test distinction, lazy-loaded
gallery images, truthful signed-component captions. Run/reset spacing is fixed;
the sidebar ends with its controls.

**L05 · P2 · Open · Responsive/readability.** `labs/lab5/Lab5.tsx:24` and
`labs/lab5/Lab5.css:6` show all 15 eigenfaces before subsequent content; mobile
viewers measure about 2378px at 390px and 2477px at 320px. Uniform repetition
makes first/last components harder to compare. Recompose the existing gallery
into compact first/tail groups while retaining all required components and
existing variance captions. `$impeccable adapt`.

### Lab 6 · Object detection

**Working:** real detections, confidence/box details, upload alternative to
camera, explicit custom-training availability, and locally scoped refresh action.
Camera code stops tracks on hiding/unmount and bounds requests; physical camera
behavior was not exercised in this audit.

**L06 · P2 · Open · Layout/integrity.** `labs/lab6/Lab6.tsx:50,56` places
camera controls and a long camera explanation before uploaded-image results,
while custom-training status appears in all control modes. Unrelated workflow
information competes with a basic detection run. Use progressive disclosure or
reposition existing camera/training content into its relevant modes; retain
availability information without introducing new copy. `$impeccable distill`.

Also affected by F07's conflicting offline status.

### Lab 7 · Segmentation

**Working:** explicit foreground descriptions, real masks, labeled downloads,
seed coordinate alternatives, and honest distinction between region IDs and
semantic classes. Reset/run sizing is now consistent.

**L07 · P2 · Open · Integrity.** `labs/lab7/useSegmentation.ts:58` switches
methods without clearing the previous method result; Lab 1 now clears results
when switching concepts. The old output is marked previous, so it is not silently
misrepresented, but students can see new controls beside old-method masks.
Choose a consistent cross-concept result policy; comparison subviews in Labs
2–5 may legitimately retain one shared run. `$impeccable harden`.

Also affected by F07's conflicting offline status. The region mode exposes six
controls; moving existing secondary controls into a disclosure is a possible
future simplification, not a blocking defect.

## Strengths to preserve

- Shared header alignment, tools, fields, primary actions, feedback, downloads,
  right-side overlays, and Learning Canvas establish a recognizable system.
- Real results and clear provenance; illustrative diagrams are identified.
- Readable neutral/green palette and token-based common styling.
- No page-wide overflow at the three tested widths; wide tables scroll locally.
- Optional help avoids forcing long explanations into the experiment.
- Reduced-motion support, keyboard alternatives, and focus restoration.

## Recommended remaining work

1. **P2 · `$impeccable harden`**: reconcile Labs 6–7 error/status rendering and
   Lab 7 cross-method result retention.
2. **P2 · `$impeccable distill`**: remove repeated Lab 1 explanations and separate
   existing Lab 6 camera/training content from the basic image workflow.
3. **P2 · `$impeccable layout` / `$impeccable adapt`**: improve result composition
   in Labs 2–5 using existing images, labels, and controls.
4. **P2 · `$impeccable optimize`**: evaluate route splitting with measured loading
   evidence before changing the application structure.
5. **`$impeccable polish`**: final alignment/type pass after the structural fixes.

Remaining items can be addressed individually or together; re-run
`$impeccable audit` after changes to compare results. No additional UI copy is
required by these recommendations.
