# Optiq Design Foundation

## Status and Scope

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
  --accent: #365c49;
  --accent-deep: #254333;
  --accent-soft: #e7eee7;
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

Keep these tokens consistent unless testing justifies a change. Forest green
identifies primary actions and selected tools; pale sage supports softer
highlights. Use the dedicated control-border, focus, and error tokens instead
of relying on subtle neutral dividers for interactive states. The values above
come from `frontend/src/index.css`.

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

Availability and learning progress are separate concepts. Labs 1–5 and 7 are
labeled **Available**. Lab 6 is **Partial · custom training pending**, with
pretrained detection and a local training workflow available. Use **Planned**
only for an unimplemented module. These labels describe functionality, not a
student's completion. There is no saved learning progress or completion gate;
do not use completion checkmarks or unlocked states as decoration.

## Laboratory Learning Content

All labs share the page shell, workspace, controls, viewers, and applicable
input patterns in `frontend/src/components/lab/`. Lab 1 shows a static annotated
Learning Canvas beneath the experiment; short explanations sit beside the
visual on larger screens and below it on small screens. Examples are labeled
illustrative. Its **How it works**, **Image details**, and **Run details** actions
use the shared side drawer. Other labs currently retain `LabGuide` disclosures.
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
followed by three **How learning works** cards and a two-column lab browser.
The shared wordmark replaces its initial “o” with the mascot's pixel-art body,
top stem, and blue glass, exported from `frontend/src/assets/learning/logo.piskel`.
The browser-tab favicon uses the same artwork on a transparent 32 × 32 canvas.
Homepage sections use generous vertical whitespace
instead of horizontal divider rules; laboratory dividers remain separate.
Each learning card contains only a tagline, a short supporting sentence, and
a static pixel-art illustration of the existing magnifying-glass mascot
acting out the tagline. The cards describe starting with an input,
experimenting/comparing, and connecting results to explanations/Python. They
form three columns on larger screens, use compact side-by-side copy and artwork on tablets,
and stack with shorter illustrations on phones; text stays
in HTML and illustrations are decorative. Source assets and generation prompts
live in `frontend/src/assets/learning/`.

The lab browser has a vertical winding seven-lab map on the
left and selected-lab information on the right. The information panel stays
visible while scrolling on wider screens and includes saved sample outputs from
the lab algorithms. On smaller screens, a compact preview with a static thumbnail opens immediately
below the selected node, pushing later nodes down and adjusting the connecting path.
Selection preserves the node’s viewport position. An outlined “Next preview” button
advances the same selection, wrapping from Lab 7 to Lab 1 without opening a lab. Tighter stops are grouped into
Foundations, Features & recognition, and Detection & segmentation. Group names use the locally bundled Gaegu font in the open
lower corner of each group (below the last node on mobile), with varied static rotations and light warm-gray lettering at 85% opacity. Group spacing and handwritten captions are supported by curved dashed separators between groups: 1.3 px strokes at 85% opacity with the original dash spacing; there is no top divider.
Highlighted path segments use muted sage to complement the pale hovered node. The selected
label uses stronger weight and an underline. Preview text reserves the largest
content footprint and previews share a 4:3 stage, keeping panel dimensions
stable as lab content fades in. Labs 4–5 use evenly padded natural-ratio image
cards; Lab 6 fills its slider with identical centered crops on both sides; reduced-motion mode omits the fade. Continue validating readability, navigation, responsive behavior, and
contrast as the application evolves. Product scope remains governed by
[PRD.md](PRD.md).


Homepage wheel scrolling uses Lenis with a gentle interpolation factor of .095.
Touch and keyboard scrolling retain native behavior; Lenis is destroyed when a lab
opens or reduced motion is enabled. Anchor navigation synchronizes native focus
scrolling before calculating its destination. Content remains sharp and immediately
visible; decorative scroll parallax, blur, and entrance animations are omitted.
Normal hover, focus, and preview transitions remain.
