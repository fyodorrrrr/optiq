import type { LearningConcept } from '../../components/lab/ConceptDiagram'
import type { Section } from './content'

export const learningConcepts: Record<Section, LearningConcept> = {
  detect: { takeaway: 'A box locates; a label names.', caption: 'Object detection returns locations and class scores for individual objects. Raising the confidence threshold removes lower-scored candidates.', note: 'This box and score are illustrative. Confidence is a model score, not measured accuracy.' },
  dataset: { takeaway: 'Separate scenes before training.', caption: 'Use independent scenes for training, validation, and any test split. Similar frames from the same recording can leak information across splits.', note: 'YOLO labels store class, center x/y, width, and height normalized to image dimensions.' },
  training: { takeaway: 'Training changes weights; inference reuses them.', caption: 'Local training saves model weights. The detections shown here were recorded using those weights.', note: 'This page displays a recorded training run and its actual evaluation split.' },
}
