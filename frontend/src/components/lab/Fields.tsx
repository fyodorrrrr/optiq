import { useId } from 'react'
import type { InputHTMLAttributes } from 'react'

export function NumberField({ label, onChange, ...props }:
  Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'type'> & {
    label: string; onChange: (value: string) => void
  }) {
  const id = useId()
  return <div className="lab-field"><label htmlFor={id}>{label}</label>
    <input {...props} id={id} type="number" onChange={event => onChange(event.target.value)} />
  </div>
}

export function SelectField({ label, value, options, onChange }: {
  label: string; value: string; options: { value: string | number; label: string; disabled?: boolean }[]
  onChange: (value: string) => void
}) {
  const id = useId()
  return <div className="lab-field"><label htmlFor={id}>{label}</label>
    <select id={id} value={value} onChange={event => onChange(event.target.value)}>
      {options.map(option => <option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</option>)}
    </select>
  </div>
}
