import InfoDetails from '../../components/lab/InfoDetails'
import PcaRunDetails from './PcaRunDetails'
import LearningFigure from './LearningFigure'
import { learningConcepts } from './learningContent'
import DownloadLink from '../../components/lab/DownloadLink'
import SettingsHelpLink from '../../components/lab/SettingsHelpLink'
import { useRef, useState } from 'react'
import LabPage from '../../components/lab/LabPage'
import LabWorkspace from '../../components/lab/LabWorkspace'
import ToolSidebar from '../../components/lab/ToolSidebar'
import LabButton from '../../components/lab/LabButton'
import LabGuide from '../../components/lab/LabGuide'
import ImagePanel from '../../components/lab/ImagePanel'
import { SelectField } from '../../components/lab/Fields'
import { LabError, LabStatus } from '../../components/lab/LabFeedback'
import VarianceChart from './VarianceChart'
import usePcaDemo from './usePcaDemo'
import { sections, pythonExample } from './content'
import type { Section } from './content'
import type { Eigenface, Prediction } from './api'
import './Lab5.css'

function EigenGallery({ items }: { items: Eigenface[] }) {
  return <div className="pca-gallery">{items.map(item => <ImagePanel compact imageAlt={`Eigenface component ${item.component}; signed variation pattern, not a photograph.`} key={item.component} title={`Component ${item.component}`} frame={item.frame} showMetadata={false} description={`${(item.variance * 100).toFixed(2)}% of training variance`} />)}</div>
}
function PredictionGallery({ items }: { items: Prediction[] }) {
  return <div className="pca-gallery">{items.map(item => <div className="pca-prediction" key={item.index}>
    <ImagePanel compact imageAlt={`Test face ${item.index}. Actual identity: ${item.actual}. Predicted identity: ${item.predicted}.`}
      title={`Test face #${item.index}`} frame={item.frame} showMetadata={false} />
    <dl className="pca-prediction-labels">
      <div><dt>Actual</dt><dd>{item.actual}</dd></div>
      <div><dt>Predicted</dt><dd>{item.predicted}</dd></div>
    </dl>
  </div>)}</div>
}
export default function Lab5() {
  const lab = usePcaDemo()
  const options = lab.options
  const [section, setSection] = useState<Section>('eigenfaces')
  const guide = useRef<HTMLElement>(null)
  const content = sections[section]
  const result = lab.result
  const stale = result && result.parameters.components !== Number(lab.components)
  return <LabPage labNumber={5} title="Find the patterns behind a face."
    description="Lab 5 — PCA & eigenfaces. Compare saved variation patterns and recognition results on held-out faces."
    guideId="pca-guide" onOpenGuide={() => guide.current?.focus({ preventScroll: true })} wide
    actions={null}>
    <LabWorkspace label="PCA and eigenfaces workspace" resultsId="pca-results" busy={lab.busy}
      tools={<ToolSidebar<Section> heading="Explore" value={section} onChange={setSection} tools={(Object.keys(sections) as Section[]).map(id => ({ id, label: sections[id].title,
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={sections[id].icon} /></svg>,
      }))} />}
      details={[
        { id: 'dataset', title: 'Dataset details', content: <>
        <p>{lab.dataset?.message ?? 'Loading the recorded dataset details…'}</p>
        {lab.dataset?.ready && <><dl className="pca-facts"><div><dt>Faces</dt><dd>{lab.dataset.samples.toLocaleString()}</dd></div><div><dt>Image size</dt><dd>{lab.dataset.width} × {lab.dataset.height}</dd></div><div><dt>Pixel features</dt><dd>{lab.dataset.features.toLocaleString()}</dd></div><div><dt>Identities</dt><dd>{lab.dataset.names.length}</dd></div></dl>
          <details><summary>Included identities</summary><p>{lab.dataset.names.join(' · ')}</p></details></>}
</> },
        result && { id: 'run', title: 'Run details', content: <PcaRunDetails result={result} previous={Boolean(stale || lab.busy)} /> }
      ]}
      controls={<><h2>{content.title}</h2>
        <SelectField disabled={!lab.options.length} label="PCA components" value={lab.components}
          help={{ label: 'Why Lab 5 uses saved results', text: 'PCA and face recognition were computed locally in advance to keep this hosted demo fast and lightweight. These are real experiment results. Changing the component count loads a saved run; it does not train a model.' }}
          options={options.length ? options : [{ value: 150, label: 'Loading saved runs…' }]} onChange={lab.setComponents} />
        {lab.components !== '150' && <div className="pca-actions"><LabButton onClick={() => lab.setComponents('150')}>Reset baseline</LabButton></div>}
        {lab.error && <div className="pca-actions"><LabButton disabled={lab.busy} onClick={() => void lab.refresh()}>Reload saved runs</LabButton></div>}
        <SettingsHelpLink guideId="pca-guide" />
      </>}>


      {lab.error && <LabError title="Could not load the saved run." message={lab.error} />}
      {result && (lab.busy || stale) && <LabStatus>{lab.busy ? 'Loading saved run…'
        : 'Previous result · The selected run could not load. The previous result is still shown.'}</LabStatus>}
      {result ? <>
        {section === 'eigenfaces' && <section className="pca-view"><h2>The first 12 eigenfaces</h2><p>Signed component weights: gray is zero, brighter is positive, darker is negative. Each component uses its own symmetric display range; brightness does not compare variance.</p>
          <EigenGallery items={result.eigenfaces} /><h2>The last 3 selected eigenfaces</h2><p>Compare these with components 1–3. The baseline ends at component 150.</p><EigenGallery items={result.tail_eigenfaces} /></section>}
        {section === 'variance' && <section className="pca-view"><h2>How much variation remains?</h2><p><strong>{result.components_90} components</strong> retain at least 90% of training variance. The saved {result.parameters.components}-component randomized PCA retains {(result.selected_variance * 100).toFixed(2)}%.</p>
          <VarianceChart values={result.cumulative_variance} threshold={result.components_90} selected={result.parameters.components} />
          <details><summary>Exact cumulative variance values</summary><div className="pca-table"><table><thead><tr><th>Components</th><th>Cumulative variance</th></tr></thead><tbody>{result.cumulative_variance.map((value, index) => <tr key={index}><td>{index + 1}</td><td>{(value * 100).toFixed(4)}%</td></tr>)}</tbody></table></div></details></section>}
        {section === 'recognition' && <section className="pca-view"><h2>Recognition on held-out faces</h2><p><strong>{(result.accuracy * 100).toFixed(1)}% accuracy</strong> on {result.test_count} test faces. These fixed-split results apply to the included identities.</p>
          <h3>First 12 test predictions</h3><PredictionGallery items={result.predictions} />
          <div className="pca-recognition-report">
          <InfoDetails title="What do the recognition metrics mean?">
            <p>Precision: how often predictions for an identity are correct. Recall: how many faces of that identity are recovered. F1 balances precision and recall. Support is the number of test faces for that identity. Accuracy is the fraction of all test predictions that are correct.</p>
          </InfoDetails>
          <div className="pca-table" tabIndex={0} role="region" aria-label="Classification report"><table><caption>Classification report · precision, recall and F1 range from 0 to 1</caption><thead><tr><th scope="col">Identity / average</th><th scope="col">Precision</th><th scope="col">Recall</th><th scope="col">F1</th><th scope="col">Support</th></tr></thead><tbody>{result.report.map(row => <tr key={row.name}><th scope="row">{row.name}</th><td>{row.precision.toFixed(3)}</td><td>{row.recall.toFixed(3)}</td><td>{row.f1.toFixed(3)}</td><td>{row.support}</td></tr>)}</tbody></table></div>
          </div></section>}
        {section === 'failures' && <section className="pca-view"><h2>Learn from the misses</h2><p>{result.misclassified_count} of {result.test_count} test faces were misclassified. {result.failures.length > 0 ? `Showing the first ${result.failures.length} in test-split order.` : 'There are no misclassifications in this run.'}</p><PredictionGallery items={result.failures} /></section>}
        <div className="pca-actions lab-downloads"><DownloadLink href={`data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify({ ...result, eigenfaces: undefined, tail_eigenfaces: undefined, predictions: undefined, failures: undefined }, null, 2))}`} download={`optiq-lab5-saved-${result.parameters.components}-components.json`}>Measurements & predictions JSON</DownloadLink></div>

      </> : !lab.error && <div className="pca-empty-state"><LabStatus>Loading saved run…</LabStatus></div>}
    </LabWorkspace>
    <LabGuide id="pca-guide" ref={guide} key={section} title={content.heading} concept={learningConcepts[section]} visual={<LearningFigure section={section} />} settingsHelp={<> <p>The component count sets how many variation patterns represent each face. Fewer components retain less information. Start with 150, then compare retained variance, recognition, and failures at a smaller count.</p>        <p>Baseline: 150 · whitened PCA · balanced RBF SVM · fixed split, seed 42.</p>
        <p className="lab-hint">Selecting a component count displays a real saved run. The code below shows how those results were generated locally.</p>
 </>}><div className="lab-canvas-reading"><article><h3>{content.heading}</h3><p>{content.explanation}</p></article>
      <article><h3>What to compare</h3><p>Start with 150 components, then try a smaller count. Compare retained variance, classification metrics, and the actual failures. More components do not guarantee better recognition.</p></article></div>
      <section><h3>Python workflow (local)</h3><pre tabIndex={0} aria-label="Python implementation"><code>{pythonExample}</code></pre></section>
      <details className="lab-preprocessing"><summary>Reproducibility & limitations</summary><ul>
        <li>LFW uses min_faces_per_person=70 and resize=0.4. The source's unstratified 80/20 split uses random_state=42.</li>
        <li>Both PCA fits use training data only. The classifier sees training projections only. Test labels are used for evaluation, never fitting.</li>
        <li>PCA centers features. Whitening rescales retained coordinates to unit training sample variance; it does not whiten the original pixels independently.</li>
        <li>The full PCA spectrum measures the 90% threshold. The randomized PCA used for recognition may differ slightly numerically. Component signs can flip without changing their meaning.</li>
        <li>These results were fitted locally and recorded before publication. Run details retain the recording time, dataset/source hashes and original compute timings; selecting a run does not train a model.</li>
        <li>Repeatedly choosing settings using these test results can bias evaluation. Treat these as learning experiments, not a final unbiased model-selection study.</li>
      </ul></details>
    </LabGuide>
  </LabPage>
}
