# Image details: before/after-result readability audit

## Scope and verdict

Reviewed Labs 1–7 at 1600px, 390px, and 320px widths with actual local
computation. Lab 1 additionally covered grayscale, resize, and retained results
after draft settings changed. Lab 3 used a color source processed in grayscale.
Lab 5 has Dataset details rather than Image details and was assessed separately.

**Implementation integrity: pass with content-organization issues.** The shared
overlay, typography, labeled values, responsive rows, and dismissal behavior are
coherent. The main problems are repeated explanations and inconsistent metadata
scope across states, rather than basic legibility or incorrect calculations.

This audit did not change the application. Recommendations should reuse or remove
existing text rather than adding more explanations.

## State comparison

| Lab | Before a result | After a result | Finding |
| --- | --- | --- | --- |
| 1 | One Original image block and one metadata-help disclosure, plus a second always-visible explanation. | Original + Result blocks, each with identical help, plus the always-visible explanation. | Highest explanatory duplication. Result values correctly reflect grayscale and resize operations. |
| 2 | One metadata block for the working grayscale input. | The same input block. | Concise; not a duplicated original/result view. Scope is not explicitly labeled inside the drawer. |
| 3 | Uploaded/source metadata; tested as 3-channel BGR. | Working original metadata; tested as 1-channel grayscale after processing. | The meaning of the same unlabeled block changes across states. |
| 4 | Image A + Image B, each with the same help disclosure. | Those two blocks plus Keypoints A, Keypoints B, and Matches, each with another copy of the same help. | Two identical help disclosures become five. Inputs are grayscale while annotated outputs are BGR; matches have a different width, so the measurements themselves are useful. |
| 5 | Dataset totals, image size, feature count, identities. | Same dataset facts. | Correctly stable; no unnecessary result duplication. PCA settings/provenance remain in Run details. |
| 6 | Input metadata. | Same input metadata. | Concise, but no input/result heading. The panel is about the source, not a comparison. Physical camera operation was not exercised. |
| 7 | Input metadata. | Same input metadata despite multiple mask/overlay outputs. | Concise, but does not communicate the same scope as Lab 1/4's Image details. Not an output-metadata comparison. |

## Prioritized findings

### 1. P2 · Remove repeated explanations, not the measurements

**Location:** `frontend/src/components/lab/ImageMetadata.tsx:14`,
`frontend/src/labs/lab1/Lab1.tsx:50`, and
`frontend/src/labs/lab4/Lab4.tsx:51`.

ImageMetadata appends identical “What do these values mean?” content to every
image. Lab 1 also includes “Shape, channels & values” covering the same concepts.
With a result, Lab 1 offers three explanations of the same terms. Lab 4 grows
from two identical help disclosures to five.

**Impact:** repeated disclosure controls and prose make students scan more content
without learning anything new. Repeated accessible names also make the help
controls difficult to distinguish out of context.

**Recommendation:** render the four measured properties for each relevant image,
then retain only one shared existing explanation for the whole drawer. Remove
Lab 1's duplicate always-visible explanation if the shared disclosure remains.
Suggested command: `$impeccable distill`.

### 2. P2 · Prioritize comparison over upload/processing policy

**Location:** `frontend/src/labs/lab1/Lab1.tsx:53`.

Lab 1 always displays the complete upload/handling list, including rotation rules
while inspecting pixels or resizing. BGR/channel handling also repeats the
metadata explanation. The panel mixes actual image properties, conceptual
teaching, upload requirements, execution policy, and download behavior.

**Evidence:** at 320px with a 1000px-high viewport, the panel's scrollable content
is about 1341px before a result and 1648px after a result. Lab 4's five-block
result panel is about 1751px high. These measurements used collapsed help.

**Impact:** long reference content competes with the values students opened the
panel to compare; results and their changed properties take longer to locate.

**Recommendation:** keep original/result measurements first. Collapse the
existing handling section, and keep operation-specific execution details with
Run details where appropriate. Do not delete upload limits or algorithm facts.
Suggested commands: `$impeccable distill`, `$impeccable layout`.

### 3. P2 · Make metadata scope consistent across states

**Location:** `frontend/src/labs/lab3/Lab3.tsx:53`;
`frontend/src/labs/lab2/Lab2.tsx:39`;
`frontend/src/labs/lab6/Lab6.tsx:43`;
`frontend/src/labs/lab7/Lab7.tsx:38`.

Lab 1/4 label each represented image. Labs 2/3/6/7 present an unheaded property
block. More importantly, Lab 3 changes from `source.frame` to
`result.original.frame` without retaining the source block or labeling the
change. The live test changed from `(480, 640, 3)`, BGR to `(480, 640)`, grayscale
in the same drawer after running grayscale processing on a color input.

**Impact:** students may interpret this as the uploaded image changing, when the
metadata actually describes a processed working copy. The common Image details
name also promises different information in different labs.

**Recommendation:** choose a consistent source/working-result policy and group
with the existing Original/Result image labels. In Lab 3, retain the source and
clearly distinguish the working copy when their properties differ. Labs with
source-only metadata should identify that scope rather than duplicating it into
multiple artificial result sections. Suggested command: `$impeccable clarify`.

### 4. P2 · Carry the existing previous-result state into Image details

**Location:** `frontend/src/labs/lab1/Lab1.tsx:49` and
`frontend/src/labs/lab1/RunDetails.tsx:23`.

After a successful 2000 × 1500 resize, changing the draft height to 1400 correctly
leaves the completed output unchanged. Image details continues to say “Result
image” and show 2000 × 1500, with no indication that those properties belong to
the previous completed run. The workspace and Run details do expose that state.

**Impact:** students inspecting dimensions after editing fields may think resize
ignored their new settings. The displayed dimensions are correct for the actual
output, but the result's state is not clear within this overlay.

**Recommendation:** reuse the existing previous-result treatment/wording in this
section; never substitute draft settings for actual computed metadata.
Suggested command: `$impeccable harden`.

### 5. P2 · Make original/result comparison more compact

**Location:** `frontend/src/labs/lab1/Lab1.tsx:48` and
`frontend/src/labs/lab4/Lab4.tsx:53`.

Each block repeats the same layout, range note, and explanation control. Values
such as uint8 and 0–255 often remain unchanged. The relevant difference can be
one row (grayscale changes shape/channels; resizing changes dimensions/shape),
but users must compare entire vertically separated blocks.

**Recommendation:** align original/result measurements using the same property
order, spacing, and compact grouping. Consider comparison rows on wider drawers
and clearly grouped blocks on narrow screens. Preserve dimensions, shape,
channels, and dtype where they describe different images; do not hide actual
values merely because they happen to match. Show identical explanatory range
text once where it applies to all represented images.
Suggested commands: `$impeccable layout`, `$impeccable typeset`.

## What should stay

- Dimensions and array shape: the width/height versus row/column distinction is
  part of the lab, not an accidental duplicate.
- Original and result values: unchanged values can still support comparison.
- BGR/grayscale, channel count, and dtype: these communicate different properties.
- The current 15px values, quieter labels, mobile label/value rows, fixed overlay,
  close button, and bottom return action.
- Dataset details in Lab 5 as a distinct concept rather than forcing an
  artificial original/result image comparison into that lab.

## Checks and health score

Sixteen before/after/specific-result states were captured at three viewport
widths, for 48 state/viewport checks. No open-overlay horizontal overflow or Axe
violations were detected. Escape and trigger-focus return passed. The detector
reported no findings in the audited shared components and Lab 1 panel code.
No performance benchmark, screen-reader session, or camera test was performed.

| Dimension | Score / 4 | Basis |
| --- | --- | --- |
| Accessibility | 3 | Automated checks and focus dismissal passed; repeated help names remain. |
| Performance | 3 | Existing response data is rendered locally; repeated explanatory markup; no profiling. |
| Responsive design | 3 | No overflow and readable mobile rows; long stacked comparison content. |
| Theming | 4 | Consistent token-based current light-theme hierarchy in this scoped panel. |
| Implementation integrity | 2 | Shared implementation is sound, but duplication and image-scope differences persist. |
| **Total** | **15/20 · Good** | Content organization needs the next pass. |

Five P2 findings; no verified P0/P1 blockers. No unnecessary P3 items included.
The score is a qualitative audit judgment, not WCAG certification.

## Suggested order

1. `$impeccable distill`: one shared explanation; collapse existing handling notes.
2. `$impeccable clarify`: consistent source/result grouping, especially Lab 3.
3. `$impeccable harden`: propagate existing previous-result state.
4. `$impeccable layout`: compact, aligned before/after measurements.
5. `$impeccable polish`: finish spacing after structural changes.

These can be addressed individually or together, followed by another audit.

## Implementation follow-up

After this audit, the comparison-table recommendation was implemented. Lab 1 now
has conditional Original/Result columns, a Previous result label when applicable,
changed-value highlighting, one shared explanation, and collapsed handling notes.
Lab 3 keeps source and working-original metadata separate. Lab 4 and Lab 7 group
inputs and outputs into separate tables with one explanation. Labs 2 and 6 also
show available outputs. Lab 5 retains dataset-specific details. Mobile tables
stack values per property without horizontal scrolling. The measurements above
remain the pre-change audit evidence.
