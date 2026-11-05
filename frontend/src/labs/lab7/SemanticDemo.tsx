import { useRef } from 'react'
import LabPage from '../../components/lab/LabPage'
import LabWorkspace from '../../components/lab/LabWorkspace'
import ToolSidebar from '../../components/lab/ToolSidebar'
import ImagePanel from '../../components/lab/ImagePanel'
import ImageMetadata, { ImageMetadataHelp } from '../../components/lab/ImageMetadata'
import RunMetadata from '../../components/lab/RunMetadata'
import LabButton from '../../components/lab/LabButton'
import LabGuide from '../../components/lab/LabGuide'
import DownloadLink from '../../components/lab/DownloadLink'
import { SelectField } from '../../components/lab/Fields'
import { LabError, LabStatus } from '../../components/lab/LabFeedback'
import useRecordedRuns from '../../hooks/useRecordedRuns'
import LearningFigure from './LearningFigure'
import { learningConcepts } from './learningContent'
import { sections, pythonExample } from './content'
import type { Method, Result } from './api'

export default function SemanticDemo({ onChoose }: { onChoose: (method: Method) => void }) {
  const lab = useRecordedRuns<Result>(7)
  const guide = useRef<HTMLElement>(null)
  const result = lab.result
  const sample = lab.selected?.sample ?? 'bus'
  const opacity = Number(lab.selected?.parameters.opacity ?? .5)
  const content = sections.semantic
  function choose(key: 'sample' | 'opacity', value: string) {
    const next = { sample, opacity, [key]: key === 'opacity' ? Number(value) : value }
    const run = lab.index?.runs.find(run => run.sample === next.sample && run.parameters.opacity === next.opacity)
    if (run) void lab.select(run.id)
  }
  return <LabPage labNumber={7} title="Give each pixel a place."
    description="Lab 7 — Segmentation. Compare brightness, connected regions, boundaries, and learned pixel classes."
    inputNote="Precomputed demonstration · Semantic results recorded from real DeepLab inference."
    guideId="segmentation-guide" onOpenGuide={() => guide.current?.focus({ preventScroll: true })} wide actions={null}>
    <LabWorkspace label="Segmentation workspace" resultsId="segmentation-results" busy={lab.busy}
      tools={<ToolSidebar<Method> value="semantic" onChange={onChoose} tools={(Object.keys(sections) as Method[]).map(id => ({ id, label: sections[id].title,
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={sections[id].icon} /></svg>,
      }))} />}
      controls={<><h2>{content.title}</h2>
        <SelectField disabled={!lab.index} label="Sample image" value={sample} onChange={value => choose('sample', value)}
          options={(lab.index?.samples ?? [{ id: 'bus', title: 'Loading saved runs…' }]).map(item => ({ value: item.id, label: item.title }))} />
        <SelectField disabled={!lab.index} label="Overlay opacity" value={String(opacity)} onChange={value => choose('opacity', value)}
          options={[.25, .5, .75].map(value => ({ value, label: `${value * 100}%` }))} />
        {lab.error && <LabButton disabled={lab.busy} onClick={() => void lab.reload()}>Reload saved runs</LabButton>}
      </>}
      details={[
        lab.source && { id: 'image', title: 'Image details', content: <>
          <ImageMetadata showHelp={false} images={[{ label: 'Original', frame: lab.source.frame }]} />
          {result && <section><h3>Outputs</h3><ImageMetadata showHelp={false} images={result.views.map(view => ({ label: view.title, frame: view.frame }))} /></section>}
          <ImageMetadataHelp /><details><summary>Sample notes</summary><ul>{lab.source.frame.notes.map(note => <li key={note}>{note}</li>)}</ul></details>
        </> },
        result && { id: 'run', title: 'Run details', content: <RunMetadata previous={lab.stale || lab.busy}
          parameterKeys={['method', 'opacity']} value={{ parameters: result.parameters, recorded_measurements: result.measurements, provenance: result.provenance, notes: result.notes }} /> },
      ]}>
      {lab.error && <LabError title="Could not load the saved run." message={lab.error} />}
      {result && <h2 className="segmentation-result-title" id="segmentation-output-title">Semantic classes results</h2>}
      <div className={`lab-image-grid segmentation-comparison${result ? ' has-result' : ''}`}>
        <ImagePanel title="Input image" frame={lab.source?.frame ?? null} description={lab.source?.title} showMetadata={false} />
        {result?.views[0] && <ImagePanel title={result.views[0].title} frame={result.views[0].frame} description={result.views[0].description} showMetadata={false} />}
      </div>
      {!lab.error && <LabStatus>{lab.busy ? 'Loading saved run…' : result ? `${lab.stale ? 'Previous saved run · ' : ''}Recorded inference · ${result.measurements.elapsed_ms.toFixed(0)} ms including result encoding. No model runs when selecting a saved result.` : null}</LabStatus>}
      {result && <section className="segmentation-output" aria-labelledby="segmentation-output-title">
        <div className="lab-image-grid segmentation-secondary">{result.views.slice(1).map(view => <ImagePanel key={view.title} title={view.title} frame={view.frame} description={view.description} showMetadata={false} />)}</div>
        <section aria-labelledby="segmentation-legend-title"><h3 id="segmentation-legend-title">Predicted classes</h3><ul className="segmentation-legend">{result.legend.map(item => <li key={item.id}><span aria-hidden="true" style={{ background: item.color }} />{item.name === '__background__' ? 'Background' : item.name} · ID {item.id} · {item.pixels.toLocaleString()} pixels</li>)}</ul></section>
        <p>IoU is unavailable because no compatible ground-truth mask was provided. Masks, pixel counts, and region colors are not accuracy scores.</p>
        <div className="segmentation-actions lab-downloads">{result.views.map((view, index) => <DownloadLink key={view.title} href={view.frame.image} download={`optiq-lab7-saved-semantic-${index + 1}.png`}>{view.title} PNG</DownloadLink>)}
          {result.labels_png && <DownloadLink href={result.labels_png} download="optiq-lab7-saved-semantic-labels.png">Raw label IDs PNG</DownloadLink>}
          <DownloadLink href={`data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify({ ...result, views: undefined, labels_png: undefined }, null, 2))}`} download="optiq-lab7-saved-measurements.json">Measurements JSON</DownloadLink></div>
      </section>}
    </LabWorkspace>
    <LabGuide id="segmentation-guide" ref={guide} title={content.heading} concept={learningConcepts.semantic} visual={<LearningFigure section="semantic" />}>
      <div className="lab-canvas-reading"><article><h3>{content.heading}</h3><p>{content.explanation}</p><section><h3>Connect it to Python</h3><pre tabIndex={0} aria-label="Python implementation"><code>{pythonExample}</code></pre></section></article><article><h3>Processing tradeoffs</h3><p>{content.cost}</p></article></div>
      <details className="lab-preprocessing"><summary>Recording & reproducibility</summary><ul>
        <li>Real DeepLab predictions were recorded locally on fixed samples resized to longest side 480. Selecting a sample or opacity loads its saved result.</li>
        <li>The checkpoint, input and source hashes, recording time, preprocessing and original compute measurements are retained in Run details and downloads.</li>
        <li>Raw labels contain VOC class IDs 0–20. Display colors are not class values or instance identities.</li>
        <li>Live semantic inference on new uploads remains available in the full-local source branch. The other three methods here still execute on the backend.</li>
      </ul></details>
    </LabGuide>
  </LabPage>
}
