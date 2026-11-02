import type { ReactNode } from 'react'

export function LabError({ message, title = 'Could not complete the request.' }: { message: string; title?: string }) {
  return <div className="lab-error" role="alert"><strong>{title}</strong><p>{message}</p></div>
}

export function LabStatus({ children }: { children: ReactNode }) {
  return <p className="lab-run-status" role="status" aria-live="polite">{children}</p>
}
