import { useRef } from 'react'
import { Link } from 'react-router'
import type { Operation } from './api'
import { experiments } from './content'
import Controls from './Controls'
import ImagePanel from './ImagePanel'
import PixelComparison from './PixelComparison'
import useLab1 from './useLab1'
import ToolIcon from './ToolIcon'
import './Lab1.css'

export default function Lab1() {
  const lab = useLab1()
  const fileInput = useRef<HTMLInputElement>(null)
  const guide = useRef<HTMLDetailsElement>(null)
  const current = experiments[lab.operation]
  const pixelMode = lab.operation === 'inspect' || lab.operation === 'edit'

  return <div className="lab-page">
    <a className="skip-link" href="#lab-main">Skip to workspace</a>
    <header className="site-header"><Link className="brand" to="/" aria-label="Optiq home">optiq<span>.</span></Link>
      <nav aria-label="Lab navigation"><Link to="/#labs">All labs</Link><a href="#lab-explanation" onClick={() => { if (guide.current) guide.current.open = true }}>How it works</a></nav></header>
    <main className="lab-main" id="lab-main">
      <Link className="lab-back" to="/#labs">← Back to labs</Link>
      <section className="lab-introduction" aria-labelledby="lab-title">
        <div><h1 id="lab-title">See what an image is made of.</h1><p>Lab 1 — Image representation & manipulation. Explore pixels, change an image, and discover what happens underneath.</p></div>
        <div className="lab-source-actions">
          <button className="lab-button" disabled={lab.busy} onClick={() => void lab.loadSample('color')}>Color sample</button>
          <button className="lab-button" disabled={lab.busy} onClick={() => void lab.loadSample('grayscale')}>Grayscale sample</button>
          <button className="button" disabled={lab.busy} onClick={() => fileInput.current?.click()}>Upload image</button>
          <input ref={fileInput} className="lab-file" type="file" accept="image/png,image/jpeg" aria-label="Choose image file" onChange={event => {
            const file = event.target.files?.[0]
            if (file) void lab.upload(file)
            event.target.value = ''
          }} />
        </div>
      </section>
      <p className="lab-input-note">PNG or JPEG · up to 5 MiB. Uploads are not retained.</p>
      <section className="lab-workspace" aria-label="Image experimentation workspace">
        <div className="lab-workspace-grid">
        <aside className="lab-tool-sidebar" aria-labelledby="tools-title">
        <h2 id="tools-title">Tools</h2>
        <div className="lab-tools" role="group" aria-label="Choose an experiment">
          {(Object.keys(experiments) as Operation[]).map(operation => <button key={operation} type="button"
            aria-pressed={lab.operation === operation} onClick={() => lab.select(operation)}>
            <ToolIcon operation={operation} /><span>{experiments[operation].title}</span>
          </button>)}
        </div>
        </aside>
        <div className="lab-workspace-body">
          <div className="lab-viewers" aria-busy={lab.busy}>
            <div className="lab-image-grid">
              <ImagePanel title="Original" frame={lab.source?.frame ?? null} onPick={pixelMode ? lab.pick : undefined} empty={lab.busy ? 'Loading image…' : 'Choose a sample or upload an image.'} />
              <ImagePanel title="Result" frame={lab.output?.result ?? null} empty={lab.busy ? 'Processing with OpenCV…' : 'Run an experiment to see its result.'} />
            </div>
            {lab.source && <p className="lab-source-name">Source: {lab.source.name}</p>}
            {lab.output?.pixel && <PixelComparison pixel={lab.output.pixel} />}
            {lab.error && <div className="lab-error" role="alert"><strong>Could not complete the experiment.</strong><p>{lab.error}</p></div>}
            <p className="lab-run-status" role="status" aria-live="polite">{lab.busy ? 'Working with the image service…'
              : lab.output ? `${lab.output.engine} · ${experiments[lab.output.operation].title} complete. The original is unchanged.`
                : lab.source ? 'Ready. Choose settings and run the experiment.' : 'Image service needed. Choose a sample to load or retry.'}</p>
            {lab.output && <div className="lab-result-actions"><a href={lab.output.result.image} download={`optiq-lab1-${lab.output.operation}.png`}>Download result PNG</a>
              <details><summary>Run parameters</summary><pre>{JSON.stringify(lab.output.parameters, null, 2)}</pre></details></div>}
          </div>
          <aside className="lab-controls">
            <h2>{current.title}</h2><p>{current.description}</p>
            <h3>Before you try</h3><p>{current.prediction}</p>
            <form onSubmit={event => { event.preventDefault(); void lab.run() }}>
              <fieldset disabled={lab.busy || !lab.source}>
                <legend className="sr-only">Experiment settings</legend>
                {lab.source && <Controls operation={lab.operation} fields={lab.fields} frame={lab.source.frame} change={lab.change} />}
                <button className="button" type="submit">{lab.busy ? 'Processing…' : current.action}</button>
              </fieldset>
              <button className="lab-button" type="button" onClick={lab.reset}>Reset result</button>
              <p className="lab-hint">Each experiment starts from the original image.</p>
            </form>
          </aside>
        </div>
        </div>
      </section>
      <details ref={guide} className="lab-learning-disclosure" id="lab-explanation">
        <summary>Understand this experiment</summary>
        <section className="lab-learning" aria-label="Understand the experiment">
        <article><h2>{current.heading}</h2><p>{current.explanation}</p><details><summary>See the Python operation</summary><pre><code>{current.code}</code></pre><p>The backend validates inputs and formats the result around this core operation.</p></details></article>
        <article><h2>Try thinking about this</h2><p>{current.reflection}</p></article>
      </section>
      {lab.source && <details className="lab-preprocessing"><summary>Input handling and reproducibility</summary><ul>
        {lab.source.frame.notes.map(note => <li key={note}>{note}</li>)}
        <li>PNG/JPEG inputs: up to 5 MiB, 4096 pixels per side, and 4 million pixels total.</li>
        <li>No automatic resizing. Color inputs are BGR arrays; grayscale inputs retain one channel. Transparency, when present, is composited onto white.</li>
        <li>Every operation runs on the same original. Result downloads are lossless PNGs; the displayed shape describes the OpenCV array, not the browser image buffer.</li>
      </ul></details>}
      </details>
      <footer className="site-footer"><p>Lab 1 of 7 · Python/OpenCV processing</p><Link to="/#labs">Explore the labs →</Link></footer>
    </main>
  </div>
}
