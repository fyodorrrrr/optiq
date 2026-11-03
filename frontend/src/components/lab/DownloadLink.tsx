import type { ComponentPropsWithoutRef } from 'react'

export default function DownloadLink({ children, className = '', ...props }:
  ComponentPropsWithoutRef<'a'> & { href: string; download: string | boolean }) {
  return <a {...props} className={`lab-download-link ${className}`.trim()}>
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M10 3v9m-3-3 3 3 3-3M4 13v4h12v-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
    <span>{children}</span>
  </a>
}
