import { Link } from 'react-router'
import lab1 from '../assets/lab-previews/illustrations/lab1.webp'
import lab2 from '../assets/lab-previews/illustrations/lab2.webp'
import lab3 from '../assets/lab-previews/illustrations/lab3.webp'
import lab4 from '../assets/lab-previews/illustrations/lab4.webp'
import lab7 from '../assets/lab-previews/illustrations/lab7.webp'
import { labs } from '../data/labs'
import eigenfaces from '../assets/lab-previews/illustrations/lab5.webp'
import detection from '../assets/lab-previews/illustrations/lab6.webp'

const previews: Record<number, { image: string; alt: string; note?: string }> = {
  1: { image: lab1, alt: 'Illustration of the Optiq mascot holding overlapping color and grayscale landscape pictures.' },
  2: { image: lab2, alt: 'Illustration of the Optiq mascot comparing a landscape with white edge outlines on black.' },
  3: { image: lab3, alt: 'Illustration of the Optiq mascot holding low-contrast and high-contrast versions of a landscape.' },
  4: { image: lab4, alt: 'Illustration of the Optiq mascot matching colored keypoints between two landscape pictures.' },
  5: { image: eigenfaces, alt: 'Concept illustration: the mascot compares colored pixels with grayscale variation patterns. These are not computed eigenfaces.', note: 'The preview artwork illustrates PCA; the lab contains recorded results.' },
  6: { image: detection, alt: 'Concept illustration: a box labeled glass surrounds the mascot. This is not a model prediction.', note: 'The preview artwork illustrates detection; it is not a model prediction.' },
  7: { image: lab7, alt: 'Illustration of the Optiq mascot holding a landscape divided into colored segmentation regions.' },
}

function previewDescription(lab: (typeof labs)[number]) {
  return [lab.description, previews[lab.id].note].filter(Boolean).join(' ')
}

export default function LabPreview({ lab, onNext }: { lab: (typeof labs)[number]; onNext: () => void }) {
  const preview = previews[lab.id]

  return <section className="lab-detail" id="lab-details" aria-labelledby="lab-preview-title" aria-live="polite" aria-atomic="true">
    <div className="lab-preview-content" key={lab.id}>
    <figure className="lab-preview-figure" data-lab={lab.id}>
      <div className="lab-preview-image">
        <img src={preview.image} alt={preview.alt} width="640" height="480" loading="lazy" decoding="async" />
      </div>
    </figure>
    <div className="preview-heading-slot">
      {labs.map(item => <span className="detail-heading preview-measure" aria-hidden="true" key={item.id}>Lab {item.id}: {item.title}</span>)}
      <h3 className="detail-heading" id="lab-preview-title">Lab {lab.id}: {lab.title}</h3>
    </div>
    <div className="preview-copy-slot">
      {labs.map(item => <p className="detail-copy preview-measure" aria-hidden="true" key={item.id}>{previewDescription(item)}</p>)}
      <p className="detail-copy">{previewDescription(lab)}</p>
    </div>
    </div>
    <div className="detail-action"><Link className="button" to={lab.href}>Open lab <span aria-hidden="true">→</span></Link><button className="preview-next" type="button" onClick={onNext} aria-label="Show next lab preview">Next preview <span aria-hidden="true">→</span></button></div>
  </section>
}
