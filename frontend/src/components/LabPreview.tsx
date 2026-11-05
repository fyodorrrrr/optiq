import before6 from '../assets/lab-previews/lab-6-before.webp'
import after6 from '../assets/lab-previews/lab-6-after.webp'
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
import eigenfaces from '../assets/lab-previews/lab-5.webp'
import detection from '../assets/lab-previews/lab-6.webp'
import segmentation from '../assets/lab-previews/lab-7.webp'

const previews: Record<number, { image: string; caption: string; alt: string }> = {
  1: { image: pixels, caption: 'Color → grayscale', alt: 'The generated color-shapes sample beside its grayscale conversion.' },
  2: { image: edges, caption: 'Canny edge detection', alt: 'The grayscale shapes sample beside its computed Canny edge map.' },
  3: { image: contrast, caption: 'Histogram equalization', alt: 'Low-contrast and equalized samples, with their measured intensity histograms below.' },
  4: { image: features, caption: 'SIFT feature matches', alt: 'Computed SIFT candidate matches connecting a sample pattern to its rotated version.' },
  5: { image: eigenfaces, caption: 'The first six eigenfaces', alt: 'The first six PCA components fitted on training faces from the LFW dataset.' },
  6: { image: detection, caption: 'Pretrained YOLO11n detections', alt: 'The bus demonstration photograph with computed pretrained object boxes and labels.' },
  7: { image: segmentation, caption: 'Watershed regions', alt: 'Touching circles beside their computed watershed region overlay.' },
}

const comparisons: Record<number, [string, string]> = { 1: [before1, after1], 2: [before2, after2], 3: [before3, after3], 6: [before6, after6], 7: [before7, after7] }

export default function LabPreview({ lab, compact = false }: { lab: (typeof labs)[number]; compact?: boolean }) {
  const preview = previews[lab.id]

  return <section className="lab-detail" id="lab-details" aria-labelledby="lab-preview-title" aria-live="polite" aria-atomic="true">
    <div className="lab-preview-content" key={lab.id}>
    <div className="preview-heading-slot">
      {labs.map(item => <span className="detail-heading preview-measure" aria-hidden="true" key={item.id}>Lab {item.id} · {item.title}</span>)}
      <h3 className="detail-heading" id="lab-preview-title">Lab {lab.id} · {lab.title}</h3>
    </div>
    {!compact && <figure className="lab-preview-figure" data-lab={lab.id}>
      {comparisons[lab.id]
        ? <PreviewComparison key={lab.id} before={comparisons[lab.id][0]} after={comparisons[lab.id][1]} description={preview.alt} />
        : <div className="lab-preview-static-stage"><div className="lab-preview-static-card">
          <img src={preview.image} alt={preview.alt} width="640" height={lab.id === 4 ? 240 : 350} loading="lazy" decoding="async" />
        </div></div>}
      <figcaption>{preview.caption}</figcaption>
    </figure>}
    <div className="preview-copy-slot">
      {labs.map(item => <p className="detail-copy preview-measure" aria-hidden="true" key={item.id}>{item.description}</p>)}
      <p className="detail-copy">{lab.description}</p>
    </div>
    <div className="detail-action"><a className="button" href={lab.href}>Open lab <span aria-hidden="true">→</span></a></div>
    </div>
  </section>
}
