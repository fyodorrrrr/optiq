import type { ReactNode } from 'react'
import InfoDetails from './InfoDetails'

export default function LabWorkspace({ label, tools, controls, resultsId, busy, details = [], help, children }: {
  help?: ReactNode
  details?: (false | null | undefined | { id: string; title: string; content: ReactNode })[]
  label: string; tools: ReactNode; controls: ReactNode; resultsId: string; busy: boolean; children: ReactNode
}) {
  const settingsId = `${resultsId}-settings`
  const entries = details.filter((entry): entry is { id: string; title: string; content: ReactNode } => Boolean(entry))
  return <section className="lab-workspace" aria-label={label}>
    <div className="lab-workspace-grid">
      {tools}
      <div className={`lab-workspace-body${controls ? '' : ' lab-workspace-body-wide'}`}>
        {controls && <aside className="lab-controls" id={settingsId} tabIndex={-1}>{controls}
          {(help || entries.length > 0) && <nav className="workspace-details-links" aria-label="Experiment details">
            {help}
            {entries.map(entry => <InfoDetails key={entry.id} title={entry.title}>{entry.content}</InfoDetails>)}
          </nav>}
        </aside>}
        <div className="lab-viewers" id={resultsId} tabIndex={-1} aria-label="Experiment results" aria-busy={busy}>{children}{controls && <a className="lab-return-settings" href={`#${settingsId}`}>Back to settings ↑</a>}</div>
      </div>
    </div>
  </section>
}
