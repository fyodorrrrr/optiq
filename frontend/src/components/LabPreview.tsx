import { Link } from 'react-router'
import before7 from '../assets/lab-previews/lab-7-before.webp'
import after7 from '../assets/lab-previews/lab-7-after.webp'
import before3 from '../assets/lab-previews/lab-3-before.webp'
import after3 from '../assets/lab-previews/lab-3-after.webp'
import before2 from '../assets/lab-previews/lab-2-before.webp'
import after2 from '../assets/lab-previews/lab-2-after.webp'
import before1 from '../assets/lab-previews/lab-1-before.webp'
import after1 from '../assets/lab-previews/lab-1-after.webp'
import PreviewComparison from './PreviewComparison'
import { labs } from '../data/labs'
import features from '../assets/lab-previews/lab-4.webp'
import eigenfaces from '../assets/lab-previews/illustrations/lab5.webp'
import detection from '../assets/lab-previews/illustrations/lab6.webp'

const previews: Record<number, { image?: string; alt: string; note?: string }> = {
  1: { alt: 'The emerald Optiq mascot, with its original colors on the left and computed grayscale conversion on the right.' },
  2: { alt: 'The grayscale Optiq mascot on the left and its computed Canny edge map on the right.' },
  3: { alt: 'The low-contrast Optiq mascot on the left and its histogram-equalized result on the right.' },
  4: { image: features, alt: 'Computed SIFT candidate matches connecting the mascot to its rotated and scaled view.' },
  5: { image: eigenfaces, alt: 'Concept illustration: the mascot compares colored pixels with grayscale variation patterns. These are not computed eigenfaces.', note: 'The preview artwork illustrates PCA; the lab contains recorded results.' },
  6: { image: detection, alt: 'Concept illustration: a box labeled glass surrounds the mascot. This is not a model prediction.', note: 'The preview artwork illustrates detection; it is not a model prediction.' },
  7: { alt: 'The original Optiq mascot on the left and its computed watershed region overlay on the right. Colors identify regions, not learned classes.' },
}

function previewDescription(lab: (typeof labs)[number]) {
  return [lab.description, previews[lab.id].note].filter(Boolean).join(' ')
}

const comparisons: Record<number, [string, string]> = { 1: [before1, after1], 2: [before2, after2], 3: [before3, after3], 7: [before7, after7] }

export default function LabPreview({ lab, onNext }: { lab: (typeof labs)[number]; onNext: () => void }) {
  const preview = previews[lab.id]

  return <section className="lab-detail" id="lab-details" aria-labelledby="lab-preview-title" aria-live="polite" aria-atomic="true">
    <div className="lab-preview-content" key={lab.id}>
    <div className="preview-heading-slot">
      {labs.map(item => <span className="detail-heading preview-measure" aria-hidden="true" key={item.id}>Lab {item.id} · {item.title}</span>)}
      <h3 className="detail-heading" id="lab-preview-title">Lab {lab.id} · {lab.title}</h3>
    </div>
    <figure className="lab-preview-figure" data-lab={lab.id}>
      {comparisons[lab.id]
        ? <PreviewComparison key={lab.id} before={comparisons[lab.id][0]} after={comparisons[lab.id][1]} description={preview.alt} />
        : <div className="lab-preview-image">
          <img src={preview.image} alt={preview.alt} width="640" height="480" loading="lazy" decoding="async" />
        </div>}
    </figure>
    <div className="preview-copy-slot">
      {labs.map(item => <p className="detail-copy preview-measure" aria-hidden="true" key={item.id}>{previewDescription(item)}</p>)}
      <p className="detail-copy">{previewDescription(lab)}</p>
    </div>
    </div>
    <div className="detail-action"><Link className="button" to={lab.href}>Open lab <span aria-hidden="true">→</span></Link><button className="preview-next" type="button" onClick={onNext} aria-label="Show next lab preview">Next preview <span aria-hidden="true">→</span></button></div>
  </section>
}
