# Repository Guidelines

## Project Context & Priorities

Optiq is an interactive computer vision learning and experimentation platform for students and developers. Its first release integrates Labs 1–7 into a single application for exploration, implementation inspection, and assignment review. There is no separate instructor role, dashboard, or evaluation workflow.

Use a guided playground: help students predict, experiment, compare results, and explain their choices. Prioritize functional laboratory modules and short contextual explanations. Accounts, arbitrary code execution, scored practice, and training infrastructure are outside the initial scope unless explicitly requested.

Stack: React, TypeScript, Vite, and Tailwind CSS on the frontend; Python, FastAPI, OpenCV, NumPy, and scikit-learn on the backend. Add other machine learning libraries only when a lab requires them.

Read `docs/PRD.md` and `docs/ARCHITECTURE.md` when they exist. This guide governs contribution and AI collaboration; it does not replace product requirements or architectural documentation.

## Project Structure & Module Organization

Optiq is a computer vision learning platform for Labs 1–7. The homepage and Lab 1 are implemented; Labs 2–7 are planned.

- `frontend/src/`: React and TypeScript source; `App.tsx` defines routes, `components/` holds shared UI, and `labs/lab1/` implements Lab 1.
- `frontend/src/assets/`: imported images and SVGs; `frontend/public/`: static public assets.
- `frontend/vite.config.ts`: React, Tailwind, and development API proxy configuration.
- `backend/main.py`: FastAPI application and `/api/health`; `routers/`, `schemas/`, and `services/` separate lab HTTP handling, validation, and processing. `backend/tests/` contains unittest API tests.
- `backend/requirements.txt`: direct dependencies; `requirements-lock.txt`: recorded package versions.
- `activities/`: original laboratory documents, currently excluded from Git.

As labs are added, organize endpoints under `backend/routers/`, algorithms under `backend/services/`, and lab interfaces under `frontend/src/labs/`.

## Engineering & Architecture

- Prioritize readable, maintainable, testable code and straightforward solutions.
- Inspect existing execution paths and applicable documentation before changing behavior.
- Follow established conventions, reuse suitable components and utilities, and separate responsibilities.
- Avoid unrelated refactoring, speculative abstractions, and dependencies without a clear benefit.
- Explain significant architectural decisions and tradeoffs before implementation.
- Obtain approval before changing the agreed stack, deployment architecture, data persistence strategy, or execution model substantially. Routine implementation choices should proceed without unnecessary confirmation.
- Keep documentation aligned with implemented decisions. Create documentation only when it serves a clear purpose.

## AI Collaboration & Developer Understanding

AI should accelerate implementation while keeping the developer able to explain, modify, debug, and maintain the system. Do not introduce artificial complexity or incomplete implementations for teaching purposes.

### Before Substantial Work

Briefly explain the current execution flow, proposed changes, affected modules, important tradeoffs, and verification approach. Identify where input validation, processing, and state changes will occur. This explanation is not an approval gate for routine work.

### After Substantial Work

Explain what changed, how the completed flow works, and why important decisions were made. Reference actual paths and function names, identify reused patterns, and recommend a logical reading order. Report verification results and limitations accurately.

Cover these topics proportionally; mandatory headings and repetitive summaries are unnecessary. For minor changes, use a short explanation. Avoid syntax tutorials and line-by-line walkthroughs unless requested.

When useful, suggest one small independent modification as an optional exercise. Do not implement it unless requested.

### Debugging

Explain the observed failure, evidence supporting the root cause, why the fix addresses it, and how the fix was verified. Highlight useful debugging techniques when relevant.

## Laboratory Fidelity & Computer Vision

- Preserve each lab's required techniques and outputs. Flag conflicts in source documents rather than silently resolving them or substituting algorithms.
- Distinguish real computation, cached outputs, and illustrative examples. Never present placeholders as completed experiments.
- Keep explanations, code examples, displayed parameters, and actual algorithm behavior consistent.
- Separate preprocessing, algorithm execution, and result formatting from API and UI logic. Reuse shared image-processing utilities.
- Validate image decoding, supported formats, dimensions, and algorithm parameters; handle processing failures clearly.
- Make meaningful parameters configurable. Record relevant preprocessing, settings, model/dataset versions, and random seeds where applicable for reproducibility.
- Keep lightweight experiments distinct from expensive training workflows. Allow specialized lab interfaces while sharing common experiment conventions.

## Frontend & Backend Boundaries

Frontend interfaces should be accessible, responsive, and consistent. Keep API communication and complex processing separate from presentation. Provide understandable controls and meaningful loading, error, empty, and success states.

Backend endpoints should focus on validation, orchestration, and response handling, with clear request and response schemas. Place algorithms in services. Handle errors consistently, validate uploads, and apply appropriate file and processing resource limits. Do not block request handlers with long-running training or execute arbitrary user-provided code.

## Build, Test, and Development Commands

Use Python 3.12 and Node.js 22.12+ or another Vite-supported version.

- Frontend installation: `cd frontend && npm ci`.
- Frontend development: run `npm run dev` from `frontend/`; opens port 5173.
- Frontend validation: `npm run lint` checks ESLint rules; `npm run build` checks TypeScript and builds production assets.
- Backend environment: from `backend/`, run `python3.12 -m venv .venv`, then `source .venv/bin/activate`.
- Backend installation: `python -m pip install -r requirements-lock.txt`.
- Backend development: `fastapi dev main.py --host 127.0.0.1`; serves port 8000 and documentation at `/docs`.

## Coding Style & Naming Conventions

Match existing TypeScript style: two-space indentation, single quotes, and no semicolons. Use PascalCase for React components and camelCase for functions and variables. Follow ESLint's TypeScript, React Hooks, and React Refresh rules.

Use four-space indentation and snake_case names in Python. Keep computer vision logic separate from HTTP handlers.

## Testing Guidelines

Run backend tests from `backend/` with `.venv/bin/python -m unittest discover -s tests -v`. No coverage threshold or permanent frontend test runner is configured. Run lint and build for frontend changes. With both servers running, exercise relevant UI/API flows, including backend-unavailable behavior. Name backend tests `test_*.py`; document any frontend runner when introduced.

Add or update tests for meaningful algorithm behavior, input validation, and regressions. Avoid tests that merely mirror trivial implementation details. Exercise relevant edge cases and failure scenarios; verify expected visual or numerical outputs for computer vision changes when practical. Run applicable checks, report checks that could not run, and never claim verification that was not performed.

## Commit & Pull Request Guidelines

History uses short, imperative messages, such as `Set up React frontend and connect FastAPI backend`; follow that pattern. PRs should explain the change, list validation performed, link relevant issues, and include screenshots for visible UI changes.

## Configuration & Dependencies

Never commit secrets, virtual environments, or generated dependencies. Update lockfiles with dependency changes. The `/api` proxy works only in development; production hosting must route requests to FastAPI separately. SURF requires additional OpenCV build configuration.
