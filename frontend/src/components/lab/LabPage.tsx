import type { ReactNode } from 'react'
import { Link } from 'react-router'
import './LabUI.css'

export default function LabPage({ labNumber, title, description, actions, inputNote, guideId, onOpenGuide, wide, children }: {
  labNumber: number; title: string; description: string; actions: ReactNode
  inputNote: string; guideId: string; onOpenGuide: () => void; wide?: boolean; children: ReactNode
}) {
  const mainId = `lab-${labNumber}-main`
  return <div className={`lab-page lab-shell${wide ? ' lab-shell-wide' : ''}`}>
    <a className="skip-link" href={`#${mainId}`}>Skip to workspace</a>
    <header className="site-header"><Link className="brand" to="/" aria-label="Optiq home">optiq<span>.</span></Link>
      <nav aria-label="Lab navigation"><Link to="/#labs">All labs</Link><a href={`#${guideId}`} onClick={onOpenGuide}>How it works</a></nav>
    </header>
    <main className="lab-main" id={mainId}>
      <Link className="lab-back" to="/#labs">← Back to labs</Link>
      <section className="lab-introduction" aria-labelledby={`lab-${labNumber}-title`}>
        <div><h1 id={`lab-${labNumber}-title`}>{title}</h1><p>{description}</p></div>
        <div className="lab-source-actions">{actions}</div>
      </section>
      <p className="lab-input-note">{inputNote}</p>
      {children}
      <footer className="site-footer"><p>Lab {labNumber} of 7 · Python/OpenCV processing</p><Link to="/#labs">Explore the labs →</Link></footer>
    </main>
  </div>
}
