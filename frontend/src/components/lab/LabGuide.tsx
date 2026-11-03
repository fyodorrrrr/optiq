import type { ReactNode, Ref } from 'react'

export default function LabGuide({ id, ref, children, settingsHelp }: { id: string; ref?: Ref<HTMLDetailsElement>; children: ReactNode; settingsHelp?: ReactNode }) {
  return <details className="lab-learning-disclosure" id={id} ref={ref}>
    <summary>Understand this experiment</summary>
    {settingsHelp && <section className="lab-guide-settings" id={`${id}-settings`} tabIndex={-1}><h2>Using the controls</h2>{settingsHelp}</section>}
    {children}
  </details>
}
