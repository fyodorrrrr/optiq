import type { LearningConcept } from '../../components/lab/ConceptDiagram'
import type { Method } from './api'

export const learningConcepts: Record<Method, LearningConcept> = {
  threshold: { takeaway: 'Brightness separates foreground from background.', caption: 'A threshold turns intensity values into two groups. A global threshold applies everywhere; an adaptive threshold changes with the local neighborhood.', note: 'These masks describe brightness groups, not object identities.' },
  region: { takeaway: 'Connected foreground can contain several objects.', caption: 'Seed growing follows similar connected pixels. Marker-based watershed can split a touching foreground into separately labeled basins.', note: 'Colors below represent region IDs, not semantic classes. Marker choices affect the split.' },
  edges: { takeaway: 'A boundary must close before it encloses a region.', caption: 'Small gaps can prevent an exterior flood fill from separating inside from outside. Closing can bridge gaps before enclosed interiors are filled.', note: 'Larger closing kernels may also merge boundaries that belong apart.' },
  semantic: { takeaway: 'Every pixel gets a learned class.', caption: 'A semantic model assigns labels such as person or bus. Pixels in different objects of the same class share the same class ID.', note: 'These colors illustrate class labels. They are neither model output nor instance IDs.' },
}
