import type { ComponentPropsWithRef } from 'react'
import { useSyncExternalStore } from 'react'
import { connectionSnapshot, subscribeConnection } from '../../api/connection'

export default function LabButton({ variant = 'secondary', className = '', type = 'button', hideWhileConnecting = false, children, ...props }:
  ComponentPropsWithRef<'button'> & { variant?: 'primary' | 'secondary' | 'quiet'; hideWhileConnecting?: boolean }) {
  const style = variant === 'primary' ? 'lab-primary' : variant === 'quiet' ? 'lab-quiet' : 'lab-button'
  const connecting = useSyncExternalStore(subscribeConnection, connectionSnapshot, () => false)
  if (hideWhileConnecting && connecting) return null
  const busy = variant === 'primary' && (props['aria-busy'] === true || props['aria-busy'] === 'true')
  return <button {...props} type={type} className={`${style} ${className}${busy ? ' lab-button-processing' : ''}`.trim()}>
    {busy ? <><span className="lab-button-original" aria-hidden="true">{children}</span><span className="lab-button-progress"><span className="lab-button-spinner" aria-hidden="true" />{connecting ? 'Connecting…' : 'Processing…'}</span></> : children}
  </button>
}
