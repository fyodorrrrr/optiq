import type { ReactNode } from 'react'

export default function LabWorkspace({ label, tools, controls, resultsId, busy, children }: {
  label: string; tools: ReactNode; controls: ReactNode; resultsId: string; busy: boolean; children: ReactNode
}) {
  const settingsId = `${resultsId}-settings`
  return <section className="lab-workspace" aria-label={label}>
    <div className="lab-workspace-grid">
      {tools}
      <div className="lab-workspace-body">
        <aside className="lab-controls" id={settingsId} tabIndex={-1}>{controls}</aside>
        <div className="lab-viewers" id={resultsId} tabIndex={-1} aria-label="Experiment results" aria-busy={busy}>{children}<a className="lab-return-settings" href={`#${settingsId}`}>Back to settings ↑</a></div>
      </div>
    </div>
  </section>
}
