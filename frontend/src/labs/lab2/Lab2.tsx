import PredictionPrompt from '../../components/lab/PredictionPrompt'
import { useRef, useState } from 'react'
import { pythonExample, sections } from './content'
import type { Section } from './content'
import EdgeControls from './EdgeControls'
import EdgeFigure from './EdgeFigure'
import useEdgeExperiment from './useEdgeExperiment'
import LabPage from '../../components/lab/LabPage'
import LabWorkspace from '../../components/lab/LabWorkspace'
import ToolSidebar from '../../components/lab/ToolSidebar'
import SourceActions from '../../components/lab/SourceActions'
import LabGuide from '../../components/lab/LabGuide'
import ImageMetadata from '../../components/lab/ImageMetadata'
import { LabError, LabStatus } from '../../components/lab/LabFeedback'
import './Lab2.css'

export default function Lab2() {
  const lab = useEdgeExperiment()
  const [section, setSection] = useState<Section>('compare')
  const guide = useRef<HTMLDetailsElement>(null)
  const content = sections[section]

  return <LabPage labNumber={2} title="Find where the image changes."
    description="Lab 2 — Edge detection. Compare Sobel and Canny on the same image."
    inputNote="PNG or JPEG · up to 5 MiB · color inputs become grayscale. Uploads are not retained."
    guideId="edge-guide" onOpenGuide={() => { if (guide.current) guide.current.open = true }} wide
    actions={<SourceActions busy={lab.busy} onSample={lab.sample} onUpload={lab.upload} samples={[
      { value: 'shapes', label: 'Shapes sample', description: 'Compare crisp boundaries with different contrast.' },
      { value: 'noisy', label: 'Noisy sample', description: 'Investigate noise, smoothing, and thresholds.' },
    ]} />}>
      <LabWorkspace label="Edge detection workspace" resultsId="edge-results" busy={lab.busy}
        tools={<ToolSidebar<Section> heading="Settings" value={section} onChange={setSection} label="Choose edge settings"
          tools={(Object.keys(sections) as Section[]).map(key => ({ id: key, label: sections[key].title,
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={sections[key].icon} /></svg>,
          }))} />}
        controls={<><h2>{content.title === 'Compare' ? 'Compare edges' : content.title}</h2>
          <PredictionPrompt>{content.prompt}</PredictionPrompt><EdgeControls lab={lab} section={section} onRevealSettings={() => setSection('compare')} /></>}>
          <div className="lab-image-grid" data-columns={3}>
            <EdgeFigure title="Original (grayscale)" frame={lab.source?.frame ?? null} description="Input before Gaussian smoothing" pending={lab.busy} />
            <EdgeFigure title="Sobel combined" frame={lab.result?.sobel ?? null} description="Brighter pixels show stronger changes · scaled for display" pending={lab.busy} />
            <EdgeFigure title="Canny edges" frame={lab.result?.canny ?? null} description="White pixels are detected edges · values 0 or 255" pending={lab.busy} />
          </div>
          {lab.source && <details className="lab-metadata-help"><summary>Image details</summary>
            <ImageMetadata frame={lab.source.frame} />
          </details>}
          {lab.error && <LabError message={lab.error} title="Could not compare the edges." />}
          <LabStatus>{lab.busy ? 'Working with the image service…'
            : lab.error ? 'The request failed. Check the message above and try again.'
              : lab.resultIsPrevious ? 'Settings changed. Previous results are still shown; run both detectors to update them.'
                : lab.result ? 'Both detectors complete.'
              : lab.source ? 'Ready. Run both detectors to compare their edge maps.' : 'Choose a sample or upload an image to begin.'}</LabStatus>
          {lab.result && <>

            <div className="edge-downloads"><a href={lab.result.sobel.image} download="optiq-lab2-sobel.png">Download Sobel</a><a href={lab.result.canny.image} download="optiq-lab2-canny.png">Download Canny</a></div>
            <details className="edge-intermediates"><summary>Preprocessing & directional gradients</summary>
              <div className="lab-image-grid" data-columns={3}>
                <EdgeFigure title="Gaussian blur" frame={lab.result.blurred} description={`${lab.result.parameters.blur_kernel} × ${lab.result.parameters.blur_kernel} · shared input to both detectors`} />
                <EdgeFigure title="Sobel x" frame={lab.result.sobel_x} description="Absolute x derivative · separately scaled" />
                <EdgeFigure title="Sobel y" frame={lab.result.sobel_y} description="Absolute y derivative · separately scaled" />
              </div>
            </details>
            <details className="edge-run"><summary>Run settings & measurements</summary>            <p className="edge-scaling">Sobel is scaled to 0–255 for display; raw magnitude max: {Number(lab.result.statistics.sobel_max.toFixed(2))}. Canny edge pixels: {lab.result.statistics.canny_edge_pixels.toLocaleString()} ({lab.result.statistics.canny_edge_percent}%).</p><p>Edge-pixel percentage measures output density, not accuracy.</p><pre>{JSON.stringify({ engine: lab.result.engine, parameters: lab.result.parameters, statistics: lab.result.statistics, display_scaling: lab.result.display_scaling, canny_aperture: 3, canny_L2gradient: false }, null, 2)}</pre></details>
          </>}
      </LabWorkspace>
      <LabGuide id="edge-guide" ref={guide}>
        <div className="lab-learning"><article><h2>{content.heading}</h2><p>{content.explanation}</p>
          </article>
          <article><h2>Try thinking about this</h2><p>{content.reflection}</p></article></div>
        <details className="lab-guide-code"><summary>See the Python operations</summary><pre><code>{pythonExample}</code></pre></details>
      <details className="lab-preprocessing"><summary>Input handling & reproducibility</summary><ul>
          <li>The activity's input.jpg was not supplied. The generated samples are explicit replacements; upload the assigned image when available.</li>
          <li>The noisy sample uses Gaussian noise with seed 42 and standard deviation 18.</li>
          <li>PNG/JPEG inputs are limited to 5 MiB, 4096px per side, and four million pixels. No automatic resizing; transparency is composited onto white and EXIF orientation is not applied.</li>
          <li>Baseline: Gaussian 3×3, Sobel size 3, Canny 100/200. Both algorithms run on the same blurred grayscale array.</li>
          <li>Sobel previews use round(abs(value) / maximum × 255), independently per view. Zero gradients display as black. Display brightness is not a common raw scale across runs.</li>
          {lab.source?.frame.notes.map(note => <li key={note}>{note}</li>)}
        </ul></details>
      </LabGuide>
  </LabPage>
}
