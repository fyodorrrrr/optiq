import { useId } from 'react'
import type { ReactNode } from 'react'
import DetailsDrawer from './DetailsDrawer'

export default function InfoDetails({ title, children, className = '' }: {
  title: string; children: ReactNode; className?: string
}) {
  const id = useId()
  return <div className={className}>
    <button className="lab-details-trigger" type="button" popoverTarget={id}>{title}<span aria-hidden="true"> →</span></button>
    <DetailsDrawer id={id} title={title}>{children}</DetailsDrawer>
  </div>
}
