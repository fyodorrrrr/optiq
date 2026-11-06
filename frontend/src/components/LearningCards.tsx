import './LearningCards.css'

const cards = [
  {
    id: 'start',
    title: 'Start with an image.',
    description: 'Use a sample, upload your own, or explore a prepared dataset.',
  },
  {
    id: 'compare',
    title: 'Change it. Compare it.',
    description: 'Adjust a setting and compare live or recorded results.',
  },
  {
    id: 'understand',
    title: 'See why it works.',
    description: 'Connect the result to the technique behind it.',
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
  const descriptions = {
    start: 'Illustrative emerald image print containing a square, circle, triangle and rectangle.',
    compare: 'Illustrative comparison of the same geometric scene in emerald colors and white edge outlines. This is a diagram, not a live computation.',
    understand: 'Illustrative inspection of the same geometric scene. A selection inside the emerald square connects to a magnified 3 by 3 grid. The outlined center pixel has a green-channel value of 127.',
  }

  return <div className="learning-card-visual">
    <svg className="learning-card-diagram" viewBox="0 0 320 220" role="img" aria-label={descriptions[kind]}>
      {kind === 'start' && <g transform="rotate(-4 160 110)">
        <rect className="learning-diagram-paper" x="28" y="14" width="264" height="198" />
        <ImageStudy x={36} y={22} width={248} height={186} />
        <rect className="learning-diagram-tape" x="132" y="4" width="56" height="20" />
      </g>}
      {kind === 'compare' && <>
        <rect className="learning-diagram-paper" x="14" y="40" width="292" height="142" />
        <ImageStudy x={22} y={48} width={136} height={126} />
        <ImageStudy edges x={162} y={48} width={136} height={126} />
        <text className="learning-diagram-label" x="90" y="204" textAnchor="middle">Original</text>
        <text className="learning-diagram-label" x="230" y="204" textAnchor="middle">Edges</text>
      </>}
      {kind === 'understand' && <>
        <rect className="learning-diagram-paper" x="6" y="40" width="188" height="148" />
        <ImageStudy x={12} y={46} width={176} height={136} />
        <circle className="learning-magnifier" cx="246" cy="116" r="64" />
        <path className="learning-inspection-lines" d="M62 91 225 55M62 99 225 177" />
        <rect className="learning-image-selection" x="54" y="91" width="8" height="8" />
        {Array.from({ length: 9 }, (_, index) => <rect className="learning-magnified-pixel" key={index}
          x={209 + index % 3 * 25} y={79 + Math.floor(index / 3) * 25} width="23" height="23" />)}
        <rect className="learning-selected-pixel" x="233" y="103" width="25" height="25" />
        <text className="learning-diagram-label" x="246" y="207" textAnchor="middle">G: 127</text>
      </>}
    </svg>
  </div>
}

export default function LearningCards() {
  return <section className="learning-cards-section" aria-labelledby="learning-cards-title">
    <h2 id="learning-cards-title">How Optiq works</h2>
    <div className="learning-cards">
      {cards.map(card => <article className="learning-card" key={card.id} aria-labelledby={`learning-card-${card.id}`}>
        <div className="learning-card-copy">
          <h3 id={`learning-card-${card.id}`}>{card.title}</h3>
          <p>{card.description}</p>
        </div>
        <LearningVisual kind={card.id} />
      </article>)}
    </div>
  </section>
}
