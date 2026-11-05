# Homepage UI/UX audit — 5 November 2026

Scope: the current homepage, including the hero, learning cards, lab map, previews, navigation, and footer. This audit does not change product code or the learning canvases.

## Assessment

**15/20 — good foundation, with mobile density and robustness improvements recommended.** No P0 or P1 issue was observed. Scores are qualitative design assessments, not accessibility certification or performance benchmarks.

| Dimension | Score / 4 | Assessment |
|---|---:|---|
| Accessibility | 3 | Working keyboard controls, visible focus, skip link, and reduced-motion handling; small secondary link targets merit improvement. |
| Performance | 3 | Lightweight homepage imagery and restrained motion; all lab routes are eagerly imported. |
| Responsive behavior | 2 | Standard viewports fit, but stacked cards substantially delay the map and enlarged text exposes overflow. |
| Theming and consistency | 3 | Coherent paper, green, pixel-art, and handwritten visual language; preserve the intentional decorative treatment. |
| Interaction integrity | 4 | Map selection, preview updates, slider keyboard input, and backend-independent previews worked in the checked flows. |

## Findings, in recommended order

### 1. P2 — Mobile cards delay access to the map

**Location:** `frontend/src/components/LearningCards.css:67–79`; hero spacing in `frontend/src/App.css:460` onward.

**Evidence:** At 390 px wide, the learning section occupies approximately 1,305 px and the labs section starts about 1,949 px down the document. At 760 px, the learning section occupies 1,496 px and labs start at 2,341 px. Each stacked illustration retains 240–280 px of height.

**Impact:** Users browsing naturally must pass three large cards before comparing labs. The hero's working “Explore the labs” anchor and direct Lab 1 link mitigate this; lab access is not blocked.

**Recommendation:** Keep the three cards and existing copy, but reduce mobile illustration height and vertical padding, or use compact image-and-copy arrangements where width permits. Preserve comfortable spacing rather than compressing every section equally. No extra explanatory text is needed.

### 2. P2 — Enlarged mobile text can exceed the viewport

**Location:** Homepage layout and text rules in `frontend/src/App.css`; map layout in `frontend/src/components/LabMap.tsx`.

**Evidence:** Normal widths of 320, 390, 760, 1024, and 1440 px had no document overflow. A separate 390 px stress test doubling computed text sizes produced 33 px of horizontal overflow; the equivalent desktop test produced none. No handwritten-caption/node collision was detected in those checks.

**Impact:** Users enlarging text may need horizontal movement to read some content.

**Recommendation:** Inspect the enlarged mobile layout for constrained text widths, shrinkable flex/grid children, and wrapping. Allow text-driven blocks to grow naturally. Do not hide overflow as the fix.

**Limit:** This is a text-enlargement stress test, not an actual browser-zoom or WCAG conformance test. Verify the final fix using browser zoom and device text settings before making compliance claims.

### 3. P2 — Secondary links have small touch areas

**Location:** `frontend/src/App.tsx:22` and `frontend/src/App.tsx:34`; associated navigation and quiet-link styles.

**Evidence:** GitHub measures approximately 60 × 21 px and “Open Lab 1” approximately 73 × 21 px. Main action buttons and map targets are substantially larger. The focused skip link is 146 × 48 px and works correctly.

**Impact:** These secondary links require more precise taps than the primary controls.

**Recommendation:** Enlarge their hit areas with padding or a minimum inline-flex height near 44 px, retaining the same text and visual hierarchy. Recheck adjacent spacing at 320 px.

**Limit:** A 21 px text-link height alone does not establish a WCAG AA target-size violation; spacing exceptions may apply.

### 4. P2 — Homepage loading includes all seven lab routes

**Location:** `frontend/src/App.tsx:7–13`.

**Evidence:** Every lab is imported eagerly. The current production main JavaScript asset is approximately 501 kB before gzip / 173 kB gzipped, and Vite reports its chunk-size warning.

**Impact:** First-time homepage visitors receive code for experiments they have not opened. The practical cost depends on device and connection speed.

**Recommendation:** Lazy-load route components with a stable loading boundary. Keep the homepage and map immediately available. Also use React Router links for internal lab navigation (`App.tsx:34`, `LabPreview.tsx:54`) to avoid full document navigations.

**Limit:** No production Core Web Vitals or throttled-device timings were collected. The bundle warning is supporting evidence, not proof of a slow user experience.

## Design tradeoff to revisit

At 761 px, the selected preview contains imagery and measures about 522 px tall; at 760 px it becomes a text-only compact preview around 206 px tall. This is the documented compact design, not an implementation defect. It saves substantial mobile space but removes the visual comparison that helps students choose a lab. Consider retaining a small static thumbnail if mobile visual discovery is a priority; an interactive slider need not be forced into that space.

## What works well

- The hero explains the computer-vision purpose and offers both map access and a direct first lab.
- Section headings and the map container share their left alignment at desktop width.
- Pixel artwork, restrained colors, and the map establish a recognizable identity.
- Selection is communicated by node treatment, label weight, underline, and updated preview—not color alone.
- Map activation works with the keyboard; the comparison range responds to arrow keys and displays a visible 3 px focus outline.
- The skip link becomes visible on focus and moves navigation into the main content.
- Reduced-motion mode disables the checked decorative animation and smooth scrolling.
- Homepage previews continue working when lab API calls are blocked.
- All five automated accessibility scans returned zero violations; no page errors, broken HTML images, or normal-width horizontal overflow were observed.

## Intentional choices and false positives

The scoped Impeccable detector returned no findings. This does not replace browser inspection.

Do not treat the warm-gray Gaegu captions, gentle rotations, curved dashed separators, pixel art, or muted sage path highlight as defects merely because they are decorative; these are deliberate user-selected elements. The comparison handle is visually 36 px, but its native range input spans the image, so measuring the handle alone would misrepresent the actual pointer target. Lab 6's edge-to-edge comparison crop and Lab 4/5's inset artwork are also intentional. Hidden preview measurement copies reserve panel height and are hidden from assistive technology.

## Verification and limits

Inspected source and live Brave/Chromium at 1440, 1024, 760, 390, and 320 px widths with a 1000 px viewport height. Ran axe on each, inspected desktop/mobile screenshots, checked keyboard map selection and slider input, reduced motion, API-unavailable behavior, and text-enlargement stress. One bounded confirmation pass checked alignment, the 760 px breakpoint, skip-link focus, and enlarged text.

No Safari, Firefox, physical touchscreen, screen-reader session, production performance profile, or real browser-zoom certification was performed. No product implementation was modified by this audit.

## Suggested follow-through

1. `adapt` — reduce mobile card density while preserving the existing content and identity.
2. `harden` — fix enlarged-text overflow and enlarge secondary link hit areas.
3. `optimize` — split lab routes and improve internal navigation.
4. `polish` — finish spacing and alignment after the structural changes.

These findings can be addressed individually or together, then re-audited against the same viewport set.

## Follow-up implementation

The approved improvements were implemented after this audit: shorter phone illustrations,
side-by-side tablet cards, 44 px secondary link targets, wrapping map titles,
static thumbnails in compact previews, lazy-loaded lab routes, and client-side lab links.
The map dividers remain unchanged pending the user's design choice.

Lint and production build passed. Browser checks at the same five widths found zero
axe violations after transitions settled, no page errors, and no horizontal overflow
at normal or doubled text sizes. All seven lab routes opened and internal navigation
preserved the document. At 390 px, the learning section dropped from 1,305 to 1,033 px;
at 760 px, from 1,496 to 832 px. Main JavaScript decreased from approximately 501 kB
(173 kB gzip) to 323 kB (125 kB gzip). These are build sizes, not measured load times.
