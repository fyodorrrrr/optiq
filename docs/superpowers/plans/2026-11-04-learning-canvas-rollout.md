# Learning Canvas rollout

**Goal:** Apply the established Lab 1 Learning Canvas to Labs 2–7.

**Architecture:** Reuse LearningCanvas and DetailsDrawer through the existing LabGuide adapter. Lab-specific learning content and diagrams follow the selected section. Keep all existing experiment controls, computed results, Python examples, settings help, and reproducibility notes.

- [x] Add shared SVG diagram primitives and lab-specific annotated examples for every selectable learning section.
- [x] Replace the collapsible LabGuide with a LearningCanvas adapter; update navigation refs and settings-help actions to reach the canvas/drawer.
- [x] Keep diagrams explicitly illustrative and independent of experiment output. Reuse existing CSS and drawer behavior.
- [x] Update PRD/architecture to describe the rollout.
- [x] Run frontend lint/build, inspect every section and settings help, and check desktop/mobile layout where browser tooling permits.

No backend, dependencies, execution model, or Lab 1 experiment changes. Existing unrelated working-tree edits remain untouched.

## Verification

Frontend ESLint and TypeScript/Vite production build passed. Browser checks exercised all 23 sections at 1440, 390, and 320px, including keyboard drawer opening/closing, focus restoration, settings-help links, header navigation, unchanged workspace height, SVG text bounds, and page overflow. Twelve axe scans covered the initial canvas and open drawer for each lab at desktop and 390px; no violations remained. No uncaught page errors. API requests were explicitly intercepted with HTTP 503 to verify learning availability without backend dependencies; algorithms/models were not rerun. The shared drawer title now distinguishes its region from the canvas region.
