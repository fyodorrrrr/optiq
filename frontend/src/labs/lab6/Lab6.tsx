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
import SourceActions from '../../components/lab/SourceActions'
import LabButton from '../../components/lab/LabButton'
import LabGuide from '../../components/lab/LabGuide'
import { NumberField, SelectField } from '../../components/lab/Fields'
import { LabError, LabStatus } from '../../components/lab/LabFeedback'
import CameraCapture from './CameraCapture'
import DatasetView from './DatasetView'
import TrainingView from './TrainingView'
import useDetectionExperiment from './useDetectionExperiment'
import { sections, pythonExample } from './content'
import type { Section } from './content'
import type { Model } from './api'
import './Lab6.css'

export default function Lab6() {
  const lab = useDetectionExperiment()
  const [section, setSection] = useState<Section>('detect')
  const [cameraRunning, setCameraRunning] = useState(false)
  const guide = useRef<HTMLElement>(null)
  const content = sections[section]
  const available = lab.status?.models.find(item => item.id === lab.model)?.available ?? false
  const stale = lab.result && (lab.result.parameters.model !== lab.model || lab.result.parameters.confidence !== Number(lab.confidence))
  return <LabPage labNumber={6} title="See objects, not just pixels."
    description="Lab 6 — Object detection. Locate objects, explore confidence, and review your custom training."
    guideId="detection-guide" onOpenGuide={() => guide.current?.focus({ preventScroll: true })} wide
    actions={section === 'detect' && <SourceActions busy={lab.busy || cameraRunning} onUpload={lab.upload} onSample={lab.sample} samples={[
      ...(lab.status?.sample_available ? [{ value: 'bus' as const, label: 'Bus', description: 'Pretrained detection sample' }] : []),
      ...(lab.status?.bottle_sample_available ? [{ value: 'bottle' as const, label: 'Bottle', description: lab.status.bottle_sample_split === 'val' ? 'Custom model · validation sample' : 'Bottle detection sample' }] : []),
    ]} />}>
    <LabWorkspace label="Object detection workspace" resultsId="detection-results" busy={lab.busy}
      tools={<ToolSidebar<Section> value={section} onChange={setSection} tools={(Object.keys(sections) as Section[]).map(id => ({ id, label: sections[id].title,
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={sections[id].icon} /></svg>,
      }))} />}
      details={[
        section === 'detect' && (lab.source || lab.result) && { id: 'image', title: 'Image details', content: <ImageMetadata highlightChanges images={[
          ...(lab.source && !lab.resultCamera ? [{ label: 'Original', frame: lab.source.frame }] : []),
          ...(lab.result ? [{ label: 'Result', frame: lab.result.output }] : []),
        ]} /> },
        section === 'detect' && lab.result && { id: 'run', title: 'Run details', content: <RunMetadata previous={Boolean(stale || lab.busy)} value={{ parameters: lab.result.parameters, provenance: lab.result.provenance, stages_ms: lab.result.stages_ms }} /> }
      ]}
      controls={section === 'detect' ? <><h2>{content.title}</h2>
        {section === 'detect' && <form onSubmit={event => { event.preventDefault(); void lab.run() }}><SelectField label="Detection model" value={lab.model} onChange={value => lab.changeModel(value as Model)} options={(lab.status?.models ?? [{ id: 'pretrained', title: 'YOLO11n · pretrained COCO', available: false }]).map(model => ({ value: model.id, label: `${model.id === 'pretrained' ? 'YOLO11n · COCO' : 'Custom model'}${model.available ? '' : ' · unavailable'}`, disabled: !model.available }))} />
          <NumberField label="Confidence threshold" value={lab.confidence} min={0.01} max={1} step="any" onChange={lab.changeConfidence} disabled={cameraRunning} />
          <div className="detection-actions"><LabButton variant="primary" type="submit" disabled={lab.busy || cameraRunning || !lab.source || !available}>Detect objects</LabButton></div></form>}
        <LabButton variant="quiet" disabled={lab.busy || cameraRunning} onClick={() => void lab.refresh()}>Refresh status</LabButton>
        <SettingsHelpLink guideId="detection-guide" onOpen={() => guide.current?.querySelector<HTMLButtonElement>('.learning-canvas-link')?.click()} />
</> : null}>
      {lab.statusError && <LabError title={lab.status ? 'Could not refresh status. Showing previous data.' : 'Could not load lab status.'} message={lab.statusError} />}
      {section === 'detect' && lab.error && <LabError title="Could not process the image." message={lab.error} />}
      {section === 'detect' && <>
        {!available && !lab.error && !lab.statusError && <p className="detection-notice" role="status">{lab.status?.models.find(item => item.id === lab.model)?.message ?? 'Checking detector setup…'}</p>}
        <div className={cameraRunning || lab.resultCamera ? undefined : 'lab-image-grid'}>
          {!cameraRunning && !lab.resultCamera && <ImagePanel title="Input image" frame={lab.source?.frame ?? null} description={lab.source?.name} showMetadata={false} />}
          <ImagePanel title="Detected objects" frame={lab.result?.output ?? null} showMetadata={false} empty="Run detection to see real boxes, labels, and confidence scores." description={lab.result ? `${stale ? 'Previous result · ' : ''}${lab.resultCamera ? 'Camera frame · ' : ''}${lab.result.detections.length} detections · confidence ≥ ${lab.result.parameters.confidence} · ${lab.result.parameters.model} model` : undefined} />
        </div>
        {!lab.error && <LabStatus>{lab.busy ? 'Processing…' : lab.result ? `${stale ? 'Previous result. ' : ''}Last frame: ${lab.result.elapsed_ms.toFixed(0)} ms server processing · ${lab.roundtrip?.toFixed(0)} ms request round trip. These are timings, not an accuracy measure.` : 'Choose an image or start the camera, then run detection to see boxes, labels, and confidence scores.'}</LabStatus>}
        {lab.result && <>
          {lab.result.detections.length === 0 ? <p>No objects met this threshold. Try a lower confidence or an image containing the model’s supported classes.</p> : <details><summary>Detection details ({lab.result.detections.length})</summary><div className="detection-table" tabIndex={0} role="region" aria-label="Detected objects"><table><caption>Boxes in original input pixels · x1, y1, x2, y2</caption><thead><tr><th>Object</th><th>Confidence</th><th>Box coordinates</th></tr></thead><tbody>{lab.result.detections.map((item, index) => <tr key={index}><th scope="row">{item.label}</th><td>{(item.confidence * 100).toFixed(1)}%</td><td>{item.xyxy.map(value => value.toFixed(1)).join(', ')}</td></tr>)}</tbody></table></div></details>}
          <div className="detection-actions lab-downloads"><DownloadLink href={lab.result.output.image} download="optiq-lab6-detections.png">Detection PNG</DownloadLink><DownloadLink href={`data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify({ ...lab.result, output: undefined }, null, 2))}`} download="optiq-lab6-detections.json">Detection JSON</DownloadLink></div>

        </>}
        <CameraCapture available={available && !lab.busy} onFrame={file => lab.run(file, true)} onStop={lab.cancel} onRunning={setCameraRunning} />
      </>}
      {section === 'dataset' && <DatasetView dataset={lab.status?.dataset} loading={lab.statusBusy} unavailable={Boolean(lab.statusError)} actions={<LabButton disabled={lab.busy} onClick={() => void lab.refresh()}>Refresh status</LabButton>} />}
      {section === 'training' && <TrainingView status={lab.status} loading={lab.statusBusy} unavailable={Boolean(lab.statusError)} actions={<LabButton disabled={lab.busy} onClick={() => void lab.refresh()}>Refresh status</LabButton>} />}
    </LabWorkspace>
    <LabGuide id="detection-guide" ref={guide} key={section} title={content.heading} concept={learningConcepts[section]} visual={<LearningFigure section={section} />} settingsHelp={<> <p>Higher thresholds retain fewer detections. Lower thresholds can reveal more candidates, including incorrect detections. Confidence scores do not guarantee correctness.</p> </>}><div className="lab-canvas-reading"><article><h3>{content.heading}</h3><p>{content.explanation}</p><section><h3>Connect it to Python</h3><pre tabIndex={0} aria-label="Python implementation"><code>{pythonExample}</code></pre></section></article><article><h3>What to compare</h3><p>Use the same image at two confidence thresholds. Inspect retained and missed objects; compare pretrained and custom models only within their supported classes. A high score is not evidence that a box is correct.</p></article></div>
      <details className="lab-preprocessing"><summary>Input handling & limitations</summary><ul><li>Image uploads are not retained. Model weights, explicit sample downloads, and local training artifacts stay on the server.</li><li>Camera access requires localhost or HTTPS. Stop the camera or leave this view to release it. Frames are resized to at most 640px and processed sequentially, with at most two requests per second.</li><li>Inference uses CPU, image size 640, IoU threshold 0.7, and at most 100 detections. Boxes are mapped to original input pixels. No custom model is fabricated when weights are missing.</li><li>Model scores and observed speed are not measured detection accuracy. Custom evaluation displays its actual validation or test split.</li><li>The activity filename says YOLOv8; the body specifies YOLO11. This module follows the body using yolo11n.pt.</li></ul></details>
    </LabGuide>
  </LabPage>
}
