import type { LearningConcept } from '../../components/lab/ConceptDiagram'
import type { Section } from './content'

export const learningConcepts: Record<Section, LearningConcept> = {
  compare: { takeaway: 'Match neighborhoods, not just coordinates.', caption: 'A keypoint identifies a distinctive location. A descriptor summarizes its neighborhood so a similar feature can be found in another image.', note: 'Lines show illustrative candidate matches; match counts alone do not prove correctness.' },
  surf: { takeaway: 'Keep stronger local structures.', caption: 'SURF uses Hessian-based responses to locate features. Raising the threshold generally retains fewer keypoints before the feature budget is applied.', note: 'Upright mode skips orientation estimation, giving up rotation invariance.' },
  sift: { takeaway: 'Describe a feature at its own scale.', caption: 'SIFT finds distinctive structures across scales and describes local gradient orientations. The descriptor can match a neighborhood even when its size changes.', note: 'The default descriptor has 128 floating-point values and uses L2 distance.' },
  orb: { takeaway: 'Compare bits using Hamming distance.', caption: 'ORB describes a neighborhood with binary tests. Hamming distance counts how many bits disagree between two descriptors.', note: 'These four-bit fragments differ in one bit. Real default ORB descriptors contain 256 bits.' },
}
