import { useId } from 'react'
import type { InputHTMLAttributes } from 'react'
import FieldHelp from './FieldHelp'

export function NumberField({ label, onChange, error, hint, ...props }:
  Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'type'> & {
    label: string; onChange: (value: string) => void; error?: string; hint?: string
  }) {
  const id = useId()
  return <div className="lab-field"><label htmlFor={id}>{label}</label>
    <input {...props} id={id} type="number" aria-invalid={error ? true : undefined} aria-describedby={[props['aria-describedby'], hint ? `${id}-hint` : '', error ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined} onChange={event => onChange(event.target.value)} />
    {hint && <span className="lab-field-hint" id={`${id}-hint`}>{hint}</span>}
    {error && <span className="lab-field-error" id={`${id}-error`}>{error}</span>}
  </div>
}

export function SelectField({ label, value, options, onChange, hint, help, disabled = false }: {
  label: string; value: string; hint?: string; help?: { label: string; text: string }; disabled?: boolean; options: { value: string | number; label: string; disabled?: boolean }[]
  onChange: (value: string) => void
}) {
  const id = useId()
  return <div className="lab-field">
    {help ? <div className="lab-field-label-row"><label htmlFor={id}>{label}</label><FieldHelp label={help.label}>{help.text}</FieldHelp></div>
      : <label htmlFor={id}>{label}</label>}
    <span className="lab-select-control">
      <select id={id} disabled={disabled} aria-describedby={hint ? `${id}-hint` : undefined} value={value} onChange={event => onChange(event.target.value)}>
        {options.map(option => <option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</option>)}
      </select>
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m5 8 5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </span>
    {hint && <span className="lab-field-hint" id={`${id}-hint`}>{hint}</span>}
  </div>
}
