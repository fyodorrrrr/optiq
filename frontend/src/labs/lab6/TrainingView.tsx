import DownloadLink from '../../components/lab/DownloadLink'
import type { Status } from './api'
export default function TrainingView({ status }: { status: Status | null }) {
  const training = status?.training
  const history = training?.history ?? []
  const losses = ['train/box_loss', 'train/cls_loss', 'train/dfl_loss'].filter(key => history.some(row => Number.isFinite(row[key])))
  return <section className="detection-training"><h2>Training & evaluation</h2><p>{training?.message ?? 'Checking local training artifacts…'}</p>
    {training?.status !== 'completed' && <p>Custom training is not complete. Pretrained detection is available separately; it does not replace this part of the laboratory.</p>}
    <ol><li>Collect and annotate your objects in YOLO format.</li><li>Validate the dataset with the local script.</li><li>Run training explicitly, then return here and select Refresh status.</li></ol>
    <details className="lab-preprocessing"><summary>Local commands</summary><p>Run from the repository root. Replace the example dataset path with your own.</p><pre><code>{`backend/.venv/bin/python backend/scripts/train_yolo.py \\\n  --data /path/to/dataset/data.yaml --validate-only\n\n# Short hardware check (not the full lab baseline):\nbackend/.venv/bin/python backend/scripts/train_yolo.py \\\n  --data /path/to/dataset/data.yaml --epochs 2 --batch 4 --name check\n\n# Source baseline: 100 epochs at 640px\nbackend/.venv/bin/python backend/scripts/train_yolo.py \\\n  --data /path/to/dataset/data.yaml --epochs 100 --batch 4 --name baseline`}</code></pre><p>CPU is the default. Your Mac can try --device mps if the installed PyTorch supports it. Use --split test only when data.yaml includes a separate test split.</p></details>
    {training?.status === 'completed' && <>
      <p><strong>{training.epochs_completed} epochs completed</strong> · evaluation split: {training.evaluation_split}. {training.baseline ? 'Matches the 100-epoch source baseline.' : 'Exploratory run; does not meet the 100-epoch source baseline.'}</p>
      {training.metrics && <dl className="detection-metrics">{Object.entries(training.metrics).map(([key, value]) => <div key={key}><dt>{{ precision: 'Precision', recall: 'Recall', map50: 'mAP@0.50', map50_95: 'mAP@0.50–0.95' }[key]}</dt><dd>{(value * 100).toFixed(1)}%</dd></div>)}</dl>}
      {history.length > 0 && <><h3>Recorded training loss</h3><div className="detection-chart" tabIndex={0} role="region" aria-label="Scrollable training loss chart"><svg viewBox="0 0 640 250" role="img" aria-label={`Training loss over ${history.length} recorded epochs. Exact values available below.`}>
        <path d="M45 20v190h570" fill="none" stroke="currentColor" opacity=".35" />
        {losses.map((key, index) => { const maximum = Math.max(1e-9, ...history.flatMap(row => losses.map(loss => row[loss] ?? 0))); return <polyline key={key} points={history.map((row, i) => `${45 + i / Math.max(1, history.length - 1) * 560},${210 - (row[key] ?? 0) / maximum * 180}`).join(' ')} fill="none" stroke={['#3e6451', '#76522e', '#526590'][index]} strokeWidth="2" /> })}
        <text x="45" y="235">Epoch 1</text><text x="605" y="235" textAnchor="end">Epoch {history.length}</text></svg></div><p>Green: box loss · brown: classification loss · blue: distribution focal loss. These share a linear scale. Loss is an optimization measure, not accuracy.</p></>}
      <details className="lab-preprocessing"><summary>Recorded metrics & provenance</summary><pre>{JSON.stringify(training, null, 2)}</pre></details>
    </>}
    {training && training.status !== 'pending' && <DownloadLink href="/api/labs/6/artifacts/log" download>Local training log</DownloadLink>}
  </section>
}
