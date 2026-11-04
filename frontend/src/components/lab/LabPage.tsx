import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { labs } from '../../data/labs'
import Wordmark from '../Wordmark'
import './LabUI.css'

export default function LabPage({ labNumber, title, description, actions, inputNote, guideId, onOpenGuide, wide, children }: {
  labNumber: number; title: string; description: string; actions: ReactNode
  inputNote?: string; guideId: string; onOpenGuide: () => void; wide?: boolean; children: ReactNode
}) {
  const mainId = `lab-${labNumber}-main`
  const previousLab = labs.find(lab => lab.id === labNumber - 1)
  const nextLab = labs.find(lab => lab.id === labNumber + 1)
  return <div className={`lab-page lab-shell${wide ? ' lab-shell-wide' : ''}`}>
    <a className="skip-link" href={`#${mainId}`}>Skip to workspace</a>
    <header className="site-header"><Link className="brand" to="/" aria-label="Optiq home"><Wordmark /></Link>
      <nav aria-label="Lab navigation"><Link to="/#labs">All labs</Link><a href={`#${guideId}`} onClick={onOpenGuide}>How it works</a></nav>
    </header>
    <main className="lab-main" id={mainId}>
      <Link className="lab-back" to="/#labs">← Back to labs</Link>
      <section className="lab-introduction" aria-labelledby={`lab-${labNumber}-title`}>
        <div><h1 id={`lab-${labNumber}-title`}>{title}</h1><p>{description}</p></div>
        <div className="lab-source-actions">{actions}</div>
      </section>
      {inputNote && <p className="lab-input-note">{inputNote}</p>}
      {children}
      <footer className="site-footer"><nav className="lab-pagination" aria-label="Previous and next labs">
        {previousLab?.href && <Link to={previousLab.href}>← Previous lab: {previousLab.title}</Link>}
        {nextLab?.href ? <Link className="lab-pagination-next" to={nextLab.href}>Next lab: {nextLab.title} →</Link>
          : nextLab ? <span>Next lab: {nextLab.title} · Coming soon</span>
            : <Link className="lab-pagination-next" to="/#labs">Back to all labs →</Link>}
      </nav>
      </footer>
    </main>
  </div>
}
