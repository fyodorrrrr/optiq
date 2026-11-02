import { useEffect, useId, useRef, useState } from 'react'
import LabButton from './LabButton'

export interface SampleOption<T extends string> { value: T; label: string; description: string }

export default function SamplePicker<T extends string>({ disabled, onSelect, options }: {
  disabled: boolean; onSelect: (kind: T) => Promise<void>; options: SampleOption<T>[]
}) {
  const optionsId = useId()
  const [open, setOpen] = useState(false)
  const container = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    function dismiss(event: PointerEvent) {
      if (!container.current?.contains(event.target as Node)) setOpen(false)
    }
    function escape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
        trigger.current?.focus()
      }
    }
    document.addEventListener('pointerdown', dismiss)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('pointerdown', dismiss)
      document.removeEventListener('keydown', escape)
    }
  }, [open])

  function choose(kind: T) {
    setOpen(false)
    trigger.current?.focus()
    void onSelect(kind)
  }

  return <div className="lab-sample-picker" ref={container} onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
  }}>
    <LabButton ref={trigger} type="button" disabled={disabled}
      aria-expanded={open} aria-controls={optionsId} onClick={() => setOpen(previous => !previous)}>
      Try a sample image
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </LabButton>
    {open && <div className="lab-sample-options" id={optionsId} role="group" aria-label="Sample images">
      {options.map(option => <button key={option.value} type="button" disabled={disabled} onClick={() => choose(option.value)}>
        <strong>{option.label}</strong><span>{option.description}</span>
      </button>)}
    </div>}
  </div>
}
