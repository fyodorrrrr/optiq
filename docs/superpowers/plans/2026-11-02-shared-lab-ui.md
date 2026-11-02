# Shared Lab UI Refactor

**Goal:** Make common UI improvements propagate to Labs 1–2 without coupling algorithms or experiment state.

**User direction:** reduce excessive UI separation. Preserve current user edits in Lab 1: dropdown samples, fit-to-panel selection overlays, metadata help, per-tool settings, previous-result labeling, and controls-first mobile flow.

**Approach:** extract real reusable components into `frontend/src/components/lab/`. Both labs directly consume page shell, workspace, tool sidebar, buttons/fields, image panels, sample picker, and learning disclosure. Move common appearance to `LabUI.css`; retain only pixel/operation-specific styles in Lab 1 and edge-specific output styles in Lab 2. Hooks, settings, API calls, algorithms, and content remain lab-owned. No backend behavior change.

- [x] Extract shared primitives from current Lab 1, preserving its behavior.
- [x] Migrate both lab pages and controls to those primitives; use current Lab 1's mobile/sample-picker patterns in Lab 2.
- [x] Verify both workflows, selection overlays, per-tool settings, previous-result labels, sample-picker accessibility, mobile controls, and common component use.
- [x] Update architecture/contributor guidance and run frontend checks plus backend regression tests.

## Verification

- ESLint and production TypeScript/Vite build passed.
- Real browser tests exercised all six Lab 1 operations, both Lab 2 detectors and parameter changes, sample picker dismissal/focus, per-tool settings, previous-result labels, and crop/pixel overlays.
- Both labs passed layout checks at 1440, 768, 390, and 320px with no horizontal overflow, controls-first mobile layout, and identical sidebar styling.
- Desktop/mobile screenshots inspected; design detector reported no findings on shared targets.
- Canonical common UI lives in `frontend/src/components/lab/`; lab-owned hooks, content, and processing remain separate.
