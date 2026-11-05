import type { ReactNode } from 'react'
import InfoDetails from '../../components/lab/InfoDetails'
import RunMetadata from '../../components/lab/RunMetadata'
import { LabStatus } from '../../components/lab/LabFeedback'
import type { Dataset } from './api'

export default function DatasetView({ dataset, loading, unavailable, actions, recorded = false }: {
  dataset?: Dataset; loading: boolean; unavailable: boolean; actions: ReactNode; recorded?: boolean
}) {
  const count = Object.values(dataset?.splits ?? {}).reduce((sum, split) => sum + split.images, 0)
  return <section className="detection-reference">
    <div className="detection-section-heading"><h2>Dataset</h2>{actions}</div>
    {!dataset && loading && <LabStatus>{recorded ? 'Loading recorded dataset…' : 'Checking dataset…'}</LabStatus>}
    {!dataset && unavailable ? null : dataset?.ready ? <>
      <p>{dataset.names?.join(' · ')} · {count} {dataset.reviewed_images === count ? 'reviewed photos' : 'photos'}</p>
      <div className="detection-table detection-dataset-counts"><table><caption className="sr-only">Dataset split counts</caption><thead><tr><th scope="col">Split</th><th scope="col">Images</th><th scope="col">Objects</th><th scope="col">Backgrounds</th></tr></thead><tbody>
        {Object.entries(dataset.splits ?? {}).map(([split, counts]) => <tr key={split}><th scope="row">{{ train: 'Training', val: 'Validation', test: 'Test' }[split] ?? split}</th><td>{counts.images}</td><td>{counts.objects}</td><td>{counts.backgrounds}</td></tr>)}
      </tbody></table></div>
    </> : !loading && <p>{dataset?.message ?? 'No custom dataset has been validated yet.'}</p>}
    <div className="detection-reference-actions">
      {dataset?.ready && <InfoDetails title="Dataset details"><RunMetadata value={{ classes: dataset.names, dataset_sha256: dataset.sha256, notes: dataset.message }} /></InfoDetails>}
      <InfoDetails title="YOLO labels & folders"><p>{recorded ? 'Example YOLO layout for a dataset like the recorded one.' : 'Collect varied images, annotate each object, and keep related scenes in the same split.'}</p><pre tabIndex={0} aria-label="YOLO dataset format"><code>{`dataset/\n  data.yaml\n  images/train/    labels/train/\n  images/val/      labels/val/\n  images/test/     labels/test/  # optional independent test split\n\n# One .txt per image: class_id x_center y_center width height\n0 0.5 0.5 0.4 0.3\n\n# data.yaml: paths relative to its folder\ntrain: images/train\nval: images/val\nnames: [bottle]`}</code></pre><p>Class IDs start at 0. Divide coordinates and sizes by image dimensions. Use an empty label file for background images.</p><p>Validation checks label bounds and exact duplicates, not annotation quality or every similar scene.</p></InfoDetails>
    </div>
  </section>
}
