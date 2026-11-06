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
import pixels from '../assets/lab-previews/lab-1.webp'
import edges from '../assets/lab-previews/lab-2.webp'
import contrast from '../assets/lab-previews/lab-3.webp'
import features from '../assets/lab-previews/lab-4.webp'
import eigenfaces from '../assets/lab-previews/illustrations/lab5.webp'
import detection from '../assets/lab-previews/illustrations/lab6.webp'
import segmentation from '../assets/lab-previews/lab-7.webp'

const previews: Record<number, { image: string; caption: string; alt: string; illustration?: boolean }> = {
  1: { image: pixels, caption: 'Mascot · color → grayscale', alt: 'The emerald Optiq mascot beside its computed grayscale conversion.' },
  2: { image: edges, caption: 'Mascot · Canny edges', alt: 'The grayscale Optiq mascot beside its computed Canny edge map.' },
  3: { image: contrast, caption: 'Mascot · histogram equalization', alt: 'The low-contrast mascot beside its equalized result, with measured histograms in the thumbnail.' },
  4: { image: features, caption: 'Mascot · SIFT matches', alt: 'Computed SIFT candidate matches connecting the mascot to its rotated and scaled view.' },
  5: { image: eigenfaces, caption: 'PCA patterns · illustration', alt: 'Concept illustration: the mascot compares colored pixels with grayscale variation patterns. These are not computed eigenfaces.', illustration: true },
  6: { image: detection, caption: '“glass” detection · illustration', alt: 'Concept illustration: a box labeled glass surrounds the mascot. This is not a model prediction.', illustration: true },
  7: { image: segmentation, caption: 'Mascot · watershed regions', alt: 'The Optiq mascot beside its computed watershed region overlay; colors identify regions, not learned classes.' },
}

const comparisons: Record<number, [string, string]> = { 1: [before1, after1], 2: [before2, after2], 3: [before3, after3], 7: [before7, after7] }

export default function LabPreview({ lab, compact = false, onNext }: { lab: (typeof labs)[number]; compact?: boolean; onNext: () => void }) {
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
        : compact ? <img className="lab-preview-thumbnail" src={preview.image} alt={preview.alt} width="640" height="480" loading="lazy" decoding="async" /> : <div className="lab-preview-static-stage"><div className={`lab-preview-static-card${preview.illustration ? ' lab-preview-illustration' : ''}`}>
          <img src={preview.image} alt={preview.alt} width="640" height={preview.illustration ? 480 : 240} loading="lazy" decoding="async" />
        </div></div>}
    </figure>
    <div className="preview-copy-slot">
      {labs.map(item => <p className="detail-copy preview-measure" aria-hidden="true" key={item.id}>{item.description}</p>)}
      <p className="detail-copy">{lab.description}</p>
    </div>
    </div>
    <div className="detail-action"><Link className="button" to={lab.href}>Open lab <span aria-hidden="true">→</span></Link><button className="preview-next" type="button" onClick={onNext} aria-label="Show next lab preview">Next preview <span aria-hidden="true">→</span></button></div>
  </section>
}
