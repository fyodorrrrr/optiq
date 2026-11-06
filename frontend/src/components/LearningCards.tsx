import { useEffect, useId, useRef, useState } from 'react'
import './LearningCards.css'

const cards = [
  {
    id: 'start',
    title: 'Pick an image.',
    description: 'Use a sample, upload your own, or explore a prepared dataset.',
  },
  {
    id: 'compare',
    title: 'See what changes.',
    description: 'Adjust a setting and compare live or recorded results.',
  },
  {
    id: 'understand',
    title: 'Look a little closer.',
    description: 'Inspect the details and connect them to the technique.',
  },
] as const

function ImageStudy({ edges = false, x, y, width, height }: { edges?: boolean; x: number; y: number; width: number; height: number }) {
  return <svg className={`learning-image-study${edges ? ' is-edges' : ''}`} x={x} y={y} width={width} height={height} viewBox="0 0 160 120" aria-hidden="true">
    <rect className="study-background" width="160" height="120" />
    <rect className="study-rectangle" x="14" y="18" width="54" height="44" />
    <circle className="study-circle" cx="115" cy="39" r="23" />
    <path className="study-triangle" d="M16 104 44 65 72 104Z" />
    <path className="study-block" d="M72 104V67h73v37Z" />
  </svg>
}

function LearningVisual({ kind }: { kind: (typeof cards)[number]['id'] }) {
  const clipId = useId()
  const descriptions = {
    start: 'Illustrative emerald image print containing a square, circle, triangle and rectangle.',
    compare: 'Illustrative comparison of the same geometric scene in emerald colors and white edge outlines. This is a diagram, not a live computation.',
    understand: 'Illustrative inspection of the same geometric scene. A selection inside the emerald square connects to a magnified 3 by 3 grid. The outlined center pixel has a green-channel value of 127.',
  }

  return <div className="learning-card-visual">
    <svg className="learning-card-diagram" viewBox="0 0 320 220" role="img" aria-label={descriptions[kind]}>
      {kind === 'start' && <>
        <g className="learning-print-lift"><g transform="rotate(-4 160 110)">
        <rect className="learning-diagram-paper" x="28" y="14" width="264" height="198" />
        <ImageStudy x={36} y={22} width={248} height={186} />
        <rect className="learning-diagram-tape" x="132" y="4" width="56" height="20" />
        </g></g>
        <g className="learning-cursor-motion"><g className="learning-pick-cursor" transform="translate(262 168)">
          <g className="learning-cursor-press"><path d="M2 2v27l7-7 6 12 5-2-6-12h12Z" /></g>
        </g></g>
        <path className="learning-pick-strokes" pathLength="1" d="M291 161l5-9m3 18 9-5" />
      </>}
      {kind === 'compare' && <>
        <defs><clipPath id={clipId}><rect className="learning-edge-clip" x="160" y="26" width="138" height="180" /></clipPath></defs>
        <rect className="learning-diagram-paper" x="14" y="26" width="292" height="180" />
        <ImageStudy x={22} y={34} width={276} height={164} />
        <g clipPath={`url(#${clipId})`}><ImageStudy edges x={22} y={34} width={276} height={164} /></g>
        <path className="learning-reveal-line" d="M160 30v172" />
        <path className="learning-reveal-arrow" d="M181 16h-42m6-5-6 5 6 5" />
      </>}
      {kind === 'understand' && <>
        <rect className="learning-diagram-paper" x="6" y="40" width="188" height="148" />
        <ImageStudy x={12} y={46} width={176} height={136} />
        <rect className="learning-image-selection" x="54" y="91" width="8" height="8" />
        <g className="learning-zoom-detail">
        <circle className="learning-magnifier" cx="246" cy="116" r="64" />
        <path className="learning-inspection-lines" d="M62 91 225 55M62 99 225 177" />
        {Array.from({ length: 9 }, (_, index) => <rect className="learning-magnified-pixel" key={index}
          x={209 + index % 3 * 25} y={79 + Math.floor(index / 3) * 25} width="23" height="23" />)}
        <rect className="learning-selected-pixel" x="233" y="103" width="25" height="25" />
        <text className="learning-diagram-label" x="246" y="207" textAnchor="middle">G: 127</text>
        </g>
      </>}
    </svg>
  </div>
}

export default function LearningCards() {
  const section = useRef<HTMLElement>(null)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    const elements = Array.from(section.current?.querySelectorAll<HTMLElement>('.learning-card') ?? [])
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (preference.matches || !('IntersectionObserver' in window)) return

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const element = entry.target as HTMLElement
        if (entry.isIntersecting) element.dataset.motion = 'playing'
        else if (element.dataset.motion) element.dataset.motion = 'paused'
      })
    }, { threshold: .3 })
    elements.forEach(element => observer.observe(element))

    function stopMotion() {
      if (!preference.matches) return
      observer.disconnect()
      elements.forEach(element => { element.dataset.motion = 'static' })
    }
    preference.addEventListener('change', stopMotion)
    return () => {
      observer.disconnect()
      preference.removeEventListener('change', stopMotion)
    }
  }, [])

  return <section ref={section} className="learning-cards-section" data-paused={paused} aria-labelledby="learning-cards-title">
    <div className="learning-cards-heading">
      <h2 id="learning-cards-title">How Optiq works</h2>
      <button className="learning-motion-control" type="button" aria-label={paused ? 'Resume animations' : 'Pause animations'} title={paused ? 'Resume animations' : 'Pause animations'} onClick={() => setPaused(value => !value)}>
        <svg viewBox="0 0 20 20" aria-hidden="true">{paused
          ? <path d="m6 3 10 7-10 7Z" />
          : <><rect x="5" y="3" width="3" height="14" /><rect x="12" y="3" width="3" height="14" /></>}</svg>
      </button>
    </div>
    <div className="learning-cards">
      {cards.map(card => <article className="learning-card" data-kind={card.id} key={card.id} aria-labelledby={`learning-card-${card.id}`}>
        <div className="learning-card-copy">
          <h3 id={`learning-card-${card.id}`}>{card.title}</h3>
          <p>{card.description}</p>
        </div>
        <LearningVisual kind={card.id} />
      </article>)}
    </div>
  </section>
}
