import ImageMetadata from '../../components/lab/ImageMetadata'
import DownloadLink from '../../components/lab/DownloadLink'
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
import LearningCanvas from '../../components/lab/LearningCanvas'
import RunDetails from './RunDetails'
import LearningFigure from './LearningFigure'
import { learningContent } from './learningContent'
import SourceActions from '../../components/lab/SourceActions'
import { LabError, LabStatus } from '../../components/lab/LabFeedback'
import './Lab1.css'

export default function Lab1() {
  const lab = useLab1()
  const guide = useRef<HTMLElement>(null)
  const current = experiments[lab.operation]
  const learning = learningContent[lab.operation]
  const pixelMode = lab.operation === 'inspect' || lab.operation === 'edit'
  const selection = pixelMode || lab.operation === 'crop' ? {
    x: lab.fields.x === '' ? NaN : Number(lab.fields.x),
    y: lab.fields.y === '' ? NaN : Number(lab.fields.y),
    ...(lab.operation === 'crop' ? { width: Number(lab.fields.width), height: Number(lab.fields.height) } : {}),
  } : undefined
  const summary = lab.source && lab.output ? resultSummary(lab.source.frame, lab.output) : ''

  return <LabPage labNumber={1} title="See what an image is made of."
    description="Lab 1 — Image representation & manipulation. Explore pixels, change an image, and discover what happens underneath."
    guideId="lab-explanation" onOpenGuide={() => guide.current?.focus({ preventScroll: true })}
    actions={<SourceActions busy={lab.busy} samples={samples} onSample={lab.loadSample} onUpload={lab.upload} />}>
      <LabWorkspace label="Image experimentation workspace" resultsId="lab-results" busy={lab.busy}
        tools={<ToolSidebar<Operation> value={lab.operation} onChange={lab.select} tools={(Object.keys(experiments) as Operation[]).map(operation => ({
          id: operation, label: experiments[operation].title, icon: <ToolIcon operation={operation} />,
        }))} />}
        details={[
          lab.source && { id: 'image', title: 'Image details', content: <>
            <ImageMetadata highlightChanges images={[
              { label: 'Original', frame: lab.source.frame },
              ...(lab.output ? [{ label: lab.resultIsPrevious || lab.busy ? 'Previous result' : 'Result', frame: lab.output.result }] : []),
            ]} />
              <details className="lab-metadata-handling"><summary>Upload limits & image handling</summary>
              <ul>
                {lab.source?.frame.notes.map(note => <li key={note}>{note}</li>)}
                <li>PNG/JPEG inputs: up to 5 MiB, 4096 pixels per side, and 4 million pixels total.</li>
                <li>No automatic resizing. Color inputs are BGR arrays; grayscale inputs retain one channel.</li>
                <li>Transparency, when present, is composited onto white.</li>
                <li>Operations use the original image. Rotation advances in 90° steps and applies the accumulated angle to the original, avoiding repeated encoding.</li>
                <li>Result downloads are lossless PNGs. The displayed shape describes the OpenCV array, not the browser image buffer.</li>
              </ul>
              </details>
          </> },
          lab.output && { id: 'run', title: 'Run details', content: <RunDetails output={lab.output} source={lab.source?.frame} previous={lab.resultIsPrevious || lab.busy} /> },
        ]}
        controls={<>

            <div className="lab-control-introduction"><h2>{current.title}</h2><p>{current.description}</p></div>

            {lab.operation === 'rotate' && <p className="lab-rotation-angle">Rotation: {lab.rotationTurns * 90}°{lab.rotationTurns === 0 ? ' · original orientation' : ' clockwise'}</p>}
            <form onSubmit={event => { event.preventDefault(); void lab.run() }}>
              <fieldset disabled={lab.busy || !lab.source}>
                <legend className="sr-only">Experiment settings</legend>
                {lab.source && <Controls operation={lab.operation} fields={lab.fields} frame={lab.source.frame} change={lab.change} />}
                <LabButton variant="primary" type="submit">{lab.busy ? 'Processing…' : current.action}</LabButton>
              </fieldset>
              <LabButton disabled={!lab.output && !lab.busy} onClick={lab.reset}>{lab.busy ? 'Cancel processing' : 'Clear result'}</LabButton>

            </form>
        </>}>
            {lab.output && <><p className="lab-result-notice">{lab.resultIsPrevious || lab.busy ? `Previous result · ${experiments[lab.output.operation].title}. Run to apply the current settings.` : `${experiments[lab.output.operation].title} result`}</p>
              <p className="lab-result-summary">{summary}</p></>}
            <div className="lab-image-grid">
              <ImagePanel showMetadata={false} title="Original" pixelOverlay={pixelMode ? lab.pixelSelected ? 'selected' : 'prompt' : undefined} frame={lab.source?.frame ?? null} onPick={pixelMode && !lab.busy ? lab.pick : undefined} onMoveSelection={lab.operation === 'crop' && !lab.busy ? lab.pick : undefined} selection={selection} empty={lab.busy ? 'Loading image…' : 'Choose a sample or upload an image.'} />
              <ImagePanel showMetadata={false} title="Result" frame={lab.output?.result ?? null} empty={lab.busy ? 'Processing the image…' : 'Run an experiment to see its result.'} />
            </div>
            {lab.output?.pixel && <PixelComparison pixel={lab.output.pixel} />}
            {lab.error && <LabError message={lab.error} />}
            {(lab.busy || lab.error || lab.notice || lab.output) && <LabStatus>{lab.busy ? 'Working with the image service…'
              : lab.error ? 'The request failed. Check the message above and try again.'
                : lab.notice ? lab.notice
                  : lab.resultIsPrevious ? 'Settings changed. The previous result is still shown; run the experiment to update it.'
                    : lab.output ? `${experiments[lab.output.operation].title} complete. The original is unchanged.` : null}</LabStatus>}
            {lab.output && <div className="lab-result-actions"><DownloadLink href={lab.output.result.image} download={`optiq-lab1-${lab.output.operation}.png`}>Result PNG</DownloadLink>

            </div>}
      </LabWorkspace>
      <LearningCanvas key={lab.operation} ref={guide} id="lab-explanation" title={learning.title}
        visual={<LearningFigure operation={lab.operation} />}
        details={<>
          <section><h3>The idea</h3><p>{current.explanation}</p></section>
          <section><h3>Connect it to Python</h3><pre tabIndex={0} aria-label="Python implementation"><code>{current.code}</code></pre></section>
          <section><h3>Notice in your experiment</h3><p>{current.reflection}</p></section>
        </>}>
        <h3>{learning.takeaway}</h3>
        <p>{learning.caption}</p>
        <p className="learning-canvas-note">{learning.note}</p>
      </LearningCanvas>
  </LabPage>
}
