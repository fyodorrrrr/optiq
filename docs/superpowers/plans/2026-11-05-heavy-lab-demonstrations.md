# Recorded demonstrations for heavy labs

Lab 5 was committed as 190412c. Continue on feat/lab5-demo; GitHub full-local
at729d587 remains the full live application source. Only Lab6 and Lab7 semantic
presentation change. Classical Lab7 methods remain real backend computation.

- [x] Export real 480px-longest-side bottle/bus detections for pretrained/custom
  models at confidence .25/.5/.75; save public training/dataset/test snapshots and
  sanitized training log. Record actual input/checkpoint/service hashes and time.
- [x] Export real DeepLab semantic outputs on bus/bottle at opacity .25/.5/.75,
  preserving class IDs, pixel counts and real masks/overlays. No fake metrics.
- [x] Add bundle regression tests for hashes, dimensions, detections, label IDs,
  class counts and approved model provenance; run actual local export explicitly.
- [x] Reuse a small static JSON reader and saved-run hook; replace Lab6 camera,
  upload and Run controls with saved sample/model/confidence selection. Retain
  dataset/training sections and downloads as recorded artifacts without API calls.
- [x] Make Lab7 semantic a separate recorded view within the existing workspace,
  switching back to the live classical views without mixing inputs/results or
  issuing semantic inference. Prevent the old semantic API from being called.
- [x] Verify all backend tests, lint/build, browser desktop/mobile, static-only
  detection/semantic, live classical processing, error/race recovery and download
  provenance. Review, update documentation and report exact deployment boundary.

This does not claim Render resource suitability or slim the entire backend yet.
No live cloud deployment, new training, fabricated computation or changes to
learning-canvas illustrations. Additional changes remain uncommitted for review.


Verification: 112 backend tests pass, frontend lint/build pass, and the mechanical
design scan has no findings. Real exports preserve original image credits and
contain no private absolute paths in public snapshots/logs. Both 1440px and390px
browser checks have zero axe violations/overflow. Lab6 recorded views issue zero
API requests; semantic selection issues zero API/inference requests. Three live
classical methods completed real backend runs. All12 detection and6 semantic
preset combinations were exercised with visible-input/download input-hash
agreement. A delayed-request race could not overwrite the newer selection.
Missing-asset recovery and invalid/blank classical inputs are handled safely.
Independent review and follow-up found no actionable defects.

User input preference: fixed sample images and preset supported values for the
demos; controls stay disabled until their index loads. Live classical settings
remain editable with native/browser/backend validation. Full-local stays at
729d587. Additional demo changes remain uncommitted for review.
