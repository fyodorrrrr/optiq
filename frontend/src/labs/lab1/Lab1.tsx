import { useRef } from 'react'
import type { Operation } from './api'
import { experiments } from './content'
import Controls from './Controls'
import ImagePanel from './ImagePanel'
import PixelComparison from './PixelComparison'
import useLab1 from './useLab1'
import ToolIcon from './ToolIcon'
import { resultSummary } from './resultSummary'
import { samples } from './samples'
import LabPage from '../../components/lab/LabPage'
import LabWorkspace from '../../components/lab/LabWorkspace'
import ToolSidebar from '../../components/lab/ToolSidebar'
import LabButton from '../../components/lab/LabButton'
import LabGuide from '../../components/lab/LabGuide'
import SourceActions from '../../components/lab/SourceActions'
import { LabError, LabStatus } from '../../components/lab/LabFeedback'
import './Lab1.css'

export default function Lab1() {
  const lab = useLab1()
  const guide = useRef<HTMLDetailsElement>(null)
  const current = experiments[lab.operation]
  const pixelMode = lab.operation === 'inspect' || lab.operation === 'edit'
  const selection = pixelMode || lab.operation === 'crop' ? {
    x: lab.fields.x === '' ? NaN : Number(lab.fields.x),
    y: lab.fields.y === '' ? NaN : Number(lab.fields.y),
    ...(lab.operation === 'crop' ? { width: Number(lab.fields.width), height: Number(lab.fields.height) } : {}),
  } : undefined
  const summary = lab.source && lab.output ? resultSummary(lab.source.frame, lab.output) : ''

  return <LabPage labNumber={1} title="See what an image is made of."
    description="Lab 1 — Image representation & manipulation. Explore pixels, change an image, and discover what happens underneath."
    inputNote="PNG or JPEG · up to 5 MiB. Uploads are not retained."
    guideId="lab-explanation" onOpenGuide={() => { if (guide.current) guide.current.open = true }}
    actions={<SourceActions busy={lab.busy} samples={samples} onSample={lab.loadSample} onUpload={lab.upload} />}>
      <LabWorkspace label="Image experimentation workspace" resultsId="lab-results" busy={lab.busy}
        tools={<ToolSidebar<Operation> value={lab.operation} onChange={lab.select} tools={(Object.keys(experiments) as Operation[]).map(operation => ({
          id: operation, label: experiments[operation].title, icon: <ToolIcon operation={operation} />,
        }))} />}
        controls={<>

            <h2>{current.title}</h2><p>{current.description}</p>
            <h3>Before you try</h3><p>{current.prediction}</p>
            {lab.operation === 'rotate' && <p className="lab-rotation-angle">Rotation: {lab.rotationTurns * 90}°{lab.rotationTurns === 0 ? ' · original orientation' : ' clockwise'}</p>}
            <form onSubmit={event => { event.preventDefault(); void lab.run() }}>
              <fieldset disabled={lab.busy || !lab.source}>
                <legend className="sr-only">Experiment settings</legend>
                {lab.source && <Controls operation={lab.operation} fields={lab.fields} frame={lab.source.frame} change={lab.change} />}
                <LabButton variant="primary" type="submit">{lab.busy ? 'Processing…' : current.action}</LabButton>
              </fieldset>
              <LabButton disabled={!lab.output && !lab.busy} onClick={lab.reset}>{lab.busy ? 'Cancel processing' : 'Clear result'}</LabButton>
              {lab.output && <a className="lab-view-result" href="#lab-results">View {lab.resultIsPrevious ? 'previous ' : ''}result ↓</a>}
              <p className="lab-hint">{lab.operation === 'rotate' ? 'Each click adds 90°. Clear the result to reset the angle.' : 'Each experiment starts from the original image.'}</p>
            </form>
        </>}>
            {lab.output && <><p className="lab-result-notice">{lab.resultIsPrevious || lab.busy ? `Previous result · ${experiments[lab.output.operation].title}. Run to apply the current settings.` : `${experiments[lab.output.operation].title} result`}</p>
              <p className="lab-result-summary">{summary}</p></>}
            <div className="lab-image-grid">
              <ImagePanel metadataEssential title="Original" frame={lab.source?.frame ?? null} onPick={pixelMode && !lab.busy ? lab.pick : undefined} selection={selection} empty={lab.busy ? 'Loading image…' : 'Choose a sample or upload an image.'} />
              <ImagePanel metadataEssential title="Result" frame={lab.output?.result ?? null} empty={lab.busy ? 'Processing with OpenCV…' : 'Run an experiment to see its result.'} />
            </div>
            {lab.source && <details className="lab-metadata-help"><summary>About image shape, channels & values</summary>
              <p>Dimensions list width × height; array shape lists height, width, then channels for color images. OpenCV stores color channels in BGR order: blue, green, red. Grayscale has one channel. These images use uint8 whole-number values from 0 to 255.</p>
            </details>}
            {lab.output?.pixel && <PixelComparison pixel={lab.output.pixel} />}
            {lab.error && <LabError message={lab.error} />}
            <LabStatus>{lab.busy ? 'Working with the image service…'
              : lab.error ? 'The request failed. Check the message above and try again.'
                : lab.output ? lab.resultIsPrevious ? 'Settings changed. The previous result is still shown; run the experiment to update it.'
                  : `${experiments[lab.output.operation].title} complete. The original is unchanged.`
                  : lab.source ? 'Ready. Choose settings and run the experiment.' : 'Choose a sample or upload an image to retry.'}</LabStatus>
            {lab.output && <div className="lab-result-actions"><a href={lab.output.result.image} download={`optiq-lab1-${lab.output.operation}.png`}>Download result PNG</a>
              <details><summary>Run parameters</summary><pre>{JSON.stringify({ parameters: lab.output.parameters, engine: lab.output.engine, original_dtype: lab.source?.frame.dtype, result_dtype: lab.output.result.dtype }, null, 2)}</pre></details></div>}
      </LabWorkspace>
      <LabGuide ref={guide} id="lab-explanation">
        <section className="lab-learning" aria-label="Understand the experiment">
        <article><h2>{current.heading}</h2><p>{current.explanation}</p><details><summary>See the Python operation</summary><pre><code>{current.code}</code></pre><p>The backend validates inputs and formats the result around this core operation.</p></details></article>
        <article><h2>Try thinking about this</h2><p>{current.reflection}</p></article>
      </section>
      {lab.source && <details className="lab-preprocessing"><summary>Input handling and reproducibility</summary><ul>
        {lab.source.frame.notes.map(note => <li key={note}>{note}</li>)}
        <li>PNG/JPEG inputs: up to 5 MiB, 4096 pixels per side, and 4 million pixels total.</li>
        <li>No automatic resizing. Color inputs are BGR arrays; grayscale inputs retain one channel. Transparency, when present, is composited onto white.</li>
        <li>Operations use the original image. Rotation advances in 90° steps and applies the accumulated angle to the original, avoiding repeated encoding. Result downloads are lossless PNGs; the displayed shape describes the OpenCV array, not the browser image buffer.</li>
      </ul></details>}
      </LabGuide>
  </LabPage>
}
