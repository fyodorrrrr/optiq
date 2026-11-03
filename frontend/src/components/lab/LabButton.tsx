import type { ComponentPropsWithRef } from 'react'

export default function LabButton({ variant = 'secondary', className = '', type = 'button', ...props }:
  ComponentPropsWithRef<'button'> & { variant?: 'primary' | 'secondary' | 'quiet' }) {
  const style = variant === 'primary' ? 'lab-primary' : variant === 'quiet' ? 'lab-quiet' : 'lab-button'
  return <button {...props} type={type} className={`${style} ${className}`.trim()} />
}
