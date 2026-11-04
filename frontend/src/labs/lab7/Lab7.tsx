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
import { sections, pythonExample } from './content'
import type { Method } from './api'
import './Lab7.css'
export default function Lab7() {
  const lab = useSegmentation()
  const guide = useRef<HTMLElement>(null)
  const content = sections[lab.method]
  const result = lab.result
  return <LabPage labNumber={7} title="Give each pixel a place."
    description="Lab 7 — Segmentation. Compare brightness, connected regions, boundaries, and learned pixel classes."
    guideId="segmentation-guide" onOpenGuide={() => guide.current?.focus({ preventScroll: true })} wide
    actions={<SourceActions busy={lab.busy} onUpload={lab.upload} onSample={lab.sample} samples={[
      { value: 'touching', label: 'Touching objects', description: 'Compare one foreground mask with separated watershed regions.' },
      { value: 'uneven', label: 'Uneven lighting', description: 'Compare a global threshold with local neighborhoods.' },
      { value: 'contours', label: 'Closed contours', description: 'Turn boundaries into filled regions.' },
      { value: 'scene', label: 'Natural scene', description: 'Explore pretrained pixel classes on the bus sample.' },
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
        result && { id: 'run', title: 'Run details', content: <RunMetadata value={{ parameters: result.parameters, measurements: result.measurements, provenance: result.provenance, notes: result.notes }} /> }
      ]}
      controls={<><h2>{content.title}</h2><SegmentationControls lab={lab} /></>}>
      <ImagePanel title="Input image" frame={lab.source?.frame ?? null} showMetadata={false} description={lab.method === 'region' ? `${lab.source?.name ?? ''} · click to select a seed, or enter x/y coordinates.` : lab.source?.name}
        onPick={lab.method === 'region' ? lab.seed : undefined} selection={lab.method === 'region' ? { x: Number(lab.draft.seed_x), y: Number(lab.draft.seed_y) } : undefined} />
      {lab.error && <LabError title="Could not segment this image." message={lab.error} />}
      <LabStatus>{lab.busy ? 'Processing the image…' : result ? `${lab.stale ? 'Previous result · settings have changed. ' : ''}${sections[result.parameters.method].title} · ${result.measurements.elapsed_ms.toFixed(0)} ms, including result encoding and any first model load.` : 'Choose a method, predict the result, then run segmentation.'}</LabStatus>
      {result && <section className="segmentation-output" aria-labelledby="segmentation-output-title"><h2 id="segmentation-output-title">{sections[result.parameters.method].title} results</h2>
        <div className="lab-image-grid">{result.views.map(view => <ImagePanel key={view.title} title={view.title} frame={view.frame} description={view.description} showMetadata={false} />)}</div>
        {result.legend.length > 0 && <section aria-labelledby="segmentation-legend-title"><h3 id="segmentation-legend-title">Predicted classes</h3><ul className="segmentation-legend">{result.legend.map(item => <li key={item.id}><span aria-hidden="true" style={{ background: item.color }} />{item.name === '__background__' ? 'Background' : item.name} · ID {item.id} · {item.pixels.toLocaleString()} pixels</li>)}</ul></section>}
        <p>IoU is unavailable because no compatible ground-truth mask was provided. Masks, pixel counts, and region colors are not accuracy scores.</p>
        <div className="segmentation-actions lab-downloads">{result.views.map((view, index) => <DownloadLink key={view.title} href={view.frame.image} download={`optiq-lab7-${result.parameters.method}-${index + 1}.png`}>{view.title} PNG</DownloadLink>)}
          {result.labels_png && <DownloadLink href={result.labels_png} download={`optiq-lab7-${result.parameters.method}-labels.png`}>Raw label IDs PNG</DownloadLink>}
          <DownloadLink href={`data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify({ ...result, views: undefined, labels_png: undefined }, null, 2))}`} download="optiq-lab7-measurements.json">Measurements JSON</DownloadLink></div>

      </section>}
    </LabWorkspace>
    <LabGuide id="segmentation-guide" ref={guide} key={lab.method} title={content.heading} concept={learningConcepts[lab.method]} visual={<LearningFigure section={lab.method} />}><div className="lab-canvas-reading"><article><h3>{content.heading}</h3><p>{content.explanation}</p><section><h3>Connect it to Python</h3><pre tabIndex={0} aria-label="Python implementation"><code>{pythonExample}</code></pre></section></article><article><h3>Processing tradeoffs</h3><p>{content.cost}</p><p>Try the same image with different method families. Compare boundaries and failure cases rather than assuming every foreground region is a semantic object.</p></article></div>
      <details className="lab-preprocessing"><summary>Input handling & reproducibility</summary><ul><li>Classical methods convert color inputs to grayscale. Transparency is composited onto white; EXIF orientation is not applied.</li><li>Seed coordinates are zero-based, x moves right and y down. Fixed-range growing compares with seed intensity and uses 4-connectivity.</li><li>Watershed uses Otsu foreground, opening3×3 twice, distance-transform peaks, and dilated background markers. Colors denote region IDs; red boundaries are not an object class.</li><li>Semantic inference uses the COCO_WITH_VOC_LABELS_V1 checkpoint and 21 VOC IDs including background. RGB uses the documented mean/std normalization. Input is resized to longest side520 to bound memory, differing from the default shortest-side transform. Class maps are restored with nearest-neighbor resampling.</li><li>Raw watershed PNG:0 boundary/unassigned,1 background,2+ regions (uint16). Semantic raw PNG:0–20 VOC IDs (uint8). Display colors are not the raw label values.</li>{lab.source?.frame.notes.map(note => <li key={note}>{note}</li>)}</ul></details>
    </LabGuide>
  </LabPage>
}
