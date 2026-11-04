# Lab 1 Learning Canvas

Apply the annotated-figure direction selected in conversation to Lab 1 first.
Below the experiment, show one static visual for the active concept, a short
beginner-friendly caption, and a single “How it works” action. Label examples
as illustrative; they do not report the student's image or current results.

Alternatives discussed were compact disclosures, visual sequences, and a
visual/code split. The selected direction keeps annotations visible and moves
deeper theory, Python, and processing notes into a reading panel. It avoids
duplicating the experiment's controls or adding a second learning workflow.

Use a shared LearningCanvas frame under components/lab, shared styles in
LabUI.css, and Lab 1-specific geometric SVG figures/content. Cover inspect,
edit, grayscale, crop, resize, and rotation. Preserve original detailed
explanations, code, and source notes in the panel. Desktop uses visual/caption
columns; small screens stack them. The panel supports Escape, focus return,
visible focus, scrolling, and a labeled close action. Every figure has a text
equivalent and uses labels in addition to color. Existing API validation,
algorithms, experiment state, and other labs remain as implemented.

Verify lint/build, all six concepts, desktop/mobile overflow, panel keyboard
behavior, an actual Lab 1 run, and availability without the backend.
