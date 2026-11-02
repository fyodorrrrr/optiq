# Optiq Design Foundation

## Status and Scope

This is the initial design foundation, not a finalized design system. It records the developer-supplied neutral palette and radius conventions and the selected learning-map treatment. Expand it as real mockups and implementation establish additional requirements.

## Neutral Colors and Corner Radii

```css
:root {
  --paper: #f7f7f5;
  --paper-deep: #ffffff;
  --ink: #171717;
  --ink-soft: #656565;
  --line: #e5e5e2;
  --line-strong: #d4d4d0;
  --surface-muted: #e4e4e0;

  --radius-sm: 4px;
  --radius-control: 8px;
  --radius-panel: 12px;
  --radius-pill: 999px;
}
```

Use `paper` for the application background and `paper-deep` for panels and image surfaces. Use `ink` for primary text, `ink-soft` for supporting text, and the line tokens for dividers and boundaries. Reserve `surface-muted` for secondary backgrounds and subtle neutral highlights.

Use 8px corners for standard controls, 12px for panels, and 4px for compact elements. Reserve pill corners for badges and tags that benefit from them. Specialized node geometry is a deliberate map treatment rather than a general component-radius convention.

Keep these neutrals consistent unless testing justifies a change. Introduce dedicated interactive-border, focus, disabled, or semantic tokens when needed for accessibility; subtle neutral dividers alone may not provide sufficient control contrast.

## Surface Principles

- Prefer flat surfaces, whitespace, alignment, and subtle borders over nested cards or heavy shadows.
- Keep experimental images and visualizations visually prominent.
- Maintain consistent treatments across labs while allowing specialized layouts.
- Use elevation for meaningful relationships such as overlays and popovers.
- Add tokens and components in response to actual requirements rather than anticipating every possible use.

## Learning Map — Selected Direction

**Chosen:** shallow dimensional nodes, following the side-by-side browser comparison. The flat-node alternative was not selected.

Give each node a top face and a shallow solid darker base. The depth should make it feel selectable without glow, elaborate textures, or heavy shadows. Hover and press feedback may reinforce this treatment; preserve visible keyboard focus and respect reduced-motion preferences.

Keep navigation, text, and laboratory workspaces flat. The node treatment is a focused exception to the surface principles, not a reason to make every control dimensional.

The homepage direction is a short introduction followed by a winding map of seven labeled labs. Use the map to suggest order without enforcing prerequisites: all implemented labs are directly accessible.

Availability and learning progress are separate concepts. Lab 1 currently has a browser prototype and should be labeled **Preview**; Labs 2–7 are **Planned**. Do not use completion checkmarks or unlocked states as decoration. Completion criteria and progress tracking are undecided.

## Intentionally Open

- Primary accent and supporting colors. Green in the comparison is provisional.
- Typography, type scale, logo, and iconography.
- Final node shape, geometry, path spacing, and mobile composition.
- Spacing tokens, reusable component details, and semantic colors.
- Motion timing and accessible interaction-state tokens.

The chosen node treatment is not approval of the entire comparison screen as the homepage, a final brand identity, or production implementation.

## Reference and Next Step

The local browser comparison is stored in `.superpowers/brainstorm/81780-1793602108/content/map-node-comparison.html`. This directory is ignored by Git; the durable decisions are recorded here.

Explore the introduction and seven-lab map together in the next homepage mockup. Validate readability, navigation, responsive behavior, and contrast before implementing the homepage. Product scope remains governed by [PRD.md](PRD.md).
