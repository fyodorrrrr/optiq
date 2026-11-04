import { useState } from 'react'

export default function HeroPixel() {
  const [run, setRun] = useState(0)
  const [playing, setPlaying] = useState(false)

  return <button className="hero-pixel" type="button" data-playing={playing}
    aria-label="Animate the character peeking through a magnifying glass"
    onClick={() => { setRun(value => value + 1); setPlaying(true) }}
    onAnimationEnd={event => { if (event.animationName === 'hero-peek-body') setPlaying(false) }}>
    <span className="hero-pixel-window" aria-hidden="true">
      <svg key={run} className="hero-pixel-art" viewBox="16 28 32 36">
        <defs>
          <image id="hero-character" href="/assets/glass-with-glass.png" width="64" height="64" />
          <clipPath id="hero-held-glass"><path d="M34 47h3v1h2v4h2v4h-4v-2h-3v-1h-1v-1h-1v-3h1v-1h1Z" /></clipPath>
          <clipPath id="hero-body"><rect width="64" height="57" /></clipPath>
          <clipPath id="hero-feet"><rect y="57" width="64" height="7" /></clipPath>
          <clipPath id="hero-lens-window">
            <path className="hero-peek-glass" d="M35 49h2v1h1v2h-4v-2h1Z" />
          </clipPath>
          <mask id="hero-clean-body" maskUnits="userSpaceOnUse" x="0" y="0" width="64" height="64">
            <rect width="64" height="64" fill="white" />
            <path fill="black" d="M34 47h3v1h2v4h2v4h-4v-2h-3v-1h-1v-1h-1v-3h1v-1h1Z" />
          </mask>
        </defs>
        <g className="hero-peek-body">
          <g clipPath="url(#hero-body)">
            <g clipPath="url(#hero-held-glass)"><use href="#hero-character" transform="translate(62 0) scale(-1 1)" /></g>
            <use href="#hero-character" mask="url(#hero-clean-body)" />
          </g>
          <g className="hero-peek-glass">
            <use href="#hero-character" clipPath="url(#hero-held-glass)" />
          </g>
          <g clipPath="url(#hero-lens-window)">
            <path fill="#010100" d="M34 44h2v5h-2Z" />
          </g>
        </g>
        <use href="#hero-character" clipPath="url(#hero-feet)" />
      </svg>
    </span>
  </button>
}
