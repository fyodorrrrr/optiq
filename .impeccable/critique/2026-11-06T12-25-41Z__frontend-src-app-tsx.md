---
target: "Project brand consistency: homepage and laboratory experience"
total_score: 29
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
target_identity: "file:/Users/joseaquino/Desktop/PROJECTS/optiq/frontend/src/App.tsx"
target_fingerprint: "sha256:6a48a51e1e8e71dd2009f1f0ed919434372a43609a5744ad2cd28f565674da5e"
target_path: /Users/joseaquino/Desktop/PROJECTS/optiq/frontend/src/App.tsx
timestamp: 2026-11-06T12-25-41Z
slug: frontend-src-app-tsx
---
# Optiq brand consistency critique

Target: frontend/src/App.tsx and the shared lab experience. Independent design and implementation/browser assessments. Brand: curious, friendly, playful, calm, practical and technically grounded.

## Verdict

Optiq has a recognizable identity. The homepage expresses the brand more strongly than the lab experience. The main opportunity is behavioral: make the app guide prediction and interpretation as warmly as it introduces experimentation. This is a refinement, not a redesign.

CLI detector returned zero findings across App.tsx, components and labs. Browser overlay reported two Lab 6 findings, including a visible long-line warning; exact rule/location data for both was unavailable, so this does not establish two independently verified defects.

## Heuristics

| Heuristic | Score /4 | Evidence |
|---|---:|---|
| Status visibility | 3 | Loading, saved-run and previous-result messages. |
| Real-world language | 3 | Friendly headings; specialist settings need contextual explanation. |
| Control/freedom | 3 | Direct navigation and reset/cancel patterns. |
| Consistency | 3 | Shared shell and palette; personality less evident within labs. |
| Error prevention | 3 | Bounds, validation and busy-state controls. |
| Recognition over recall | 3 | Labeled tools; some terminology needs translation. |
| Flexibility/efficiency | 2 | Direct access and samples; novice guidance can be more targeted. |
| Minimalism | 3 | Calm visual structure; long galleries/status text need prioritization. |
| Error recovery | 3 | Actionable recovery patterns in source; failures not comprehensively exercised. |
| Help/documentation | 3 | Learning Canvas, settings help and Python explanations. |
| Total | 29/40 | Qualitative design rubric, not accessibility certification. |

## Strengths

Emerald, neutral paper surfaces, pixel mascot and winding map feel authored for Optiq. Task headings such as “Find the patterns behind a face” translate technical topics into inviting goals. Real outputs, explicit recorded-run disclosures and illustrative diagrams give the playful identity credibility. Preserve scientific image colors and professional numerical/code presentation.

## Priority improvements

1. **P2 — Curiosity stops at the controls.** Lab 1 contains prediction prompts in `frontend/src/labs/lab1/content.ts:9` and subsequent experiment records, but `Lab1.tsx` does not render the prediction field. Show one optional question near the action and one observation cue after the result. Example: “Try a red area. Which channel do you expect to be largest?” Avoid mandatory quizzes or extra steps. Command: impeccable clarify.
2. **P2 — Upload emphasis competes with the ready-to-use sample.** `frontend/src/components/lab/SourceActions.tsx:8` presents upload prominently even when a sample has loaded. This can suggest preparation is required. Identify the loaded sample quietly, make the experiment the clear next action, and keep upload/sample switching easy to find. Command: impeccable onboard.
3. **P2 — Specialist settings sound more like a control panel than a helpful classmate.** `frontend/src/labs/lab2/EdgeControls.tsx` exposes Gaussian kernel, Sobel kernel and threshold fields with limited local explanation. Retain the exact algorithm names and add concise effects: “Smoothing size — larger values remove more noise and fine detail.” Explain thresholds without implying correctness guarantees. Command: impeccable clarify.
4. **P2 — Technical evidence sometimes arrives before a useful observation.** `frontend/src/labs/lab5/Lab5.tsx` presents 15 eigenfaces; `frontend/src/labs/lab6/Lab6.tsx` places detailed recorded-timing qualification in result status. Keep required outputs and provenance, but lead with what to compare and use existing details sections for expanded context. Example: “Compare the first and last components. Which looks more structured?” Do not disguise saved runs as live inference. Command: impeccable distill.
5. **P3 — Companion identity fades in lab guidance and empty states.** `frontend/src/components/lab/LabEmptyState.tsx` uses a generic image icon; shared lab shells mostly rely on standard controls. Carry one small signature into learning/empty/result guidance: a restrained existing mascot pose or handwritten annotation, paired with a useful next step. Keep forms, code and data visually quiet. Do not replace actual results or add decorative animation everywhere. Command: impeccable delight.

## Emotional journey, cognitive load and personas

The homepage is a friendly high point. Entering a lab shifts to technical controls; results benefit from a small interpretation cue before onward navigation. Lab 1's six tools and the seven-lab map are not inherently excessive: labels and grouping help. Suggest a first action rather than hide required techniques.

First-time students need an unmistakable sample-based next step and terminology help. Returning developers benefit from optional guidance; compulsory predictions or mascot interruptions would be counterproductive. Keyboard/screen-reader users benefit from semantic controls and accurate alternatives; this review is not a full assistive-technology audit.

## Minor observations and boundaries

Gray unselected map nodes may resemble locked levels; this is a design interpretation, not a measured user failure. A short “Start anywhere” cue can clarify availability without completion badges. Keep approved fixed comparison images free of Original/Result labels and captions. Current emerald styling and the separation of illustrative artwork from real results should remain. No P0/P1 brand defect was identified.

## Questions to consider

Which direction should come first: guidance/copy, subtle visual character, or both? Should the scope be the top three improvements or all five?
