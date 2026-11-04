import type { ReactNode } from 'react'
import InfoDetails from './InfoDetails'

export default function ControlHelp({ title, children }: { title: string; children: ReactNode }) {
  return <InfoDetails className="lab-control-help" title={title}>{children}</InfoDetails>
}
