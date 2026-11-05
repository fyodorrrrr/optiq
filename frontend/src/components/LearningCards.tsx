import startIllustration from '../assets/learning/start.png'
import compareIllustration from '../assets/learning/compare.png'
import understandIllustration from '../assets/learning/understand.png'
import './LearningCards.css'

const cards = [
  {
    id: 'start',
    title: 'Start with an image.',
    description: 'Choose a lab and explore a sample, your own image, or a prepared dataset.',
    illustration: startIllustration,
  },
  {
    id: 'compare',
    title: 'Change it. Compare it.',
    description: 'Change a setting and compare live or recorded results.',
    illustration: compareIllustration,
  },
  {
    id: 'understand',
    title: 'See why it works.',
    description: 'Connect the result to a simple explanation and the Python behind it.',
    illustration: understandIllustration,
  },
]

export default function LearningCards() {
  return <section className="learning-cards-section" aria-labelledby="learning-cards-title">
    <h2 id="learning-cards-title">How learning works</h2>
    <div className="learning-cards">
      {cards.map(card => <article className="learning-card" key={card.id} aria-labelledby={`learning-card-${card.id}`}>
        <div className="learning-card-copy">
          <h3 id={`learning-card-${card.id}`}>{card.title}</h3>
          <p>{card.description}</p>
        </div>
        <img className="learning-card-illustration" src={card.illustration} alt="" width="160" height="128" loading="lazy" decoding="async" />
      </article>)}
    </div>
  </section>
}
