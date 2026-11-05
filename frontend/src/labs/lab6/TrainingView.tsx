import type { ReactNode } from 'react'
import { apiUrl } from '../../api/transport'
import DownloadLink from '../../components/lab/DownloadLink'
import InfoDetails from '../../components/lab/InfoDetails'
import RunMetadata from '../../components/lab/RunMetadata'
import { LabError, LabStatus } from '../../components/lab/LabFeedback'
import TrainingLoss from './TrainingLoss'
import type { Status } from './api'

export default function TrainingView({ status, loading, unavailable, actions, recorded = false, trainingLogUrl }: {
  status: Status | null; loading: boolean; unavailable: boolean; actions: ReactNode; recorded?: boolean; trainingLogUrl?: string
}) {
  const training = status?.training
  const evaluation = status?.evaluation
  const matchesDataset = Boolean(status?.dataset.sha256 && status.dataset.sha256 === training?.dataset_sha256)
  const dataset = matchesDataset ? status?.dataset : undefined
  const splits = dataset?.splits
  const photos = splits ? Object.values(splits).reduce((total, split) => total + split.images, 0) : null
  const evaluated = splits?.[training?.evaluation_split ?? 'val']?.images
  const completed = training?.status === 'completed'
  const history = training?.history ?? []
  const names = dataset?.names ?? []
  const sampleSplit = status?.bottle_sample_split
  return <section className="detection-training">
    <div className="detection-section-heading"><h2>Training & evaluation</h2>{actions}</div>
    {!training && loading && <LabStatus>{recorded ? 'Loading recorded training…' : 'Checking training status…'}</LabStatus>}
    {!training && unavailable ? null : training && <>
      {['failed', 'invalid'].includes(training.status) ? <LabError title="Training did not complete." message={training.message} />
        : <LabStatus>{completed ? `${training.epochs_completed} epochs completed · ${training.baseline ? '100-epoch baseline' : 'Exploratory run'}` : training.status === 'running' ? 'Local training is running.' : 'No custom training run yet.'}</LabStatus>}
      {completed && <>
        <div className="detection-table"><table><caption>About this model</caption><tbody>
          {names.length > 0 && <tr><th scope="row">Detects</th><td>{names.length === 1 && names[0] === 'bottle' ? 'Bottles only' : names.join(' · ')}</td></tr>}
          <tr><th scope="row">Model</th><td>YOLO11n, fine-tuned from pretrained weights</td></tr>
          {photos !== null && <tr><th scope="row">Dataset</th><td>{photos} {dataset?.reviewed_images === photos ? 'reviewed photos' : 'photos'}</td></tr>}
          {splits?.train && <tr><th scope="row">Training</th><td>{splits.train.images} images</td></tr>}
          <tr><th scope="row">{training.evaluation_split === 'test' ? 'Test evaluation' : 'Validation'}</th><td>{evaluated !== undefined ? `${evaluated} images` : 'Recorded in training details'}</td></tr>
        </tbody></table></div>
        {sampleSplit && <p>The bottle sample was used for {sampleSplit === 'val' ? 'validation' : sampleSplit === 'train' ? 'training' : 'test evaluation'}. {recorded ? 'These saved detections are demonstrations, not independent test evidence.' : 'Try your own photos to explore how the model behaves.'}</p>}
        {training.metrics && <div className="detection-table"><table>
          <caption>Evaluation{evaluation?.review_status === 'pending_user_review' ? ' · test labels awaiting review' : ''}</caption>
          <thead><tr><th scope="col">Metric</th><th scope="col">{training.evaluation_split === 'test' ? 'Test' : 'Validation'}{evaluated !== undefined ? ` · ${evaluated} images` : ''}</th>{evaluation && <th scope="col">Test · {evaluation.images} images</th>}</tr></thead>
          <tbody>{Object.entries(training.metrics).map(([key, value]) => <tr key={key}>
            <th scope="row">{{ precision: 'Precision', recall: 'Recall', map50: 'mAP@50', map50_95: 'mAP@50–95' }[key]}</th>
            <td>{(value * 100).toFixed(1)}%</td>
            {evaluation && <td>{(evaluation.metrics[key as keyof typeof evaluation.metrics] * 100).toFixed(1)}%</td>}
          </tr>)}</tbody>
        </table></div>}
        {history.length > 0 && <TrainingLoss history={history} />}
      </>}
      <div className="detection-reference-actions">
        {completed && <InfoDetails title="Training details"><RunMetadata value={{ parameters: training.parameters, provenance: {
          evaluation_split: training.evaluation_split, dataset_sha256: training.dataset_sha256, weight_sha256: training.weight_sha256,
          started_utc: training.started_utc, completed_utc: training.completed_utc, ultralytics: training.ultralytics, torch: training.torch,
        } }} /></InfoDetails>}
        {evaluation && <InfoDetails title="Test details"><RunMetadata value={{ parameters: evaluation.parameters, provenance: {
          split: evaluation.evaluation_split, images: evaluation.images, objects: evaluation.objects,
          label_review: evaluation.review_status, completed_utc: evaluation.completed_utc,
          dataset_sha256: evaluation.dataset_sha256, weight_sha256: evaluation.weight_sha256,
        } }} /></InfoDetails>}
        {training.status !== 'running' && <InfoDetails title="Local commands"><ol><li>Collect and annotate objects in YOLO format.</li><li>Validate the dataset.</li><li>{recorded ? 'Use the full-local version to train and inspect a new run.' : 'Train locally, then refresh status.'}</li></ol><pre tabIndex={0} aria-label="Local training commands"><code>{`# Replace the dataset path. Run from the repository root.\nbackend/.venv/bin/python backend/scripts/train_yolo.py \\\n  --data /path/to/dataset/data.yaml --validate-only\n\n# Source baseline: 100 epochs at 640px\nbackend/.venv/bin/python backend/scripts/train_yolo.py \\\n  --data /path/to/dataset/data.yaml --epochs 100 --batch 4 --name baseline`}</code></pre><p>CPU is the default. Use --split test only with a separate test split.</p></InfoDetails>}
        {status?.training_log_available && (!recorded || trainingLogUrl) && <DownloadLink href={trainingLogUrl ?? apiUrl('/api/labs/6/artifacts/log')} download>Training log</DownloadLink>}
        {evaluation && <DownloadLink href={`data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(evaluation, null, 2))}`} download="optiq-lab6-test.json">Test JSON</DownloadLink>}
        {completed && <DownloadLink href={`data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(training, null, 2))}`} download="optiq-lab6-training.json">Training JSON</DownloadLink>}
      </div>
    </>}
  </section>
}
