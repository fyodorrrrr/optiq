# Production CI and Main Branch Implementation Plan

**Goal:** Make the hosted version the production main branch, with verified CI.

**Architecture:** GitHub Actions checks pull requests and main pushes. Vercel
handles frontend deployments; Render's existing Git integration deploys after CI
passes. No deployment tokens are committed or supplied to workflows.

**Tech Stack:** GitHub Actions, Node 22, Python 3.12, existing Vercel/Render services.

**Spec:** User approved merging the hosted branch, retaining full-local, adding
frontend lint/build and backend tests, and switching both hosts to main.

- [x] Verify and commit approved mascot loading feedback separately.
- [ ] Add least-privilege CI with immutable action references and cached SURF wheel.
- [ ] Update Render Blueprint and deployment documentation to main/checksPass.
- [ ] Run local checks, create and push the PR, inspect actual Linux CI results.
- [ ] Merge only after checks pass; synchronize local main without overwriting full-local.
- [ ] Report hosting dashboard changes that require owner access.

Ruling: Continue on the existing feature branch containing the authorized work;
no second worktree is needed for this integration-only rollout.
Ruling: Optional YOLO/semantic real-weight tests can skip on CI, just as the suite
specifies. Do not download checkpoints, datasets or train models on CI. Render
profile tests still prove no heavy dependency imports and exercise real SURF.
Ruling: Existing hosting services cannot be mutated without account connections.
The Blueprint records intended settings; dashboard edits remain explicit owner work.
