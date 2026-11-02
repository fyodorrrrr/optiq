import type { ComponentPropsWithRef } from 'react'

export default function LabButton({ variant = 'secondary', className = '', type = 'button', ...props }:
  ComponentPropsWithRef<'button'> & { variant?: 'primary' | 'secondary' }) {
  return <button {...props} type={type} className={`${variant === 'primary' ? 'lab-primary' : 'lab-button'} ${className}`.trim()} />
}
