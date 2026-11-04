import type { LearningConcept } from '../../components/lab/ConceptDiagram'
import type { Section } from './content'

export const learningConcepts: Record<Section, LearningConcept> = {
  compare: { takeaway: 'Read the image and its histogram together.', caption: 'A narrow brightness range can hide differences. Spreading values can make differences clearer, but it cannot recover missing information.', note: 'The bars illustrate distributions, not measurements from the selected image.' },
  equalize: { takeaway: 'One brightness mapping applies everywhere.', caption: 'Global equalization uses the cumulative brightness distribution to remap every pixel with the same input intensity in the same way.', note: 'A wider distribution is possible; a perfectly flat histogram is not guaranteed.' },
  clahe: { takeaway: 'Adapt the mapping to the neighborhood.', caption: 'CLAHE builds local mappings in tiles, limits histogram peaks, and blends the mappings to avoid abrupt tile boundaries.', note: 'The tile grid is a processing guide, not a grid that should appear in the result.' },
  linear: { takeaway: 'Scale the spread, then shift the brightness.', caption: 'Linear adjustment computes α × intensity + β, rounds, and clips to 0–255. Values pushed beyond the endpoints lose their differences.', note: 'Here α = 2 and β = −80: 40 maps to 0, 100 to 120, and 200 clips to 255.' },
}
