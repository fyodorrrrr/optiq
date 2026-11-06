# Emerald Palette Implementation Plan

> Execute inline using the approved emerald comparison as the visual specification.

**Goal:** Apply the user's selected emerald preview to Optiq.

**Architecture:** Remap shared accent tokens and add one shared mascot-art filter. Keep the existing PNG/Piskel artwork intact. Apply the equivalent filter in the browser-tab SVG so the wordmark, hero, learning artwork and favicon agree.

**Scope:** `frontend/src/index.css`, map-highlight styling in `frontend/src/App.css`, favicon reference/artwork, and the existing design/artwork notes. No algorithm, experiment-state, data-color, or layout changes.

- [x] Set primary `#087f46`, deep `#075a34`, soft `#e1f5e8`, map highlight `#70bd8d`, and text selection `#bceace`.
- [x] Apply `saturate(2.15) brightness(1.04)` only to the hero mascot, wordmark artwork and learning-card illustrations, matching the approved preview. Retain pixelated rendering and animation behavior.
- [x] Use an SVG favicon wrapping the existing 32px mascot PNG with the equivalent color treatment; document that editable source artwork remains original.
- [x] Run frontend lint/build and the Impeccable detector. No new test runner or implementation-mirroring test for this reversible visual change.
- [x] Check homepage and a live lab on desktop/mobile in one batch: colors, mascot rendering, hover/focus, selected/loading/error states, no horizontal overflow, working experiment. Compare the accepted preview and confirm primary text contrast.

**Acceptance:** Match the selected emerald preview rather than the alternative `#168052`; retain normal/reduced-motion mascot behavior and preserve experiment image colors. Keep existing unrelated changes untouched.

Verification: frontend lint/build passed; detector returned no findings; browser checks passed for desktop/mobile colors, hover/focus/loading/error states, real edge execution, favicon delivery, mascot normal/reduced-motion behavior and absence of horizontal overflow/browser errors. Applied desktop homepage matches the approved preview pixel-for-pixel. SVG XML validation caught an invalid double-hyphen comment, which was corrected. No application behavior tests or dependencies were added.
