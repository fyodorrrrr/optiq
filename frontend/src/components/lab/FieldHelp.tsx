import { useEffect, useId, useRef, useState } from 'react'

export default function FieldHelp({ label, children }: { label: string; children: string }) {
  const id = useId()
  const root = useRef<HTMLSpanElement>(null)
  const [open, setOpen] = useState(false)
  const [pinned, setPinned] = useState(false)

  useEffect(() => {
    if (!open) return
    function dismiss(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) { setOpen(false); setPinned(false) }
    }
    document.addEventListener('pointerdown', dismiss)
    return () => document.removeEventListener('pointerdown', dismiss)
  }, [open])

  return <span className="lab-field-help" ref={root}
    onMouseEnter={() => setOpen(true)}
    onMouseLeave={event => { if (!pinned && !event.currentTarget.contains(document.activeElement)) setOpen(false) }}
    onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) { setOpen(false); setPinned(false) } }}
    onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); setOpen(false); setPinned(false) } }}>
    <button type="button" className="lab-field-help-trigger" aria-label={label}
      aria-describedby={open ? id : undefined} aria-expanded={open}
      onFocus={() => setOpen(true)} onClick={() => { setPinned(!pinned); setOpen(!pinned) }}>
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7.8 7.4a2.2 2.2 0 1 1 3.6 1.7c-1 .7-1.4 1-1.4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="10" cy="14" r=".8" fill="currentColor" />
      </svg>
    </button>
    {open && <span id={id} role="tooltip" className="lab-field-help-content">{children}</span>}
  </span>
}
