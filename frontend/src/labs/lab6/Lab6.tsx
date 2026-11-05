import RunMetadata from '../../components/lab/RunMetadata'
import ImageMetadata from '../../components/lab/ImageMetadata'
import LearningFigure from './LearningFigure'
import { learningConcepts } from './learningContent'
import DownloadLink from '../../components/lab/DownloadLink'
import SettingsHelpLink from '../../components/lab/SettingsHelpLink'
import { useRef, useState } from 'react'
import LabPage from '../../components/lab/LabPage'
import LabWorkspace from '../../components/lab/LabWorkspace'
import ToolSidebar from '../../components/lab/ToolSidebar'
import ImagePanel from '../../components/lab/ImagePanel'
import LabButton from '../../components/lab/LabButton'
import LabGuide from '../../components/lab/LabGuide'
import { SelectField } from '../../components/lab/Fields'
import { LabError, LabStatus } from '../../components/lab/LabFeedback'
import useRecordedRuns from '../../hooks/useRecordedRuns'
import { recordedUrl } from '../../api/recorded'
import DatasetView from './DatasetView'
import TrainingView from './TrainingView'
import { sections, pythonExample } from './content'
import type { Section } from './content'
import type { Result, Status } from './api'
import './Lab6.css'

export default function Lab6() {
  const lab = useRecordedRuns<Result>(6)
  const [section, setSection] = useState<Section>('detect')
  const guide = useRef<HTMLElement>(null)
  const content = sections[section]
  const result = lab.result
  const status = (lab.index?.context as Status | undefined) ?? null
  const sample = lab.selected?.sample ?? 'bottle'
  const model = String(lab.selected?.parameters.model ?? 'custom')
  const confidence = Number(lab.selected?.parameters.confidence ?? .25)
  function choose(key: 'sample' | 'model' | 'confidence', value: string) {
    const next = { sample, model, confidence, [key]: key === 'confidence' ? Number(value) : value }
    const run = lab.index?.runs.find(run => run.sample === next.sample
      && run.parameters.model === next.model && run.parameters.confidence === next.confidence)
    if (run) void lab.select(run.id)
  }
  const retry = lab.error ? <LabButton disabled={lab.busy} onClick={() => void lab.reload()}>Reload saved runs</LabButton> : null
  return <LabPage labNumber={6} title="See objects, not just pixels."
    description="Lab 6 — Object detection. Locate objects, explore confidence, and review your custom training."
    inputNote="Precomputed demonstration · Results recorded from real YOLO inference and training."
    actions={null} guideId="detection-guide" onOpenGuide={() => guide.current?.focus({ preventScroll: true })} wide>
    <LabWorkspace label="Object detection workspace" resultsId="detection-results" busy={lab.busy}
      tools={<ToolSidebar<Section> value={section} onChange={setSection} tools={(Object.keys(sections) as Section[]).map(id => ({ id, label: sections[id].title,
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={sections[id].icon} /></svg>,
      }))} />}
      details={[
        section === 'detect' && lab.source && { id: 'image', title: 'Image details', content: <><ImageMetadata highlightChanges images={[
          { label: 'Original', frame: lab.source.frame }, ...(result ? [{ label: 'Result', frame: result.output }] : []),
        ]} /><details><summary>Sample notes</summary><ul>{lab.source.frame.notes.map(note => <li key={note}>{note}</li>)}</ul></details></> },
        section === 'detect' && result && { id: 'run', title: 'Run details', content: <RunMetadata previous={lab.stale || lab.busy}
          value={{ parameters: result.parameters, provenance: result.provenance, recorded_stages_ms: result.stages_ms }} /> },
      ]}
      controls={section === 'detect' ? <><h2>{content.title}</h2>
        <SelectField disabled={!lab.index} label="Sample image" value={sample} onChange={value => choose('sample', value)}
          options={(lab.index?.samples ?? [{ id: 'bottle', title: 'Loading saved runs…' }]).map(item => ({ value: item.id, label: item.title }))} />
        <SelectField disabled={!lab.index} label="Detection model" value={model} onChange={value => choose('model', value)}
          options={[{ value: 'custom', label: 'Custom model · bottles' }, { value: 'pretrained', label: 'YOLO11n · COCO' }]} />
        <SelectField disabled={!lab.index} label="Confidence threshold" value={String(confidence)} onChange={value => choose('confidence', value)}
          options={[.25, .5, .75].map(value => ({ value, label: String(value) }))} />
        {retry}<SettingsHelpLink guideId="detection-guide" />
      </> : null}>
      {lab.error && <LabError title="Could not load the saved run." message={lab.error} />}
      {section === 'detect' && <>
        <div className="lab-image-grid">
          <ImagePanel title="Input image" frame={lab.source?.frame ?? null} description={lab.source?.title} showMetadata={false} />
          <ImagePanel title="Detected objects" frame={result?.output ?? null} showMetadata={false} empty="Loading saved detections…"
            description={result ? `${lab.stale ? 'Previous saved run · ' : ''}${result.detections.length} detections · confidence ≥ ${result.parameters.confidence} · ${result.parameters.model} model` : undefined} />
        </div>
        {!lab.error && <LabStatus>{lab.busy ? 'Loading saved run…' : result ? `Recorded inference · ${result.elapsed_ms.toFixed(0)} ms. This is the original compute time, not a new prediction.` : null}</LabStatus>}
        {result && <>
          {result.detections.length === 0 ? <p>No objects met this recorded threshold.</p> : <details><summary>Detection details ({result.detections.length})</summary><div className="detection-table" tabIndex={0} role="region" aria-label="Detected objects"><table><caption>Boxes in recorded input pixels · x1, y1, x2, y2</caption><thead><tr><th scope="col">Object</th><th scope="col">Confidence</th><th scope="col">Box coordinates</th></tr></thead><tbody>{result.detections.map((item, index) => <tr key={index}><th scope="row">{item.label}</th><td>{(item.confidence * 100).toFixed(1)}%</td><td>{item.xyxy.map(value => value.toFixed(1)).join(', ')}</td></tr>)}</tbody></table></div></details>}
          <div className="detection-actions lab-downloads"><DownloadLink href={result.output.image} download="optiq-lab6-saved-detections.png">Detection PNG</DownloadLink><DownloadLink href={`data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify({ ...result, output: undefined }, null, 2))}`} download="optiq-lab6-saved-detections.json">Detection JSON</DownloadLink></div>
        </>}
      </>}
      {section === 'dataset' && <DatasetView recorded dataset={status?.dataset} loading={lab.busy} unavailable={Boolean(lab.error)} actions={retry} />}
      {section === 'training' && <TrainingView recorded status={status} loading={lab.busy} unavailable={Boolean(lab.error)} actions={retry}
        trainingLogUrl={lab.index?.training_log?.file === 'training.txt' ? recordedUrl(6, 'training.txt') : undefined} />}
    </LabWorkspace>
    <LabGuide id="detection-guide" ref={guide} key={section} title={content.heading} concept={learningConcepts[section]} visual={<LearningFigure section={section} />} settingsHelp={<> <p>Higher thresholds retain fewer detections. Lower thresholds can reveal more candidates, including incorrect detections. Confidence scores do not guarantee correctness.</p> </>}><div className="lab-canvas-reading"><article><h3>{content.heading}</h3><p>{content.explanation}</p><section><h3>Connect it to Python</h3><pre tabIndex={0} aria-label="Python implementation"><code>{pythonExample}</code></pre></section></article><article><h3>What to compare</h3><p>Use the same image at two confidence thresholds. Inspect retained and missed objects; compare pretrained and custom models only within their supported classes. A high score is not evidence that a box is correct.</p></article></div>
      <details className="lab-preprocessing"><summary>Input handling & limitations</summary><ul><li>These detections and training artifacts were recorded locally before publication. Samples were resized to a longest side of 480 before real inference. Selecting a saved run does not execute a model.</li><li>Uploads, live camera detection and custom training remain available in the full-local source branch.</li><li>Inference uses CPU, image size 640, IoU threshold 0.7, and at most 100 detections. Boxes are mapped to original input pixels. No custom model is fabricated when weights are missing.</li><li>Model scores and observed speed are not measured detection accuracy. Custom evaluation displays its actual validation or test split.</li><li>The activity filename says YOLOv8; the body specifies YOLO11. This module follows the body using yolo11n.pt.</li></ul></details>
    </LabGuide>
  </LabPage>
}
