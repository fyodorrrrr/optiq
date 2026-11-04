import type { LearningConcept } from '../../components/lab/ConceptDiagram'
import type { Section } from './content'

export const learningConcepts: Record<Section, LearningConcept> = {
  compare: { takeaway: 'Strength and boundaries tell different stories.', caption: 'Sobel describes how strongly brightness changes. Canny keeps thin, binary edges after suppressing extra responses and tracking connected edges.', note: 'Compare the actual maps above; a brighter Sobel pixel is not a confidence score.' },
  sobel: { takeaway: 'Direction matters.', caption: 'The x derivative responds to changes across columns; the y derivative responds to changes across rows. Magnitude combines both.', note: 'These simplified absolute responses illustrate direction, not exact kernel values.' },
  canny: { takeaway: 'A weak response needs a strong connection.', caption: 'After thinning, strong responses seed edges. Weaker responses survive when connected to a strong edge; isolated weak responses are discarded.', note: 'The example illustrates hysteresis. The computed Canny map contains only 0 and 255.' },
  preprocess: { takeaway: 'Less noise can also mean less detail.', caption: 'Gaussian smoothing blends nearby brightness values before either detector runs. It softens noise and small structures together.', note: 'Both detectors receive the same blurred grayscale image. A 1 × 1 kernel leaves it unchanged.' },
}
