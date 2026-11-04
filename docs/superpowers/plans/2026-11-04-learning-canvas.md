# Lab 1 Learning Canvas Implementation Plan

**Goal:** Add an annotated visual explanation below Lab 1's experiment.

**Architecture:** Shared presentation frame and reading panel; static figures
and captions owned by Lab 1. Existing experiment hooks and APIs remain the
source of experiment state, validation, and computation.

**Spec:** ../specs/2026-11-04-learning-canvas-design.md

1. Add LearningCanvas with accessible nonmodal reading panel and shared CSS.
2. Add six geometric figures and short captions tied to the active tool.
3. Replace Lab 1's learning disclosure, retaining deeper content and notes.
4. Run frontend lint/build and browser smoke checks at desktop and mobile
   widths. Check keyboard open/close/focus, all concepts, real computation,
   and unavailable-backend behavior. Inspect screenshots in one batch.

No new dependencies or permanent frontend test runner. Preserve unrelated
working-tree edits. Check the panel for viewport overflow and ensure examples
remain explicitly distinct from actual experimental outputs.
