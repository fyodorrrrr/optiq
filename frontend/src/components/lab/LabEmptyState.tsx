import type { ReactNode } from 'react'

export default function LabEmptyState({ children }: { children: ReactNode }) {
  return <div className="lab-empty-state">
    <svg className="lab-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8" cy="8" r="1.5" />
      <path d="m3 17 6-6 4 4 3-3 5 5" />
    </svg>
    <div className="lab-empty-description">{children}</div>
  </div>
}
