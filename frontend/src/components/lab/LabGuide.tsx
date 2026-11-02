import type { ReactNode, Ref } from 'react'

export default function LabGuide({ id, ref, children }: { id: string; ref?: Ref<HTMLDetailsElement>; children: ReactNode }) {
  return <details className="lab-learning-disclosure" id={id} ref={ref}>
    <summary>Understand this experiment</summary>{children}
  </details>
}
