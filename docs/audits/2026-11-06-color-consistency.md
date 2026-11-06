# Optiq color, hierarchy, and consistency audit

## Verdict and scope

**Implementation integrity: pass, with localized drift.** Optiq has a coherent paper/forest-green system, reused lab components, and restrained surfaces that let computer vision outputs lead. Preserve the palette rather than redesigning it.

Reviewed current source and fresh browser captures of the homepage and Labs 1–7 at 1440px and 390px (16 route/viewport combinations), plus Lab 2 result/details, Lab 5 variance, and Lab 6 training states. No horizontal page overflow occurred in those captures. Ran Impeccable's detector on `frontend/src`; it returned `[]`. The contrast and semantic findings below require contextual inspection and were not surfaced by that detector. No UI files were changed.

This is a color-focused audit, not a WCAG certification or performance benchmark. Psychology observations are design interpretations of emphasis, familiarity, and state communication, not measured emotional or learning outcomes. Error, focus, and stale-result styling was also inspected in source; every possible runtime state was not exercised.

## Health score

| Dimension | Score / 4 | Evidence / limitation |
|---|---:|---|
| Accessibility | 2 | Strong base text contrast; faded headings and input boundary contrast need correction. Full keyboard/assistive-technology audit not performed. |
| Performance | 3 | Static review: lazy lab routes, local assets and reduced-motion handling. No performance profiling in this audit. |
| Responsive design | 3 | All eight routes fit desktop and mobile captures; typography/zoom and every interactive state not exhaustively tested. |
| Theming | 3 | Shared palette/radius tokens used extensively; a few literals and semantic-token overlaps remain. Light-only is deliberate, not a missing dark-mode defect. |
| Implementation integrity | 3 | Coherent shared components; primary/selected/stale visual roles drift in specific places. |
| Total | **14/20 — Good** | Indicative scoped review score; prioritize the actual findings over the number. |

Six findings: **P0: 0; P1: 2; P2: 3; P3: 1.**

## Measured palette

Ratios use WCAG relative luminance, current colors, and applicable backgrounds. Heading opacity was composited over the white map surface.

| Pair | Ratio | Assessment |
|---|---:|---|
| Primary text `#171717` / paper `#f7f7f5` | 16.71:1 | Strong |
| Supporting text `#656565` / paper | 5.43:1 | Passes normal-text AA |
| Supporting text / white | 5.83:1 | Passes normal-text AA |
| White / primary green `#365c49` | 7.54:1 | Strong primary CTA |
| Deep green `#254333` / sage `#e7eee7` | 9.22:1 | Strong selected text |
| Error text `#823a2b` / error surface `#fff5f1` | 7.56:1 | Strong |
| Focus `#90541a` / white | 6.05:1 | Distinct and legible |
| Control border `#8b948a` / white | 3.13:1 | Pass on this surface |
| Control border / settings paper | **2.92:1** | Below 3:1 boundary target |
| Warm-gray map heading at 50% opacity / white | **1.78:1** | Below even large-text AA |

## Findings

### 1. [P1] Faded map group headings are difficult to read

- **Location:** `frontend/src/App.css:612–627`; `frontend/src/components/LabMap.tsx:144`.
- **Category:** Accessibility.
- **Evidence:** `#8a847b` at opacity `.50` composites to approximately 1.78:1 on white. Headings are 19–22px and bold; they fail even the 3:1 large-text threshold.
- **Impact:** Foundations, Features & recognition, and Detection & segmentation become faint decoration rather than usable grouping. The actual DOM uses meaningful `h3` labels; this is not simply irrelevant artwork.
- **Recommendation:** Preserve Gaegu and the handwritten treatment, but give its text an explicit readable token without reducing the entire heading's opacity. Keep nearby dashed separators subtle independently.
- **Standard:** WCAG 1.4.3 Contrast (Minimum).
- **Suggested command:** `$impeccable harden`.

### 2. [P1] Input boundaries narrowly miss contrast on the settings surface

- **Location:** `frontend/src/index.css:23`; `frontend/src/components/lab/LabUI.css:56,64`.
- **Category:** Accessibility / theming.
- **Evidence:** Inputs have white interiors, `#8b948a` borders, and surrounding settings background `#f7f7f5`. The boundary contrasts 2.92:1 with that external surface; input fill versus settings paper is also very subtle. The 3.13:1 value against the internal white is not the relevant external-boundary comparison.
- **Impact:** Unfocused editable fields are harder to distinguish from their surroundings, especially at reduced visibility.
- **Recommendation:** Darken the shared control-border token enough to exceed 3:1 on every intended surface, with margin. Do not darken all decorative panel/divider borders; those serve a different role. A low-contrast outline is not automatically a violation for every labeled button, so this finding specifically targets input identification.
- **Standard:** WCAG 1.4.11 Non-text Contrast, adjacent-color guidance.
- **Suggested command:** `$impeccable harden`.

### 3. [P2] Upload and execution actions compete at equal emphasis

- **Location:** `frontend/src/components/lab/ImageUploadButton.tsx:9`; `frontend/src/components/lab/LabUI.css:124`; visible on Lab 4.
- **Category:** Implementation integrity / hierarchy.
- **Evidence:** Upload A, Upload B, and Compare features all use filled primary green while sample inputs are already loaded.
- **Impact:** Three equally prominent controls dilute the next-step cue. Upload is an input-replacement action once an image exists; running the comparison is the experiment's main action.
- **Recommendation:** Prefer outlined upload actions when a source is already loaded and retain one filled run/compare action per experiment area. Upload can be prominent in an empty-source state. Preserve the current accessible labels and action names.
- **Standard:** Design judgment, not a WCAG failure.
- **Suggested command:** `$impeccable polish`.

### 4. [P2] Stale results reuse the selected-state sage treatment

- **Location:** `frontend/src/components/lab/LabUI.css:30,378,399`; `frontend/src/components/lab/RunMetadata.tsx:40`.
- **Category:** Theming / state communication.
- **Evidence:** Sage/deep-green styling represents selected tools, changed metadata and a “Previous result” banner. Stale outputs elsewhere receive neutral text messages.
- **Impact:** A result requiring attention is visually grouped with active/selected or positively emphasized information. The text is accurate, but the visual vocabulary is less clear.
- **Recommendation:** Introduce a shared stale-result treatment using a readable neutral or restrained warm notice surface, a small icon, and explicit “Settings changed — showing previous result” text. Do not rely on a new hue alone, and do not mark stale results as an error.
- **Standard:** Design judgment; retain text/non-color cues per WCAG 1.4.1.
- **Suggested command:** `$impeccable clarify` followed by `$impeccable polish`.

### 5. [P2] Lab 4 has a second selected-control language

- **Location:** `frontend/src/labs/lab4/Lab4.css:11`; `frontend/src/components/lab/LabUI.css:30`; `frontend/src/labs/lab4/Lab4.tsx:97–98`.
- **Category:** Implementation integrity / theming.
- **Evidence:** Selected algorithm buttons inside the results table use black/white, while the sidebar uses sage/deep green for the same algorithm-selection concept.
- **Impact:** Users receive two selected-state conventions within one workspace, increasing interpretation effort and weakening component consistency.
- **Recommendation:** Reuse a shared selected-control token/treatment. It can be compact in the table without needing to reproduce the sidebar layout. Retain `aria-pressed` and a non-color selected cue such as font weight or an indicator.
- **Standard:** Design judgment; black/white contrast itself is good.
- **Suggested command:** `$impeccable polish`.

### 6. [P3] Local color literals and documentation have drifted from the shared system

- **Location:** `frontend/src/App.css:180,188,204,531,617,683`; `frontend/src/labs/lab6/Lab6.css:35`; `docs/DESIGN_FOUNDATION.md`.
- **Category:** Theming / maintainability.
- **Evidence:** Map base/hover/path colors are local literals; a border repeats the control token's literal. The training classification curve aliases the focus color. Design notes describe map caption opacity as 85%, while the current CSS is 50%, and contain older lab-status descriptions.
- **Impact:** Future palette changes can leave the map and charts inconsistent; documentation no longer reliably states the current visual rules.
- **Recommendation:** Tokenize the actual repeated roles—map base/path and chart series—without introducing a large speculative palette. Chart tokens may initially resolve to the same values as brand colors. Update the design notes when implementing a selected direction; this audit does not change them.
- **False-positive boundary:** Grayscale instructional pixel grids, arbitrary illustrative region colors, and actual algorithm-generated segmentation/detection colors are data/teaching encodings. Do not mechanically replace them with brand green or count every such literal as drift.
- **Suggested command:** `$impeccable extract`.

## Color theory and psychological interpretation

- The interface uses mostly low-chroma neutrals plus a controlled forest-green accent. Warm gray, paper, green and restrained terracotta error colors form a coherent visual family.
- The low-chroma shell lets uploaded images, edges, eigenfaces and semantic masks remain visually prominent. This is appropriate for an Operate surface whose outputs are already colorful.
- Dark filled green creates an effective action anchor; pale sage works as a quieter selected surface. The issue is the number of roles given the same treatment, not insufficient saturation.
- The mascot and pixel artwork make the homepage approachable; the neutral laboratory workspace provides a more focused working environment. That difference is coherent across Persuade/Operate modes.
- Brown focus indicators remain visibly distinct from green selection. Reusing brown as a chart series is not inherently confusing because the contexts differ, but separate semantic tokens improve maintenance.
- Unselected gray map nodes can suggest inactivity at first glance, but their readable labels, accessible buttons and hover/selection behavior provide other cues. Treat this as a usability-test question, not proof that students think the labs are locked.
- Do not claim that green scientifically increases learning, trust or calm in this app. No user research establishes those outcomes. Readability, action emphasis and consistent meanings provide stronger grounds for decisions.

## Positive findings

- One shared palette and lab stylesheet govern most interfaces, reducing lab-to-lab drift.
- Normal supporting text remains above 4.5:1; the calm appearance does not generally come from unreadable body text.
- Primary actions, error text and focus indicators have strong contrast.
- Selection uses text weight/underline as well as color in the homepage map; lab controls retain programmatic pressed states.
- The Lab 6 training chart differentiates series using solid/dashed/dotted lines and a text legend, not color alone.
- Actual semantic class maps retain categorical colors and named legends; preserving data colors is appropriate.
- Light mode is explicit (`color-scheme: light`); absence of dark mode is not a defect in this scope.
- Reduced-motion rules preserve key selected/hover feedback without requiring movement.

## Recommended sequence

1. **[P1] `$impeccable harden`:** map-heading contrast and shared input boundary contrast.
2. **[P2] `$impeccable clarify`:** one consistent stale-result message and visual role.
3. **[P3] `$impeccable extract`:** targeted map/chart semantic tokens and maintenance alignment.
4. **[P2] `$impeccable polish`:** upload/run hierarchy and Lab 4 selected-state consistency; one bounded desktop/mobile confirmation pass.

## References

- [W3C: Contrast (Minimum)](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [W3C: Non-text Contrast, especially Adjacent colors](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)
- [W3C: Use of Color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html)

Browser captures and computed styles for this audit are stored locally at `/private/tmp/optiq-color-audit/`; they are transient review evidence, not committed golden snapshots.
