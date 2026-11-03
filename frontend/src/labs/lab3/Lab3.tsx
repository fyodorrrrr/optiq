import { useRef, useState } from 'react'
import LabPage from '../../components/lab/LabPage'
import LabWorkspace from '../../components/lab/LabWorkspace'
import ToolSidebar from '../../components/lab/ToolSidebar'
import SourceActions from '../../components/lab/SourceActions'
import LabGuide from '../../components/lab/LabGuide'
import ImagePanel from '../../components/lab/ImagePanel'
import Histogram from '../../components/lab/Histogram'
import ImageMetadata from '../../components/lab/ImageMetadata'
import { LabError, LabStatus } from '../../components/lab/LabFeedback'
import ContrastPanel from './ContrastPanel'
import ContrastControls from './ContrastControls'
import { pythonExample, sections } from './content'
import type { Section } from './content'
import useContrastExperiment from './useContrastExperiment'
import './Lab3.css'

export default function Lab3() {
  const lab = useContrastExperiment()
  const [section, setSection] = useState<Section>('compare')
  const guide = useRef<HTMLDetailsElement>(null)
  const content = sections[section]
  const views = lab.result ? [lab.result.original, lab.result.equalized, lab.result.clahe, lab.result.linear] : []
  const maxCount = Math.max(0, ...views.flatMap(view => view.histogram))
  const channel = lab.result?.channel ?? (lab.draft.mode === 'color' ? 'Y brightness (YUV)' : 'Grayscale intensity')
  const csv = lab.result ? 'intensity,original,equalized,clahe,linear\n' + Array.from({ length: 256 }, (_, i) => [i, ...views.map(view => view.histogram[i])].join(',')).join('\n') : ''

  return <LabPage labNumber={3} title="Bring the details into view."
    description="Lab 3 — Histograms & contrast. Compare global equalization, CLAHE, and linear adjustment."
    inputNote="PNG or JPEG · up to 5 MiB. Uploads are not retained."
    guideId="contrast-guide" onOpenGuide={() => { if (guide.current) guide.current.open = true }} wide
    actions={<SourceActions busy={lab.busy} onSample={lab.sample} onUpload={lab.upload} samples={[
      { value: 'low-contrast', label: 'Low contrast', description: 'Expand a narrow range of brightness values.' },
      { value: 'uneven', label: 'Uneven lighting', description: 'Compare local enhancement and noise; seed 42.' },
      { value: 'color', label: 'Color study', description: 'Adjust brightness while retaining color information.' },
    ]} />}>
      <LabWorkspace label="Histogram and contrast workspace" resultsId="contrast-results" busy={lab.busy}
        tools={<ToolSidebar<Section> value={section} onChange={setSection} label="Choose contrast settings" tools={(Object.keys(sections) as Section[]).map(key => ({
          id: key, label: sections[key].title,
          icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={sections[key].icon} /></svg>,
        }))} />}
        controls={<><h2>{content.title === 'Compare' ? 'Compare contrast' : content.title}</h2><p>{content.prompt}</p><ContrastControls lab={lab} section={section} /></>}>
        <div className="lab-image-grid" data-columns={3}>
          <ContrastPanel title="Original" view={lab.result?.original ?? null} original={lab.source?.frame} pending={lab.busy} maxCount={maxCount} channel={channel}
            description={lab.result ? `Working original · ${channel}` : 'Input preview · run to apply the selected mode'} />
          <ContrastPanel title="Global equalization" view={lab.result?.equalized ?? null} pending={lab.busy} maxCount={maxCount} channel={channel} description="One brightness mapping for the whole image" />
          <ContrastPanel title="CLAHE" view={lab.result?.clahe ?? null} pending={lab.busy} maxCount={maxCount} channel={channel} description="Local enhancement with a contrast limit" />
        </div>
        {lab.result && <details className="lab-metadata-help"><summary>How to read these histograms</summary>
          <p>The horizontal axis shows brightness from 0 (black) to 255 (white). Bar height counts pixels at each brightness. All four charts share the same count scale, so their heights can be compared.</p>
          <p>{lab.result.channel === 'Grayscale intensity' ? 'These histograms measure grayscale intensity.' : 'These histograms measure Y brightness from each final color image, not separate red, green, and blue channels.'} A wider brightness distribution can indicate greater contrast; also compare detail visibility and noise in the images.</p>
        </details>}
        {lab.error && <LabError title="Could not compare the contrast." message={lab.error} />}
        <LabStatus>{lab.busy ? 'Working with the image service…'
          : lab.error ? 'Check the message above and try again.'
            : lab.result ? 'Contrast comparison complete.'
              : lab.source ? 'Ready. Run the comparison to see images and histograms.' : 'Choose a sample or upload an image to begin.'}</LabStatus>
        <section className="contrast-linear" aria-labelledby="linear-result-title">
          <h3 id="linear-result-title">Linear adjustment</h3>
          <div className="lab-image-grid">
            <ImagePanel showMetadata={false} title="Linear result" frame={lab.result?.linear.frame ?? null} description={lab.result?.linear_transform.note ?? 'Scale and offset, or stretch the observed range to 0–255.'}
              empty={lab.busy ? 'Processing…' : 'Run the comparison to see the linear result.'} />
            {lab.result && <div><Histogram title="Linear histogram" counts={lab.result.linear.histogram} maxCount={maxCount} channel={channel} />
</div>}
          </div>
        </section>
        {lab.source && <details className="lab-metadata-help"><summary>Image details</summary>
          <p>{lab.result ? 'Properties shared by all four displayed images.' : 'Uploaded input properties; the selected mode is applied when you run the comparison.'}</p>
          <ImageMetadata frame={lab.result?.original.frame ?? lab.source.frame} />
        </details>}
        {lab.result && <>
          <div className="contrast-downloads">
            <a href={lab.result.equalized.frame.image} download="optiq-lab3-equalized.png">Download equalized</a>
            <a href={lab.result.clahe.frame.image} download="optiq-lab3-clahe.png">Download CLAHE</a>
            <a href={lab.result.linear.frame.image} download="optiq-lab3-linear.png">Download linear</a>
            <a href={`data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`} download="optiq-lab3-histograms.csv">Download histograms CSV</a>
          </div>
          <details className="lab-preprocessing contrast-run"><summary>Run settings & measurements</summary><pre>{JSON.stringify({ engine: lab.result.engine, parameters: lab.result.parameters, linear_transform: lab.result.linear_transform, channel: lab.result.channel,
            statistics: { original: lab.result.original.statistics, equalized: lab.result.equalized.statistics, clahe: lab.result.clahe.statistics, linear: lab.result.linear.statistics } }, null, 2)}</pre></details>
        </>}
      </LabWorkspace>
      <LabGuide id="contrast-guide" ref={guide}>
        <div className="lab-learning"><article><h2>{content.heading}</h2><p>{content.explanation}</p>
          <details><summary>See the Python operations</summary><pre><code>{pythonExample}</code></pre></details></article>
          <article><h2>Try thinking about this</h2><p>{content.reflection}</p></article></div>
        <details className="lab-preprocessing"><summary>Input handling & reproducibility</summary><ul>
          <li>Color mode changes only Y in YUV before reconstructing BGR. Grayscale mode converts color inputs first. Histograms count brightness, not separate red/green/blue channels.</li>
          <li>Histograms use 256 bins and the same count scale across all four views. Counts and measurements are calculated from the final displayed images, including reconstruction rounding and gamut clipping.</li>
          <li>Manual adjustment uses clip(rint(alpha × intensity + beta), 0, 255). Negative offsets clip at black; they are not converted to absolute values. Full-range stretching leaves a constant channel unchanged.</li>
          <li>The generated uneven-lighting sample has Gaussian noise with seed 42 and standard deviation 2.5.</li>
          <li>Inputs are limited to 5 MiB, 4096px per side, and four million pixels. Transparency is composited onto white; EXIF orientation is not applied. Color inputs select color mode on load; reset restores the grayscale baseline.</li>
          {lab.source?.frame.notes.map(note => <li key={note}>{note}</li>)}
          {lab.result?.notes.map(note => <li key={note}>{note}</li>)}
        </ul></details>
      </LabGuide>
  </LabPage>
}
