# Optiq Product Requirements

## Purpose

Optiq helps students and developers understand computer vision through hands-on experimentation and inspectable implementations. It compiles CSST106 Labs 1–7 into one web application with accessible techniques and real outputs, meeting the assignment's review requirements through the same experience available to everyone.

This document records the agreed product direction. Detailed laboratory obligations and source ambiguities are tracked in [LAB_REQUIREMENTS.md](LAB_REQUIREMENTS.md). The homepage and Python/OpenCV Labs 1–5 are implemented. Labs 6–7 remain planned. Workspaces use shared UI components, left tool sidebars on wider screens, and optional learning explanations. Common UI changes propagate across labs; experiment state, specialized controls, processing, and content remain lab-specific.

Initial visual constraints and the selected map-node treatment are recorded in [DESIGN_FOUNDATION.md](DESIGN_FOUNDATION.md). The homepage direction is a short introduction and a winding seven-lab map with shallow dimensional nodes; implemented labs remain freely accessible.

## Users and Outcomes

- **Students:** explain a technique's behavior, investigate parameter changes, compare outputs, and justify a technique or setting for a given image.
- **Developers:** inspect implementations, connect code to outputs, and modify, debug, or extend techniques. The contributor's before-and-after implementation walkthroughs are governed by `AGENTS.md`; they do not require an in-app coding feature.

Students and developers are the product's audiences. There is no separate instructor role, dashboard, or evaluation workflow. All users can directly access clearly labeled labs and results without completing learning prompts.

## Product Approach

Use a guided playground within each laboratory module. Techniques belong inside their relevant lab rather than becoming unrelated applications.

The learning pattern is **predict → experiment → compare → explain**. Provide short contextual explanations and useful starting inputs; students can explore without compulsory lesson completion. Predictions and reflections do not require scoring or answer storage in the initial release.

Dedicated Learn, Code, and Practice sections may follow later. The initial educational value comes from understandable controls, visible consequences, and comparisons using actual computation.

## Release Scope

The complete initial release must include:

1. A single application with discoverable navigation to Labs 1–7 and honest implementation status.
2. Working required techniques, inputs, processes, and outputs for each lab, as mapped in the laboratory requirements.
3. Appropriate sample inputs and user-provided inputs where applicable. Dataset-driven labs may use a specialized workflow rather than a generic image uploader.
4. Clear controls, input/output labels, parameter explanations, and comparisons appropriate to each technique.
5. Useful loading, validation, processing-error, empty, and success states.
6. Organized source code and reproducible setup instructions for GitHub review.

Printed/handwritten reports and PDF submission workflows are excluded. Accounts, cloud experiment storage, arbitrary code execution, scored exercises, an annotation editor, and general-purpose training infrastructure are not initial product requirements.

Excluding training infrastructure does **not** remove the source's custom-model training obligation. Its execution and presentation must be agreed before Lab 6 is considered complete.

## Delivery Strategy

Build and verify one laboratory end to end before starting the next, beginning with Lab 1. A working Lab 1 is the first increment, not completion of the seven-lab release.

Lab 1 includes image loading/display, dimensions and channels, BGR/grayscale explanations, pixel inspection/editing, grayscale conversion, cropping, resizing, and 90-degree rotation. Define its interaction design and frontend/backend flow before implementation.

Reuse components and utilities when actual needs emerge. Do not force PCA, detection, and segmentation into a universal interface designed around basic image manipulation.

## Quality and Integrity

- Keep explanations, exposed settings, and algorithm behavior consistent.
- Distinguish newly computed, cached, and illustrative results; never represent placeholders as completed experiments.
- Validate inputs and bound resource usage. Keep computer vision logic separate from presentation and API routing.
- Support keyboard operation, accessible labels/status messages, and usable layouts on desktop and smaller screens.
- Record parameters and relevant preprocessing, model/dataset versions, and randomness where applicable.
- Avoid silently substituting required algorithms or resolving conflicting source instructions.

## Technical Constraints

Use React, TypeScript, Vite, and Tailwind CSS for the frontend; Python/FastAPI for APIs; OpenCV, NumPy, and scikit-learn for relevant processing. Add model libraries when required by the corresponding lab.

The current development proxy connects frontend `/api` requests to FastAPI. Production hosting, persistence, compute limits, and expensive-job execution are not yet decided; document material decisions as the architecture develops.

## Acceptance and Success

For each delivered lab, demonstrate every applicable source requirement, verify representative visual/numerical outputs, and test relevant invalid inputs and failures. Run applicable lint, type/build, and behavioral checks; document remaining gaps honestly.

Product acceptance means students can perform and explain the intended comparisons, developers can connect implementations to outputs, and required functionality is directly reviewable through the shared application. Learning effectiveness is an outcome to evaluate with students, not a claim established by passing software tests. No numerical learning, speed, accuracy, or coverage target has been agreed.

## Open Decisions

- Lab 1 interaction structure, sample assets, operation composition, and resource limits.
- Source numbering conflicts and intended YOLO version.
- SURF deployment builds and resource verification; local execution is verified (see `SURF_SETUP.md`).
- Dataset/model sourcing and reproducible training delivery for later labs.
- Remaining visual decisions (including accent, typography, and final map layout) and production hosting.

Resolve decisions when they affect the next increment; the full register remains in `LAB_REQUIREMENTS.md`.
