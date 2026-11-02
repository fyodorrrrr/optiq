import type { ReactNode } from 'react'

export default function LabWorkspace({ label, tools, controls, resultsId, busy, children }: {
  label: string; tools: ReactNode; controls: ReactNode; resultsId: string; busy: boolean; children: ReactNode
}) {
  return <section className="lab-workspace" aria-label={label}>
    <div className="lab-workspace-grid">
      {tools}
      <div className="lab-workspace-body">
        <aside className="lab-controls">{controls}</aside>
        <div className="lab-viewers" id={resultsId} tabIndex={-1} aria-label="Experiment results" aria-busy={busy}>{children}</div>
      </div>
    </div>
  </section>
}
