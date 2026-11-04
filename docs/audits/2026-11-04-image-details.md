# Image details UI/UX audit

Scope: shared image-details overlays and Lab 1's surrounding image-selection UI.
This is a focused audit, not an application-wide accessibility certification.

## Findings

| Priority | Finding | Evidence | Recommendation |
| --- | --- | --- | --- |
| Medium | Metadata is visually subordinate to supporting explanations. | Values and labels use 13px/19.5px; explanatory paragraphs use 15px/26.25px. | Use 15px values, 13–14px labels, and more row spacing. Keep actual measurements visually primary. |
| Medium | Explanation repeats. | Lab 1 includes both “What do these values mean?” and “Shape, channels & values,” covering dimensions, BGR, and uint8 twice. Result metadata adds another copy of the same help. | Keep one short explanation after the original/result measurements. |
| Medium | Two-column metadata becomes cramped on narrow screens. | At 320px, “Supported range: 0–255” wraps between 0– and 255. The overlay itself has no horizontal overflow. | Stack metadata on narrow screens or use compact label/value rows; keep units/ranges together. |
| Medium | Technical handling notes dominate the reading flow. | The six-bullet handling section extends below the first 1000px-high mobile viewport, even before a result is added. | Show measurements first and move upload/processing policies into one collapsed section inside the overlay. Preserve the information. |
| Low | Nested help target is smaller than the preferred touch target. | “What do these values mean?” measures about 38px high; the close control measures 44px. | Give disclosure summaries a minimum height of 44px. |

## Existing strengths

- One shared right-side overlay pattern across labs; opening details does not resize the workspace.
- Clearly separated original/result image measurements and labeled values.
- Escape and outside dismissal; keyboard focus returns to the trigger.
- Sticky title and close action; a second return action at the bottom.
- Token-based colors and no automatic motion in the details panel.
- Crop selection supports drag, touch, arrow keys, and coordinate fields.

## Checks and scores

| Area | Score (0–4) | Basis |
| --- | --- | --- |
| Accessibility | 3 | Axe found no violations in the open overlay at tested widths; focus and Escape verified. Small nested help targets remain. |
| Performance | 3 | Reuses existing image data and metadata; no new requests on opening. No profiling or device performance budget was measured. |
| Theming | 3 | Uses existing paper, ink, accent, and line tokens. Readability hierarchy needs improvement. |
| Responsive design | 3 | Tested at 1600px, 390px, and 320px; no overlay overflow. Narrow-column wrapping remains. |
| Implementation integrity | 3 | Shared components are reused; duplicated explanatory content remains. Bundled detector returned no findings for audited files. |

Indicative health score: 75/100. Scores include visual judgment; they do not
represent a WCAG conformance claim or a measured performance benchmark.

## Changes completed alongside this audit

- Crop and pixel-selection captions now use the same font, line height, color,
  and spacing below the image; browser-computed styles match at all three widths.
- Switching Lab 1 tools clears the previous output and accumulated rotation,
  while keeping the source and saved settings. Superseded requests stay aborted.

The recommendations above remain audit findings, not implemented redesigns.
Suggested order: simplify the duplicated explanations, improve metadata hierarchy,
then adapt narrow-screen rows and touch targets.
