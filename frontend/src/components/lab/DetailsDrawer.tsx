import { useId, useRef } from 'react'
import type { ReactNode } from 'react'

export default function DetailsDrawer({ id, title, children }: {
  id: string; title: string; children: ReactNode
}) {
  const titleId = useId()
  const closeButton = useRef<HTMLButtonElement>(null)

  return <div id={id} popover="auto" className="lab-details-drawer" role="region" aria-labelledby={titleId}
    onToggle={event => { if (event.newState === 'open') closeButton.current?.focus() }}>
    <header className="lab-details-drawer-header">
      <h2 id={titleId}>{title}</h2>
      <button ref={closeButton} type="button" popoverTarget={id} popoverTargetAction="hide" aria-label="Close details">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
      </button>
    </header>
    <div className="lab-details-drawer-content">{children}</div>
    <button className="lab-details-drawer-done" type="button" popoverTarget={id} popoverTargetAction="hide">Back to the experiment</button>
  </div>
}
