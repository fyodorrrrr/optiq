import RunMetadata from '../../components/lab/RunMetadata'
import LearningFigure from './LearningFigure'
import { learningConcepts } from './learningContent'
import DownloadLink from '../../components/lab/DownloadLink'
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
  const guide = useRef<HTMLElement>(null)
  const content = sections[section]

  return <LabPage labNumber={2} title="Find where the image changes."
    description="Lab 2 — Edge detection. Compare Sobel and Canny on the same image."
    guideId="edge-guide" onOpenGuide={() => guide.current?.focus({ preventScroll: true })} wide
    actions={<SourceActions busy={lab.busy} onSample={lab.sample} onUpload={lab.upload} samples={[
      { value: 'shapes', label: 'Shapes sample', description: 'Compare crisp boundaries with different contrast.' },
      { value: 'noisy', label: 'Noisy sample', description: 'Investigate noise, smoothing, and thresholds.' },
    ]} />}>
      <LabWorkspace label="Edge detection workspace" resultsId="edge-results" busy={lab.busy}
        tools={<ToolSidebar<Section> heading="Settings" value={section} onChange={setSection} label="Choose edge settings"
          tools={(Object.keys(sections) as Section[]).map(key => ({ id: key, label: sections[key].title,
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={sections[key].icon} /></svg>,
          }))} />}
        details={[
          lab.source && { id: 'image', title: 'Image details', content: <ImageMetadata highlightChanges images={[
            { label: 'Original', frame: lab.source.frame },
            ...(lab.result ? [{ label: 'Sobel', frame: lab.result.sobel }, { label: 'Canny', frame: lab.result.canny }] : []),
          ]} /> },
          lab.result && { id: 'run', title: 'Run details', content: <RunMetadata value={{ engine: lab.result.engine, parameters: lab.result.parameters, statistics: lab.result.statistics, measurement_note: 'Edge-pixel percentage measures output density, not accuracy.', display_scaling: lab.result.display_scaling, canny_aperture: 3, canny_L2gradient: false }} /> }
        ]}
        controls={<><h2>{content.title === 'Compare' ? 'Compare edges' : content.title}</h2>
          <EdgeControls lab={lab} section={section} onRevealSettings={() => setSection('compare')} /></>}>
          <div className="lab-image-grid" data-columns={3}>
            <EdgeFigure title="Original (grayscale)" frame={lab.source?.frame ?? null} description="Input before Gaussian smoothing" pending={lab.busy} />
                        <EdgeFigure title="Sobel combined" frame={lab.result?.sobel ?? null} description="Brighter pixels show stronger changes · scaled for display" pending={lab.busy} />
            <EdgeFigure title="Canny edges" frame={lab.result?.canny ?? null} description="White pixels are detected edges · values 0 or 255" pending={lab.busy} />
          </div>

          {lab.error && <LabError message={lab.error} title="Could not compare the edges." />}
          <LabStatus>{lab.busy ? 'Working with the image service…'
            : lab.error ? 'The request failed. Check the message above and try again.'
              : lab.resultIsPrevious ? 'Settings changed. Previous results are still shown; run both detectors to update them.'
                : lab.result ? 'Both detectors complete.'
              : lab.source ? 'Run both detectors to see Sobel and Canny edge maps beside the original.' : 'Choose a sample or upload an image to begin.'}</LabStatus>
          {lab.result && <>

            <div className="edge-downloads lab-downloads"><DownloadLink href={lab.result.sobel.image} download="optiq-lab2-sobel.png">Sobel PNG</DownloadLink><DownloadLink href={lab.result.canny.image} download="optiq-lab2-canny.png">Canny PNG</DownloadLink></div>
            <details className="edge-intermediates"><summary>Preprocessing & directional gradients</summary>
              <div className="lab-image-grid" data-columns={3}>
                <EdgeFigure title="Gaussian blur" frame={lab.result.blurred} description={`${lab.result.parameters.blur_kernel} × ${lab.result.parameters.blur_kernel} · shared input to both detectors`} />
                <EdgeFigure title="Sobel x" frame={lab.result.sobel_x} description="Absolute x derivative · separately scaled" />
                <EdgeFigure title="Sobel y" frame={lab.result.sobel_y} description="Absolute y derivative · separately scaled" />
              </div>
            </details>

          </>}
      </LabWorkspace>
      <LabGuide id="edge-guide" ref={guide} key={section} title={content.heading} concept={learningConcepts[section]} visual={<LearningFigure section={section} />} settingsHelp={<>
        <p>Choose settings, then run both detectors. They always use the same input and Gaussian blur.</p>
        <p>Larger Gaussian kernels smooth more noise and fine detail. The Sobel kernel sets the neighborhood used to measure brightness changes.</p>
        <p>Higher Canny thresholds generally retain fewer weak edges. The lower threshold must be smaller than the upper threshold.</p>
       </>}>
        <div className="lab-canvas-reading"><article><h3>{content.heading}</h3><p>{content.explanation}</p>
          </article>
          <article><h3>Try thinking about this</h3><p>{content.reflection}</p></article></div>
        <section><h3>Connect it to Python</h3><pre tabIndex={0} aria-label="Python implementation"><code>{pythonExample}</code></pre></section>
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
