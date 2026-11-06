import { inputLimitsFor, maxImagePixels } from '../../api/profile'
import RunMetadata from '../../components/lab/RunMetadata'
import ImageMetadata, { ImageMetadataHelp } from '../../components/lab/ImageMetadata'
import LearningFigure from './LearningFigure'
import { learningConcepts } from './learningContent'
import DownloadLink from '../../components/lab/DownloadLink'
import { useRef } from 'react'
import LabPage from '../../components/lab/LabPage'
import LabWorkspace from '../../components/lab/LabWorkspace'
import ToolSidebar from '../../components/lab/ToolSidebar'
import SourceActions from '../../components/lab/SourceActions'
import ImagePanel from '../../components/lab/ImagePanel'
import LabGuide from '../../components/lab/LabGuide'
import { LabError, LabStatus } from '../../components/lab/LabFeedback'
import SegmentationControls from './SegmentationControls'
import useSegmentation from './useSegmentation'
import SemanticDemo from './SemanticDemo'
import { sections, pythonExample } from './content'
import type { Method } from './api'
import './Lab7.css'
const parameterKeys = {
  threshold: ['method', 'invert', 'adaptive_block', 'adaptive_c'],
  region: ['method', 'invert', 'seed_x', 'seed_y', 'tolerance', 'watershed_fraction', 'opacity'],
  edges: ['method', 'canny_low', 'canny_high', 'closing_size', 'min_area', 'opacity'],
  semantic: ['method', 'opacity'],
} as const

const inputLimits = inputLimitsFor(Math.min(maxImagePixels, 1_000_000))

export default function Lab7() {
  const lab = useSegmentation()
  const guide = useRef<HTMLElement>(null)
  const content = sections[lab.method]
  const result = lab.result
  if (lab.method === 'semantic') return <SemanticDemo onChoose={lab.choose} />
  return <LabPage labNumber={7} title="Give each pixel a place."
    description="Lab 7 — Segmentation. Run classical methods on your images and inspect saved semantic predictions."
    guideId="segmentation-guide" onOpenGuide={() => guide.current?.focus({ preventScroll: true })} wide
    actions={<SourceActions busy={lab.busy} onUpload={lab.upload} onSample={lab.sample} samples={[
      { value: 'mascot', label: 'Optiq mascot', description: 'Separate the dark mascot from its light background.' },
      { value: 'touching', label: 'Touching objects', description: 'Compare one foreground mask with separated watershed regions.' },
      { value: 'uneven', label: 'Uneven lighting', description: 'Compare a global threshold with local neighborhoods.' },
      { value: 'contours', label: 'Closed contours', description: 'Turn boundaries into filled regions.' },
      { value: 'scene', label: 'Natural scene', description: 'Photographic input for the live classical methods.' },
    ]} />}>
    <LabWorkspace label="Segmentation workspace" resultsId="segmentation-results" busy={lab.busy}
      tools={<ToolSidebar<Method> value={lab.method} onChange={lab.choose} tools={(Object.keys(sections) as Method[]).map(id => ({ id, label: sections[id].title,
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={sections[id].icon} /></svg>,
      }))} />}
      details={[
        lab.source && { id: 'image', title: 'Image details', content: <>
          <ImageMetadata showHelp={false} images={[{ label: 'Original', frame: lab.source.frame }]} />
          {result && <section><h3>Outputs</h3><ImageMetadata showHelp={false} caption="Output image properties"
            images={result.views.map(view => ({ label: view.title, frame: view.frame }))} /></section>}
          <ImageMetadataHelp />
        </> },
        result && { id: 'run', title: 'Run details', content: <RunMetadata previous={lab.stale || lab.busy} parameterKeys={parameterKeys[result.parameters.method]} value={{ parameters: result.parameters, measurements: result.measurements, provenance: result.provenance, notes: result.notes }} /> }
      ]}
      controls={<><h2>{content.title}</h2><SegmentationControls lab={lab} /></>}>
      {lab.error && <LabError title="Could not segment this image." message={lab.error} />}
      {result && <h2 className="segmentation-result-title" id="segmentation-output-title">{sections[result.parameters.method].title} results</h2>}
      <div className={`lab-image-grid segmentation-comparison${result ? ' has-result' : ''}`}>
        <ImagePanel title="Input image" frame={lab.source?.frame ?? null} showMetadata={false} description={lab.method === 'region' ? `${lab.source?.name ?? ''} · click to select a seed, or enter x/y coordinates.` : lab.source?.name}
          onPick={lab.method === 'region' ? lab.seed : undefined} selection={lab.method === 'region' ? { x: Number(lab.draft.seed_x), y: Number(lab.draft.seed_y) } : undefined} />
        {result?.views[0] && <ImagePanel title={result.views[0].title} frame={result.views[0].frame} description={result.views[0].description} showMetadata={false} />}
      </div>
      {!lab.error && (lab.busy || result) && <LabStatus>{lab.busy ? 'Processing the image…' : result ? `${lab.stale ? 'Previous result · settings have changed. ' : ''}${sections[result.parameters.method].title} · ${result.measurements.elapsed_ms.toFixed(0)} ms, including result encoding and any first model load.` : null}</LabStatus>}
      {result && <section className="segmentation-output" aria-labelledby="segmentation-output-title">
        {result.views.length > 1 && <div className="lab-image-grid segmentation-secondary">{result.views.slice(1).map(view => <ImagePanel key={view.title} title={view.title} frame={view.frame} description={view.description} showMetadata={false} />)}</div>}
        {result.legend.length > 0 && <section aria-labelledby="segmentation-legend-title"><h3 id="segmentation-legend-title">Predicted classes</h3><ul className="segmentation-legend">{result.legend.map(item => <li key={item.id}><span aria-hidden="true" style={{ background: item.color }} />{item.name === '__background__' ? 'Background' : item.name} · ID {item.id} · {item.pixels.toLocaleString()} pixels</li>)}</ul></section>}
        <p>IoU is unavailable because no compatible ground-truth mask was provided. Masks, pixel counts, and region colors are not accuracy scores.</p>
        <div className="segmentation-actions lab-downloads">{result.views.map((view, index) => <DownloadLink key={view.title} href={view.frame.image} download={`optiq-lab7-${result.parameters.method}-${index + 1}.png`}>{view.title} PNG</DownloadLink>)}
          {result.labels_png && <DownloadLink href={result.labels_png} download={`optiq-lab7-${result.parameters.method}-labels.png`}>Raw label IDs PNG</DownloadLink>}
          <DownloadLink href={`data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify({ ...result, views: undefined, labels_png: undefined }, null, 2))}`} download="optiq-lab7-measurements.json">Measurements JSON</DownloadLink></div>

      </section>}
    </LabWorkspace>
    <LabGuide id="segmentation-guide" ref={guide} key={lab.method} title={content.heading} concept={learningConcepts[lab.method]} visual={<LearningFigure section={lab.method} />}><div className="lab-canvas-reading"><article><h3>{content.heading}</h3><p>{content.explanation}</p><section><h3>Connect it to Python</h3><pre tabIndex={0} aria-label="Python implementation"><code>{pythonExample}</code></pre></section></article><article><h3>Processing tradeoffs</h3><p>{content.cost}</p><p>Compare the same input across the three classical methods. Semantic classes uses fixed recorded samples.</p></article></div>
      <details className="lab-preprocessing"><summary>Input handling & reproducibility</summary><ul><li>{inputLimits}</li><li>Classical methods convert color inputs to grayscale. Transparency is composited onto white; EXIF orientation is not applied.</li><li>Seed coordinates are zero-based, x moves right and y down. Fixed-range growing compares with seed intensity and uses 4-connectivity.</li><li>Watershed uses Otsu foreground, opening3×3 twice, distance-transform peaks, and dilated background markers. Colors denote region IDs; red boundaries are not an object class.</li><li>Raw watershed PNG:0 boundary/unassigned,1 background,2+ regions (uint16). Display colors are not the raw label values.</li>{lab.source?.frame.notes.map(note => <li key={note}>{note}</li>)}</ul></details>
    </LabGuide>
  </LabPage>
}
