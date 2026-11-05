# Activity Completion Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete technically actionable assignment gaps without inventing personal photos, human approvals, or an unavailable assigned input.

**Architecture:** Preserve the 100-epoch checkpoint and original train/validation artifacts. Prepare a separate attributed bottle test pack with source IDs, author separation, decoded-content/perceptual duplicate checks, and draft annotation review. A local evaluation CLI verifies split/checkpoint provenance and records test metrics separately; the existing Lab 6 status and training panel expose verified test results beside validation. No web training endpoint or changed model selection.

**Stack:** Existing Python/OpenCV/Pillow/Ultralytics and React/TypeScript; no new dependency.

- [x] Prepare a deterministic candidate pack excluding every previously inspected source ID and original photographers; inspect annotations before inference, retain corrections and review HTML.
- [x] Add regression tests for test/train overlap, altered weights, and preserving training artifacts; implement evaluation-only CLI and verified public status.
- [x] Evaluate frozen checkpoint on the held-out test set, retain outputs and logs, verify real custom inference on a new image.
- [x] Display separate validation/test metrics with split counts and review state using existing UI patterns; validate API privacy and frontend checks.
- [x] Audit conditional Lab 7 IoU and absent Lab 2 input. Update completion docs with evidence and any externally blocked tasks; do not imply original photos or physical webcam testing were performed.

Verification: backend regression suite, frontend lint/build, checksum comparisons before/after evaluation, actual CPU evaluation, and browser/API checks of test/validation distinction. No retraining or approval fabrication. No commit unless requested.


## Completion evidence and rulings

- Frozen weights evaluated on 18 new photos / 27 boxes; original train/val bytes and checkpoint unchanged. Metrics are provisional while user annotation review is pending.
- Ruling: use a local held-out subset from the existing public source pool, excluding all prior candidate IDs and baseline photographers; do not label it an official benchmark test split or claim pretraining independence.
- Ruling: personally captured photos, physical-webcam evidence, and the missing Lab 2 assigned image cannot be fabricated. Keep those external requirements explicit. Lab 7 IoU remains conditional, not unconditionally outstanding.
- Review found stale Ultralytics label-cache reuse and unverified approval flags. Both fixed with regression tests; evaluator also rejects dataset changes during a run.
- 72 backend tests passed. Frontend lint/build passed. Actual CPU evaluation and real custom inference completed. Desktop/mobile UI checks passed, including missing-test-artifact fallback and zero axe findings in the tested views.
- No commit requested. User's unrelated homepage smooth-scroll edit remains untouched.

- Follow-up: user reviewed the held-out pack and said it looks good. Recorded approval of all 18 with exact hashes and the user statement; fresh `bottle-heldout-approved-v1` evaluation returned identical metrics and verified `user_approved` status.
