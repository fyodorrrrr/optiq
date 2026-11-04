import type { LearningConcept } from '../../components/lab/ConceptDiagram'
import type { Section } from './content'

export const learningConcepts: Record<Section, LearningConcept> = {
  eigenfaces: { takeaway: 'Pixels become weights on shared patterns.', caption: 'PCA subtracts the training mean, then projects each face onto learned directions of variation. The resulting weights are a smaller representation.', note: 'This signed grid is a schematic component, not an eigenface computed from LFW.' },
  variance: { takeaway: 'Retained variation is not recognition accuracy.', caption: 'Each additional component retains more training variation. A cumulative curve shows how much is represented by the first k components.', note: 'This curve is illustrative. Use the measured curve above to find this dataset’s 90% threshold.' },
  recognition: { takeaway: 'Fit on training faces; predict held-out faces.', caption: 'Training faces fit the PCA projection and SVM. Held-out faces pass through those fitted models without changing them.', note: 'Test labels are used to evaluate predictions, never to fit either model.' },
  failures: { takeaway: 'Compare the predicted label with the actual label.', caption: 'A mismatch identifies a failure to inspect. Pose, lighting, and expression are possible explanations to investigate, not proven causes.', note: 'The example labels are illustrative and do not represent a measured prediction.' },
}
