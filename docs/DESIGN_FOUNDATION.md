# Optiq Design Foundation

## Status and Scope

The portable current design-system reference is [DESIGN.md](../DESIGN.md).
This document retains project-specific rationale and historical references.

This records the current implemented palette, radius conventions, learning-map
treatment, and lab UI conventions. It is not a finalized brand system. Earlier
mockups informed these choices; current availability and component descriptions
below reflect the working application.

## Implemented Colors and Corner Radii

```css
:root {
  --paper: #f7f7f5;
  --paper-deep: #ffffff;
  --ink: #171717;
  --ink-soft: #656565;
  --line: #e5e5e2;
  --line-strong: #d4d4d0;
  --surface-muted: #e4e4e0;
  --accent: #087f46;
  --accent-deep: #075a34;
  --accent-soft: #e1f5e8;
  --accent-path: #70bd8d;
  --selection: #bceace;
  --mascot-filter: saturate(2.15) brightness(1.04);
  --control-border: #8b948a;
  --error-border: #b75d4c;
  --error-surface: #fff5f1;
  --error-ink: #823a2b;
  --focus: #90541a;

  --radius-sm: 4px;
  --radius-control: 8px;
  --radius-panel: 12px;
  --radius-pill: 999px;
}
```

Use `paper` for the application background and `paper-deep` for panels and image surfaces. Use `ink` for primary text, `ink-soft` for supporting text, and the line tokens for dividers and boundaries. Reserve `surface-muted` for secondary backgrounds and subtle neutral highlights.

Use 8px corners for standard controls, 12px for panels, and 4px for compact elements. Reserve pill corners for badges and tags that benefit from them. Specialized node geometry is a deliberate map treatment rather than a general component-radius convention.

Keep these tokens consistent unless testing justifies a change. The user selected
the more saturated emerald preview on 2026-11-06. Emerald green
identifies primary actions and selected tools; pale mint supports softer
highlights. Use the dedicated control-border, focus, and error tokens instead
of relying on subtle neutral dividers for interactive states. The values above
come from `frontend/src/index.css`.

The hero mascot and wordmark image use the shared
`mascot-filter` to match the approved emerald preview. The browser-tab SVG
embeds the original 32px mascot PNG with the equivalent saturation/brightness
treatment. Original PNG/Piskel sources remain unchanged and editable; experiment
outputs and illustrative algorithm color palettes do not receive this filter.

## Surface Principles

- Prefer flat surfaces, whitespace, alignment, and subtle borders over nested cards or heavy shadows.
- Keep experimental images and visualizations visually prominent.
- Maintain consistent treatments across labs while allowing specialized layouts.
- Use elevation for meaningful relationships such as overlays and popovers.
- Add tokens and components in response to actual requirements rather than anticipating every possible use.

## Learning Map — Selected Direction

**Chosen:** shallow dimensional nodes, following the side-by-side browser comparison. The flat-node alternative was not selected.

Give each node a top face and a shallow solid darker base. The depth should make it feel selectable without glow, elaborate textures, or heavy shadows. Hover and keyboard focus raise the node face slightly and highlight a short adjacent path segment; the selected node retains this treatment afterward. Press feedback remains shallow, and reduced-motion mode retains the highlight without movement.

Keep navigation, text, and laboratory workspaces flat. The node treatment is a focused exception to the surface principles, not a reason to make every control dimensional.

The homepage direction is a short introduction followed by a winding map of seven labeled labs. Use the map to suggest order without enforcing prerequisites: all implemented labs are directly accessible.

Each map node shows its laboratory number. These labels identify modules, not
student progress or availability gates. All seven labs are accessible; Lab 5
presents recorded PCA/SVM runs, Lab 6 includes recorded detection and actual
custom-model training/evaluation results, and Lab 7 combines live classical
segmentation with saved semantic predictions. No completion state is saved.

## Laboratory Learning Content

All labs share the page shell, workspace, controls, viewers, and applicable
input patterns in `frontend/src/components/lab/`. Lab 1 shows a static annotated
Learning Canvas beneath the experiment; short explanations sit beside the
visual on larger screens and below it on small screens. Examples are labeled
illustrative. Its **How it works**, **Image details**, and **Run details** actions
use the shared side drawer. Other labs use `LabGuide`, which wraps the same Learning Canvas and details pattern.
Keep specialized experiment state, algorithms, and teaching visuals per lab.

## Intentionally Open

- Further brand/typography refinements beyond the implemented system font,
  wordmark, pixel character, and SVG icons.
- Future refinements to node geometry, map spacing, and responsive composition.
- Additional spacing/motion tokens or reusable components when a real interface
  need emerges; the current color, radius, and focus tokens already exist.

The chosen node treatment is not approval of the entire comparison screen as the homepage, a final brand identity, or production implementation.

## Historical Reference and Current Homepage

The original local comparison used
`.superpowers/brainstorm/81780-1793602108/content/map-node-comparison.html`.
That directory is ignored by Git and is not required in a fresh checkout;
the durable decisions are recorded here.

The homepage has a pixel character, introduction, and links to the labs,
followed by three **How Optiq works** cards and a two-column lab browser.
The shared wordmark replaces its initial “o” with the mascot's pixel-art body,
top stem, and blue glass, exported from `frontend/src/assets/learning/logo.piskel`.
The browser-tab favicon uses the same artwork on a transparent 32 × 32 canvas,
with the shared emerald color treatment applied by its SVG filter.
Homepage sections use generous vertical whitespace
instead of horizontal divider rules; laboratory dividers remain separate.
Each “How Optiq works” card contains a short heading, one supporting sentence
and a lightweight SVG diagram. All three diagrams share one emerald geometric
scene and the same 320 × 220 view box, centered within equal visual stages.
The first shows a notebook print with mint tape and a pixel cursor; the second
reveals aligned illustrative edge outlines over the same scene. The third selects a point inside
the scene’s solid emerald square and connects it to a magnified 3 × 3 grid.
Its uniform pixels use `accent` (#087f46), so the label “G: 127” matches the
actual green-channel component. Accessible descriptions distinguish these
diagrams from live computation. No mascots, handwritten annotations or code
snippets appear in these cards. Cards use three columns on desktop, pair copy
and visuals on tablets, and stack on phones. The original PNG/Piskel artwork
remains retained source material. The illustrations use slow eight-second loops
with a brief active phase and a resting interval. They animate only in view,
provide pause/resume, and show their static final state for reduced motion. The cursor remains visible while moving back to its start; the magnifier scales in and out from the selected point. These card animations do not fade.

The lab browser has a vertical winding seven-lab map on the
left and selected-lab information on the right. The information panel stays
visible while scrolling on wider screens and displays curated concept illustrations. On smaller screens, the preview opens immediately below the selected node,
pushing later nodes down and adjusting the connecting path. Selection preserves
the node’s viewport position. An outlined “Next preview” button advances the
selection, wrapping from Lab 7 to Lab 1 without opening a lab.

The groups are Foundations, Features & recognition, and Detection & segmentation.
Their handwritten Gaegu headings use opaque `ink-soft` for readable contrast;
static rotations and curved dashed separators retain the informal map treatment.
Highlighted path segments use `accent-path`; the selected lab label uses stronger
weight and an underline.

All seven lab detail previews use borderless 4:3 mascot illustrations above the
title. Titles use “Lab N: Title”; descriptions and Open lab/Next preview actions
remain below. Labs 1–4/7 use curated transparent variants of the existing mascot poses: grayscale,
edge outlines, contrast, keypoint matching and colored regions. Labs 5–6 retain
their dedicated concept illustrations. These are illustrative
artwork, not computed outputs or new lab inputs. No mockup labels, image
captions or comparison controls appear above the title. Hidden measurement copy
keeps headings and descriptions stable during selection. Reduced-motion mode
omits the preview fade. Product scope remains governed by [PRD.md](PRD.md).


Homepage wheel scrolling uses Lenis with a gentle interpolation factor of .095.
Touch and keyboard scrolling retain native behavior; Lenis is destroyed when a lab
opens or reduced motion is enabled. Anchor navigation synchronizes native focus
scrolling before calculating its destination. Content remains sharp and immediately
visible; decorative scroll parallax, blur, and entrance animations are omitted.
Normal hover, focus, and preview transitions remain.
