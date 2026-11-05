import { inputLimitsFor, maxImagePixels } from '../../api/profile'
import InfoDetails from '../../components/lab/InfoDetails'
import ImageMetadata, { ImageMetadataHelp } from '../../components/lab/ImageMetadata'
import RunMetadata from '../../components/lab/RunMetadata'
import LearningFigure from './LearningFigure'
import { learningConcepts } from './learningContent'
import DownloadLink from '../../components/lab/DownloadLink'
import SettingsHelpLink from '../../components/lab/SettingsHelpLink'
import { useRef, useState } from 'react'
import LabPage from '../../components/lab/LabPage'
import LabWorkspace from '../../components/lab/LabWorkspace'
import ToolSidebar from '../../components/lab/ToolSidebar'
import ImageUploadButton from '../../components/lab/ImageUploadButton'
import SamplePicker from '../../components/lab/SamplePicker'
import ImagePanel from '../../components/lab/ImagePanel'
import LabGuide from '../../components/lab/LabGuide'
import LabButton from '../../components/lab/LabButton'
import { revealField } from '../../components/lab/validation'
import { NumberField } from '../../components/lab/Fields'
import { LabError, LabStatus } from '../../components/lab/LabFeedback'
import useFeatureExperiment from './useFeatureExperiment'
import { sections, pythonExample } from './content'
import type { Section } from './content'
import type { Algorithm } from './api'
import './Lab4.css'

const inputLimits = inputLimitsFor(Math.min(maxImagePixels, 1_000_000))

export default function Lab4() {
  const lab = useFeatureExperiment()
  const [section, setSection] = useState<Section>('compare')
  const [algorithm, setAlgorithm] = useState<Algorithm>('surf')
  const guide = useRef<HTMLElement>(null)
  const content = sections[section]
  const selected = lab.result?.algorithms.find(item => item.algorithm === algorithm)
  const surf = lab.capabilities?.algorithms.find(item => item.id === 'surf')
  function choose(value: Section) {
    setSection(value)
    if (value !== 'compare') setAlgorithm(value)
  }
  return <LabPage labNumber={4} title="Find what stays recognizable."
    description="Lab 4 — Features & matching. Compare SURF, SIFT, and ORB on the same image pair."
    guideId="features-guide" onOpenGuide={() => guide.current?.focus({ preventScroll: true })} wide
    actions={<><ImageUploadButton busy={lab.busy} label="Upload image A" onUpload={file => lab.upload('first', file)} />
      <ImageUploadButton busy={lab.busy} label="Upload image B" onUpload={file => lab.upload('second', file)} />
      <SamplePicker disabled={lab.busy} onSelect={lab.sample} options={[
        { value: 'rotated', label: 'Rotated pair', description: 'The same target rotated 25° and scaled to 90%.' },
        { value: 'scaled', label: 'Scaled pair', description: 'The same target reduced to 65%.' },
      ]} /></>}>
    <LabWorkspace label="Feature matching workspace" resultsId="features-results" busy={lab.busy}
      tools={<ToolSidebar<Section> heading="Methods" value={section} onChange={choose} tools={(Object.keys(sections) as Section[]).map(id => ({ id, label: sections[id].title,
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={sections[id].icon} /></svg>,
      }))} />}
      details={[
        (lab.sources.first || lab.sources.second) && { id: 'image', title: 'Image details', content: <>
          <section><h3>Inputs</h3><ImageMetadata showHelp={false} caption="Input image properties" images={[
            ...(lab.sources.first ? [{ label: 'Image A', frame: lab.sources.first.frame }] : []),
            ...(lab.sources.second ? [{ label: 'Image B', frame: lab.sources.second.frame }] : []),
          ]} /></section>
          {(selected?.keypoints_first_image || selected?.keypoints_second_image || selected?.matches_image) && <section><h3>Outputs</h3>
            <ImageMetadata showHelp={false} caption="Output image properties" images={[
              ...(selected.keypoints_first_image ? [{ label: 'Keypoints A', frame: selected.keypoints_first_image }] : []),
              ...(selected.keypoints_second_image ? [{ label: 'Keypoints B', frame: selected.keypoints_second_image }] : []),
              ...(selected.matches_image ? [{ label: 'Matches', frame: selected.matches_image }] : []),
            ]} />
          </section>}
          <ImageMetadataHelp />
        </> },
        lab.result && { id: 'run', title: 'Run details', content: <RunMetadata value={{ engine: lab.result.engine, parameters: lab.result.parameters, algorithms: lab.result.algorithms.map(({ algorithm, status, keypoints_first, keypoints_second, good_matches, first_ms, second_ms, match_ms }) => ({ algorithm, status, keypoints_first, keypoints_second, good_matches, first_ms, second_ms, match_ms })) }} /> }
      ]}
      controls={<><h2>{content.title === 'Compare' ? 'Compare features' : content.title}</h2>
        <form onSubmit={event => { event.preventDefault(); void lab.run(field => revealField(field, () => setSection('compare'))) }}>
          <fieldset disabled={lab.busy || !lab.sources.first || !lab.sources.second}><legend className="sr-only">Feature comparison settings</legend>
          {(section === 'compare' || section === 'surf') && <>
            <NumberField required name="hessian_threshold" error={lab.invalidField === 'hessian_threshold' ? lab.error : undefined} label="SURF Hessian threshold" value={lab.draft.hessian_threshold} min={1} max={100000} step="any" onChange={value => lab.change('hessian_threshold', value)} />
            <label className="feature-checkbox"><input type="checkbox" checked={lab.draft.upright} onChange={event => lab.change('upright', event.target.checked)} />Upright SURF (U-SURF)</label>
          </>}
          <NumberField required name="ratio_threshold" error={lab.invalidField === 'ratio_threshold' ? lab.error : undefined} label="Match ratio threshold" value={lab.draft.ratio_threshold} min={0.01} max={0.99} step="any" onChange={value => lab.change('ratio_threshold', value)} />
          <NumberField required name="max_features" error={lab.invalidField === 'max_features' ? lab.error : undefined} label="Maximum features per image" value={lab.draft.max_features} min={1} max={1000} step={1} onChange={value => lab.change('max_features', value)} />
          <NumberField required name="max_matches" error={lab.invalidField === 'max_matches' ? lab.error : undefined} label="Maximum displayed matches" value={lab.draft.max_matches} min={1} max={100} step={1} onChange={value => lab.change('max_matches', value)} />
          <div className="feature-actions"><LabButton variant="primary" type="submit" aria-busy={lab.busy} disabled={lab.busy || !lab.sources.first || !lab.sources.second}>Compare features</LabButton>
          </div></fieldset>
          {lab.busy ? <LabButton onClick={() => lab.clear(false)}>Cancel processing</LabButton> : lab.canReset && <LabButton type="button" onClick={lab.resetBaseline}>Reset baseline</LabButton>}
          <SettingsHelpLink guideId="features-guide" />
        </form></>}>
      {surf && !surf.available && <LabError title="SURF is unavailable on this server." message={surf.reason ?? 'A SURF-enabled OpenCV build is required. This laboratory is partially available.'} />}
      <div className="lab-image-grid"><ImagePanel showMetadata={false} title="Image A" frame={lab.sources.first?.frame ?? null} description={lab.sources.first?.name} />
        <ImagePanel showMetadata={false} title="Image B" frame={lab.sources.second?.frame ?? null} description={lab.sources.second?.name} /></div>
      {lab.error && <LabError title="Could not compare the features." message={lab.error} />}
      <LabStatus>{lab.busy ? 'Working with the image service…' : lab.error ? 'Check the message above and try again.'
        : lab.resultIsPrevious ? 'Settings changed. Previous results are shown; run the comparison to update them.'
          : lab.result ? `${lab.result.algorithms.filter(item => item.status === 'ok').length} of 3 algorithms ran. Select a method below to inspect it.`
          : 'Predict what will match, then run the comparison.'}</LabStatus>
      {lab.result && <>
        <div className="feature-table" tabIndex={0} role="region" aria-label="Feature comparison measurements">
          <table><caption>Same inputs · same feature budget · timings from this run</caption><thead><tr><th scope="col">Method</th><th scope="col">Keypoints A / B</th><th scope="col">Accepted matches</th><th scope="col">Detect + describe, A + B</th><th scope="col">Matching</th></tr></thead>
            <tbody>{lab.result.algorithms.map(item => <tr key={item.algorithm} data-selected={algorithm === item.algorithm}>
              <th scope="row"><button type="button" aria-pressed={algorithm === item.algorithm} onClick={() => { setAlgorithm(item.algorithm); setSection(item.algorithm) }}>{item.algorithm.toUpperCase()}</button></th>
              <td>{item.status === 'ok' ? `${item.keypoints_first} / ${item.keypoints_second}` : item.status}</td><td>{item.good_matches ?? '—'}</td>
              <td>{item.first_ms !== null && item.second_ms !== null ? `${(item.first_ms + item.second_ms).toFixed(2)} ms` : '—'}</td><td>{item.match_ms !== null ? `${item.match_ms.toFixed(2)} ms` : '—'}</td>
            </tr>)}</tbody></table>
        </div>
        <section className="feature-inspection" aria-labelledby="feature-method"><h2 id="feature-method">Inspect {algorithm.toUpperCase()}</h2>
          {selected?.message && <p role="status">{selected.message}</p>}
          {selected?.status === 'ok' && <>
            <p>Circles show keypoint size; spokes show orientation.</p>
            <InfoDetails title="Descriptor details"><p>{selected.descriptor_dimensions} {selected.descriptor_dtype === 'uint8' ? 'bytes (256 bits)' : 'floating-point values'} per descriptor · {selected.norm} distance.</p></InfoDetails>
            <div className="lab-image-grid"><ImagePanel showMetadata={false} title={`${algorithm.toUpperCase()} · keypoints A`} frame={selected.keypoints_first_image} /><ImagePanel showMetadata={false} title={`${algorithm.toUpperCase()} · keypoints B`} frame={selected.keypoints_second_image} /></div>
            <ImagePanel showMetadata={false} title={`${algorithm.toUpperCase()} · matches`} frame={selected.matches_image} description={`Showing ${selected.displayed_matches} of ${selected.good_matches} ratio-test matches, ordered by distance. These are candidate correspondences, not verified accuracy.`} />
            <div className="feature-downloads lab-downloads">{selected.keypoints_first_image && <DownloadLink href={selected.keypoints_first_image.image} download={`optiq-${algorithm}-keypoints-a.png`}>Keypoints A PNG</DownloadLink>}
              {selected.keypoints_second_image && <DownloadLink href={selected.keypoints_second_image.image} download={`optiq-${algorithm}-keypoints-b.png`}>Keypoints B PNG</DownloadLink>}
              {selected.matches_image && <DownloadLink href={selected.matches_image.image} download={`optiq-${algorithm}-matches.png`}>Matches PNG</DownloadLink>}</div>
          </>}
        </section>

      </>}
    </LabWorkspace>
    <LabGuide id="features-guide" ref={guide} key={section} title={content.heading} concept={learningConcepts[section]} visual={<LearningFigure section={section} />} settingsHelp={<>
            <p>Choose settings, then compare the same image pair across all available methods.</p>
            <p>Higher SURF Hessian thresholds usually detect fewer keypoints. Upright mode disables SURF orientation invariance.</p>
            <p>Higher match ratios accept more candidate matches; they do not prove accuracy. Maximum displayed matches limits drawn lines, not the number of accepted matches.</p>
           </>}><div className="lab-canvas-reading"><article><h3>{content.heading}</h3><p>{content.explanation}</p></article>
      <article><h3>Try thinking about this</h3><p>{content.reflection}</p></article></div>
      <section><h3>Connect it to Python</h3><pre tabIndex={0} aria-label="Python implementation"><code>{pythonExample}</code></pre></section>
      <details className="lab-preprocessing"><summary>Input handling & reproducibility</summary><ul><li>{inputLimits} Combined match canvas: at most {Math.min(2_000_000, maxImagePixels * 2).toLocaleString()} pixels.</li>
        <li>Both inputs are converted to grayscale. Transparency is composited onto white; EXIF orientation is not applied.</li>
        <li>Features are capped at the strongest responses before describing them. A higher ratio threshold accepts more candidates; the display limit only reduces drawn lines.</li>
        <li>Upright mode changes only SURF. Timings include detection and description separately from matching; rerun to observe variation. They exclude upload and image rendering.</li>
        {lab.sampleNotes.map(note => <li key={note}>{note}</li>)}{lab.result?.notes.map((note, index) => <li key={index}>{note}</li>)}
      </ul></details>
    </LabGuide>
  </LabPage>
}
