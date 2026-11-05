# Lab 5 demonstration preview

Goal: let the developer assess one hosted-style demonstration while retaining
all live local experiments. Work on feat/lab5-demo; main remains the full version.

Use the existing Lab 5 layout, galleries, charts, report and learning canvas.
Create /labs/5/demo as a standalone preview. Keep /labs/5 live. The demo never
contacts FastAPI: select 25, 75 or 150 components to immediately inspect a real
recorded run. Load baseline automatically. Show one compact disclosure and
accurate loading/errors, use saved-run wording in controls/details/help/downloads.
No simulated processing delays, fabricated metrics or changes to other labs.

- [x] Add an explicit export script running the actual existing PCA/SVM service
  with the original dataset/split/seed. Export validated public JSON plus a
  hash-bound manifest with counts, recording time and schema version.
- [x] Generate all three runs locally; validate counts, metrics, variance and
  provenance against results. Keep static assets small and reproducible.
- [x] Extract shared Lab5View without changing live flow. Add demo API/hook and
  a selectable saved-run control with immediate result updates and safe races.
- [x] Preserve sections, downloads and learning visuals; adjust only misleading
  live-execution wording in demo mode. Distinguish recorded timings/provenance.
- [x] Verify backend/export regressions, frontend lint/build, desktop/mobile
  browser interactions, static-only operation and missing-asset failure states.
- [x] Independent review and concise assessment link. Do not commit or apply
  the approach to other labs until requested.

Verification: all 110 backend tests pass, including validation of all three real
saved runs. Frontend lint/build pass. Desktop (1440px) and mobile (390px) checks
exercise every view, component selection, baseline reset, details and provenance,
measurement downloads, missing-file recovery and corrupt-file rejection. Backend
API endpoints were blocked: zero API requests were made. Both viewport checks
had zero axe violations or horizontal overflow. The live page retains its Run
experiment controls. Mechanical design detector returned no findings. Independent
review found no actionable issues. Visual check preserves the existing layout.

Preview: http://127.0.0.1:5173/labs/5/demo. No other labs or hosted backend profiles
were changed, no deployment was performed, and demo changes remain uncommitted.


## Approved follow-up: make the demonstration canonical

User requested Lab 5 become demo-only here and the full local source be retained
on GitHub. Created and pushed `full-local` at `729d587` before changing the page.
`/labs/5` now shows the demo; `/labs/5/demo` redirects. Removed obsolete live/demo
switching and live UI branches. Full source recovery and the ignored runtime-cache
boundary are documented in LAB5_SETUP.md. Backend fitting remains available for
trusted export; other labs are unchanged. Earlier preview-only notes above record
the first iteration and are superseded by this approved follow-up.


Follow-up verification: 110 backend tests, frontend lint/build, both desktop/mobile
static-only browser flows and preview-URL redirect pass. Both widths recorded zero
API requests and zero axe violations; missing/corrupt-file recovery still passes.
GitHub confirmed creation of `full-local` pointing at `729d587`. Demo work remains
uncommitted on `feat/lab5-demo`; main was not changed or force-pushed.
