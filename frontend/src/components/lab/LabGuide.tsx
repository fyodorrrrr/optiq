import type { ReactNode, Ref } from 'react'
import LearningCanvas from './LearningCanvas'
import type { LearningConcept } from './ConceptDiagram'

export default function LabGuide({ id, ref, title, visual, concept, children, settingsHelp }: {
  id: string; ref?: Ref<HTMLElement>; title: string; visual: ReactNode
  concept: LearningConcept; children: ReactNode; settingsHelp?: ReactNode
}) {
  return <LearningCanvas id={id} ref={ref} title={title} visual={visual} details={<>
    {settingsHelp && <section className="lab-guide-settings" id={`${id}-settings`} tabIndex={-1}><h3>Using the controls</h3>{settingsHelp}</section>}
    {children}
  </>}>
    <h3>{concept.takeaway}</h3>
    <p>{concept.caption}</p>
    <p className="learning-canvas-note">{concept.note}</p>
  </LearningCanvas>
}
