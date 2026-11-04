import { useId } from 'react'
import type { ReactNode, Ref } from 'react'
import DetailsDrawer from './DetailsDrawer'

export default function LearningCanvas({ id, ref, title, visual, children, details }: {
  id: string
  ref?: Ref<HTMLElement>
  title: string
  visual: ReactNode
  children: ReactNode
  details: ReactNode
}) {
  const panelId = useId()

  return <section className="learning-canvas" id={id} ref={ref} tabIndex={-1} aria-labelledby={`${id}-title`}>
    <header className="learning-canvas-header">
      <h2 id={`${id}-title`}>{title}</h2>
      <span className="learning-canvas-example">Illustrative example</span>
    </header>
    <figure className="learning-canvas-body">
      <div className="learning-canvas-visual">{visual}</div>
      <figcaption className="learning-canvas-caption">
        {children}
        <button type="button" popoverTarget={panelId} className="learning-canvas-link">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 5c-2-2-5-2-8-1v12c3-1 6-1 8 1m0-12c2-2 5-2 8-1v12c-3-1-6-1-8 1V5Z" /></svg>
          How it works
        </button>
      </figcaption>
    </figure>
    <DetailsDrawer id={panelId} title={`How it works: ${title}`}>{details}</DetailsDrawer>
  </section>
}
