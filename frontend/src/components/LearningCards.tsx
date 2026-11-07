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
    understand: 'Illustrative magnifying glass inspecting the emerald square and mint circle in the same geometric scene. Their green-channel values are 127 and 221. The magnified grid highlights its center pixel.',
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
        <rect className="learning-diagram-paper" x="20" y="24" width="244" height="186" />
        <ImageStudy x={26} y={30} width={232} height={174} />
        <defs><clipPath id={clipId}><circle r="48" /></clipPath></defs>
        <g className="learning-glass-motion">
          <g transform="scale(.82)">
            <path className="learning-glass-handle-outline" d="M37 37 63 63" />
            <path className="learning-glass-handle" d="M37 37 63 63" />
            <circle className="learning-glass-rim" r="54" />
            <circle className="learning-glass-window" r="48" />
            <g clipPath={`url(#${clipId})`}>
              {Array.from({ length: 9 }, (_, index) => <rect className="learning-lens-pixel" key={index}
                x={-35 + index % 3 * 24} y={-35 + Math.floor(index / 3) * 24} width="22" height="22" />)}
            </g>
            <rect className="learning-selected-pixel" x="-12" y="-12" width="24" height="24" />
          </g>
          <g className="learning-lens-value-left">
            <rect className="learning-lens-label-paper" x="-32" y="60" width="64" height="24" rx="4" />
            <text className="learning-diagram-label" x="0" y="77" textAnchor="middle">G: 127</text>
          </g>
          <g className="learning-lens-value-right">
            <rect className="learning-lens-label-paper" x="-32" y="60" width="64" height="24" rx="4" />
            <text className="learning-diagram-label" x="0" y="77" textAnchor="middle">G: 221</text>
          </g>
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
