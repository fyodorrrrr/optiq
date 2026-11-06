# Mascot Default Samples Implementation Plan

**Goal:** Use the emerald mascot by default in Labs 1–4 and classical Lab 7, keeping every existing dropdown sample and real matching homepage outputs.

**Architecture:** Prepare committed RGB 480×360 samples from the existing learning-card illustrations (user steering: use different mascot scenes rather than the hero), with the approved saturation/brightness treatment, 2× nearest-neighbor enlargement and neutral paper background. A single preview-wrapper border stays outside the algorithm input, correcting the initially baked-in border and cream background after user review. A shared backend loader validates samples. Lab-specific services adapt them (grayscale edges, labeled low contrast, transformed feature pair). Typed frontend defaults use the new samples. Offline homepage export regenerates only selected labs with provenance; heavy-lab recordings remain intact.

- [x] Add regression tests for deterministic mascot routes, actual output behavior, retained alternatives and constrained-profile bounds; run them red.
- [x] Implement reproducible sample preparation, shared loading and per-lab sample routes/services. Preserve existing explicit sample IDs and processing algorithms.
- [x] Add the new dropdown entries and update initial requests/source labels. Lab 7 mascot selection uses inverted foreground and a centered seed; alternative samples retain usable settings.
- [x] Export only Labs 1–4/7 homepage figures from real services, update captions/provenance/docs, and keep Labs 5–6/semantic unchanged.
- [x] Run backend suite, frontend lint/build, detector and one batched desktop/mobile browser check covering defaults, alternative selection, live runs and backend failure.

**Acceptance:** A 480×360 input fits both profiles; no runtime asset download or frontend-asset dependency; shape samples remain reachable; outputs are real; the source/artifact hashes and low-contrast/geometric transformations are explicit. No changes to submitted reports or their historical results.

Verification: 123 backend tests passed (including constrained-profile imports and all mascot routes), frontend lint/build passed, detector returned no findings. Desktop/mobile browser checks covered new defaults, real processing, old dropdown samples, source-aware reset/foreground behavior, homepage previews and backend failure. No overflow or browser errors were observed. Source/output hashes verified; Lab 5/6 preview bytes and provenance remain unchanged. Existing running development servers were reused.

Follow-up correction: replaced cream with neutral paper, removed baked decorative borders, and added one border to homepage preview wrappers. Watershed overlay no longer paints OpenCV’s mandatory outer rim; raw labels and internal boundary visualization remain intact. Regression tests passed red/green; full suite now passes 124 tests. Frontend lint/build and desktop/mobile single-wrapper-border checks passed.
