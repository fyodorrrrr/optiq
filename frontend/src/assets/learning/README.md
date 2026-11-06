# Learning-card artwork

Open `optiq-learning-cards.piskel` in Piskel with **Import → Browse .piskel files**.
It contains three static illustrations as frames, in homepage order:

1. Start with an image.
2. Change it. Compare it.
3. See why it works.

Each frame is **160 × 128 pixels**, transparent, with **Mascot**, **Props**, and
blank **Touch-ups** layers. Individual `start.piskel`, `compare.piskel`, and
`understand.piskel` projects are also provided for editing one card at a time.
The current user-edited sources are `start-updated.piskel`,
`compare-updated2.piskel`, and `understand-updated.piskel`. Their matching
canonical projects (`start.piskel`, `compare.piskel`, `understand.piskel`), PNG
previews, and combined project are synchronized. Earlier suffixed files remain
available as previous drafts.
The one-frame-per-second setting in the combined project is an editor preview;
the homepage uses static PNGs.

The starting scenes were generated with the built-in image generator using
the existing `public/assets/glass-with-glass.png` mascot as a reference, then
converted to a native pixel grid and restricted 12-color palette. Exact prompts
and the palette are in `prompts.json`. The Mascot/Props layers are spatial
cutouts of that generated artwork; covered details have not been reconstructed.

After editing, export each frame as a transparent PNG at **1×** scale and replace
the matching `start.png`, `compare.png`, or `understand.png` beside these files.
These originals remain the editable sources for derived mascot samples; the
homepage learning cards now use native emerald notebook diagrams in
`LearningCards.tsx` rather than these mascot images. Keep their 160 × 128 canvas
size; the website scales them with crisp pixel rendering. Saving the `.piskel`
alone does not update the PNG on the website.

## Logo

`logo.piskel` is the user's 32 × 32 logo source, with BODY and GLASS layers.
`logo.png` exports the first frame, cropping transparent margins to 22 × 26.
The shared `Wordmark.tsx` uses that PNG as the “o” on the homepage and lab pages.
The same artwork is centered without resampling in `public/favicon.png` on a
transparent 32 × 32 canvas. `public/favicon.svg`, linked from `index.html`, embeds
that PNG with the emerald color treatment used for the displayed mascot.

## Emerald display palette

The user selected the saturated emerald preview on 2026-11-06. The hero and
wordmark receive the shared `--mascot-filter`
(`saturate(2.15) brightness(1.04)`) in `src/index.css`; original PNG and Piskel
files retain their editable source colors. The favicon SVG applies the equivalent
saturation and brightness filter to the embedded original PNG. This is the same
whole-artwork treatment approved in the preview, not a selective green-pixel edit.
When changing the display treatment, keep the CSS token and favicon filter in sync.
