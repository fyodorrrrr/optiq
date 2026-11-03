import type { ReactNode } from 'react'

export default function ControlHelp({ title, children }: { title: string; children: ReactNode }) {
  return <details className="lab-control-help lab-metadata-help">
    <summary>{title}</summary>
    {children}
  </details>
}
