export class FieldError extends Error {
  field: string

  constructor(field: string, message: string) {
    super(message)
    this.field = field
  }
}

export function numberSetting(value: string, field: string, label: string, min: number, max: number, integer = true) {
  const number = Number(value)
  if (value.trim() === '' || !Number.isFinite(number) || (integer && !Number.isInteger(number)) || number < min || number > max) {
    throw new FieldError(field, `${label}: enter ${integer ? 'a whole number' : 'a number'} from ${min} to ${max}.`)
  }
  return number
}

export function revealField(field: string, reveal: () => void) {
  reveal()
  requestAnimationFrame(() => {
    document.querySelector<HTMLInputElement>(`input[name="${field}"]`)?.focus()
  })
}
