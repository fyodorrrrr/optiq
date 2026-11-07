---
name: "Optiq"
description: "A curious, approachable computer vision experimentation tool."
colors:
  paper: "#f7f7f5"
  paper-deep: "#ffffff"
  ink: "#171717"
  ink-soft: "#656565"
  line: "#e5e5e2"
  line-strong: "#d4d4d0"
  surface-muted: "#e4e4e0"
  accent: "#087f46"
  accent-deep: "#075a34"
  accent-soft: "#e1f5e8"
  accent-path: "#70bd8d"
  selection: "#bceace"
  control-border: "#8b948a"
  error-border: "#b75d4c"
  error-surface: "#fff5f1"
  error-ink: "#823a2b"
  focus: "#90541a"
typography:
  display:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(48px, 6.8vw, 80px)"
    fontWeight: 650
    lineHeight: 1.04
    letterSpacing: "-0.035em"
  lab-title:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(28px, 3vw, 38px)"
    fontWeight: 650
    lineHeight: 1.2
    letterSpacing: "-0.03em"
  card-title:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(21px, 2vw, 25px)"
    fontWeight: 650
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  body:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.7
  label:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.5
  map-annotation:
    fontFamily: "Gaegu, cursive"
    fontSize: "clamp(19px, 1.6vw, 22px)"
    fontWeight: 700
    lineHeight: 1.2
rounded:
  sm: "4px"
  control: "8px"
  panel: "12px"
  pill: "999px"
spacing:
  compact: "8px"
  control: "12px"
  copy-gap: "20px"
  panel: "24px"
  card: "28px"
  page: "32px"
  lab-gutter: "40px"
  section: "64px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.paper-deep}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "12px 18px"
  button-primary-hover:
    backgroundColor: "{colors.accent-deep}"
  button-secondary:
    backgroundColor: "{colors.paper-deep}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "11px 14px"
  button-preview-next:
    backgroundColor: "transparent"
    textColor: "{colors.accent-deep}"
    rounded: "{rounded.control}"
    padding: "12px 16px"
    height: "44px"
  field:
    backgroundColor: "{colors.paper-deep}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "10px"
  notebook-card:
    backgroundColor: "{colors.paper-deep}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "28px 28px 0"
  preview-panel:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "24px"
  details-drawer:
    backgroundColor: "{colors.paper-deep}"
    textColor: "{colors.ink}"
    padding: "0 28px 28px"
    width: "min(560px, 100%)"
---

# Design System: Optiq

## Overview

**Creative North Star: "The Curious Lab Notebook"**

Optiq is a computer vision experimentation tool with a curious, friendly and playful personality grounded in real techniques and results. Neutral paper, emerald actions and image-led layouts make exploration approachable without making laboratory workspaces childish. The voice is a knowledgeable classmate: direct, encouraging and precise.

This guide records the current working tree, including the approved notebook-card refinement. It is a scan of implemented choices, not a redesign or a claim that every state has passed an accessibility audit. The North Star names the already-selected notebook direction. Product requirements remain in [docs/PRD.md](docs/PRD.md); implementation boundaries remain in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

**Key Characteristics:**
- Emerald-led, light-only interface with neutral paper and white surfaces.
- Pixel mascot identity in the hero, wordmark and curated lab-map artwork, with four chunky filled pixel shapes framing only the hero, in pale gray with two muted mint accents (two shapes on mobile). The colored mascot stays close to the headline.
- Native notebook diagrams explain experimentation without repeating the mascot.
- Quiet technical workspaces with optional explanations and truthful result states.

## Colors

### Primary

- **Emerald** (`accent`): primary actions and selected states.
- **Deep emerald** (`accent-deep`): hover fills and selected text.
- **Pale mint** (`accent-soft`): gentle selection and diagram surfaces.
- **Path green** (`accent-path`): short active trail segments, not body text.
- **Selection mint** (`selection`): browser text selection.

### Neutral

- **Paper** (`paper`): application canvas and quiet image surfaces.
- **White surface** (`paper-deep`): cards, workspace panels and drawers.
- **Charcoal** (`ink`) and **supporting gray** (`ink-soft`): primary and secondary text.
- **Soft line** (`line`), **strong line** (`line-strong`) and **muted surface** (`surface-muted`): separation and secondary backgrounds.
- **Control border** (`control-border`): visible form/secondary-button outlines.

Focus uses the dedicated warm-brown `focus` role. Error border, surface and text use the three `error-*` roles; they are functional feedback, not additional brand accents. The notebook diagram also uses local mint and medium-green fills from LearningCards.css; they are illustration colors, not global interaction tokens.

**The Scientific Color Rule.** Emerald identifies Optiq controls and illustrative artwork. Real image colors, edge maps, labels and scientific overlays retain their algorithm-specific meaning.

The hero mascot and wordmark receive the shared saturation/brightness filter; generated lab illustrations already contain their intended emerald treatment and must not receive it again. There is no implemented dark theme.

## Typography

Use the system sans stack for headings, controls and body copy. Gaegu is bundled locally and reserved for the map’s handwritten group names; it does not replace technical labels. Code uses the platform monospace family in the existing Python/details views.

The frontmatter records desktop roles. The homepage hero uses a larger responsive display role, lab titles are restrained, and notebook-card titles sit between section headings and body copy. Supporting descriptions generally use 14–16px type and generous 1.65–1.7 line height. Lab explanations commonly cap line length at 65–70ch. Exact roles remain in source CSS; these observations are not a mandate to normalize every existing size.

**The Plain Labels Rule.** Use familiar sentence-case wording. Keep exact algorithm names, but place brief contextual explanations near meaningful settings. Do not add playful fonts to numbers, validation or code.

## Layout

- Homepage: centered 1176px container with 32px desktop side padding; the hero, notebook cards and lab browser share this alignment.
- Labs: every lab uses the same centered 1360px container and header; padding is 40px at desktop, 24px below 1360px, and 16px on phones. No lab widens its outer margins independently.
- Desktop workspace: 180px experiment navigation, 250px settings, then flexible results. Views without settings use the full results area. Below 1360px, experiments wrap above settings and results; mobile experiment buttons use two columns.
- Notebook cards: three columns with a 20px gap; at 900px and below, cards stack and pair copy with a 180px visual column; at 480px and below, copy and diagrams stack. Each diagram shares a 320 × 220 view box inside an equal-height stage.
- Lab map: winding navigation beside sticky detail artwork on larger screens; at 760px and below, the selected preview opens immediately beneath its node. Keep the selected node anchored during layout changes.

Spacing values are observed component values, not a strict universal grid. Existing breakpoints are component-specific; do not replace them with arbitrary framework defaults.

## Elevation & Depth

The interface is flat by default. Paper/white tonal separation, whitespace and fine borders establish hierarchy; cards and lab panels do not use decorative shadows. Map nodes are the intentional exception: clipped top faces sit over a shallow solid base, with small hover/focus movement. Pixel/crop selection markers use a tiny contrast halo so the outline remains visible over real images; this is functional, not ambient elevation. Drawers use a fine edge and a translucent backdrop.

Motion stays purposeful: the hero pixel shapes follow desktop pointer movement at two shallow depths (8px and 16px), easing back to rest on pointer leave; updates stop when settled, offscreen or hidden, and touch/reduced-motion settings keep shapes static, selected map paths use short opacity transitions, and detail content fades briefly. Lenis smooths homepage wheel scrolling only; touch and keyboard behavior stay native. Reduced motion disables the appropriate movement/fades and smooth scrolling. The notebook cards use a four-second first-card loop and the original eight-second second/third-card loops, with a slight stagger: a continuously visible cursor that returns to its starting position, a brief cursor press with synchronized print sway, edge reveal and a magnifier that expands from and contracts toward the selected pixel. The card loops do not animate opacity. Each card starts when visible and pauses off-screen; an icon-only pause/resume control with an accessible name and tooltip is provided. Reduced motion shows static final diagrams.

## Shapes

Use compact corners for image/diagram elements (`sm`), comfortably rounded controls (`control`), and soft panel/card corners (`panel`). Pill radius exists for existing rounded tags, not every component. Input and secondary-button boundaries use the control-border role; subtle content dividers use line roles. Keep the map’s shallow hexagonal nodes as a specific navigation signature rather than applying that geometry everywhere.

## Components

### Actions and fields

Primary buttons are emerald with white text and deepen on hover. Secondary lab buttons are white with charcoal text and a control border. Next preview uses a transparent surface, deep emerald text and the same control-radius language. Visible focus uses a 3px focus-colored outline; offsets vary by component. Preserve disabled, busy, cancel and retry states. Inputs use white surfaces, 16px text, 10px padding and explicit labels/bounds. Keep upload and sample selection available where the lab supports them.

### How Optiq works cards

Use three white notebook-style cards titled Pick an image, See what changes and Look a little closer: image input, original/edge comparison and pixel inspection. All reuse the same emerald geometric scene. The third selects a point within the solid emerald square, connects it to a uniform magnified pixel grid and labels the green channel G: 127, consistent with the accent color. Diagrams are illustrative, not live processing. No repeated mascots, handwritten annotations or code visual belong here.

### Lab map and detail panel

All seven nodes remain directly accessible. Selected text uses stronger weight and an underline; keyboard and pointer engagement highlight adjacent trail segments. Group headings use opaque supporting gray, with Gaegu and restrained static rotation.

Detail panels have no outer border. A borderless 4:3 concept illustration appears above a title formatted “Lab N: Title”, followed by the actual description and Open lab/Next preview actions. Keep the conceptual nature of the artwork clear, and do not use it as a lab input or imply an inference result. Next preview wraps from Lab 7 to Lab 1. Hidden measurement content stabilizes the title/description footprint.

### Lab workspace, results and explanations

Headings contain title/description only, with source actions below; the decorative heading mascot was removed by user choice. Retain specialized outputs rather than forcing every experiment into identical image panels. Pixel inspection shows measured coordinates, a swatch, channel values and the magnified neighborhood. Pixel editing retains before/after comparison; transformations retain image viewers. Preserve previous-result notices when settings change.

Learning Canvas diagrams, How it works and Image/Run details remain part of the lab. Drawers are right-aligned, at most 560px wide, with a sticky header and full-height scrolling. Keep result downloads and provenance accessible without making them the primary visual content.

## Do's and Don'ts

### Do
- Use the existing emerald, paper, text, focus and error roles consistently.
- Keep input, settings, results and explanations visually distinct.
- Describe diagrams and concept art as illustrative; identify recorded runs.
- Keep original samples and actual algorithm outputs faithful to their computation.
- Preserve keyboard focus, labeled controls, reduced-motion behavior and responsive layouts.

### Don't
- Do not add decorative mascots to laboratory headings.
- Do not restore comparison sliders, image captions or mockup banners on lab-map detail cards.
- Do not add handwritten captions or code blocks to the How Optiq works cards.
- Do not present the map as locked progression, scored practice or saved completion.
- Do not recolor scientific outputs to force the emerald brand palette.
- Do not invent tokens, controls or functionality merely because a preview snippet exists.
