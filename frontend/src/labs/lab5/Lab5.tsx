import InfoDetails from '../../components/lab/InfoDetails'
import RunMetadata from '../../components/lab/RunMetadata'
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
import { NumberField } from '../../components/lab/Fields'
import { LabError, LabStatus } from '../../components/lab/LabFeedback'
import VarianceChart from './VarianceChart'
import usePcaExperiment from './usePcaExperiment'
import { sections, pythonExample } from './content'
import type { Section } from './content'
import type { Eigenface, Prediction } from './api'
import './Lab5.css'

function EigenGallery({ items }: { items: Eigenface[] }) {
  return <div className="pca-gallery">{items.map(item => <ImagePanel compact imageAlt={`Eigenface component ${item.component}; signed variation pattern, not a photograph.`} key={item.component} title={`Component ${item.component}`} frame={item.frame} showMetadata={false} description={`${(item.variance * 100).toFixed(2)}% of training variance`} />)}</div>
}
function PredictionGallery({ items }: { items: Prediction[] }) {
  return <div className="pca-gallery">{items.map(item => <ImagePanel compact imageAlt={`Test face ${item.index}. Actual identity: ${item.actual}. Predicted identity: ${item.predicted}.`} key={item.index} title={`Test face #${item.index}`} frame={item.frame} showMetadata={false} description={`Actual: ${item.actual}. Predicted: ${item.predicted}.`} />)}</div>
}
export default function Lab5() {
  const lab = usePcaExperiment()
  const [section, setSection] = useState<Section>('eigenfaces')
  const guide = useRef<HTMLElement>(null)
  const content = sections[section]
  const result = lab.result
  const stale = result && result.parameters.components !== Number(lab.components)
  return <LabPage labNumber={5} title="Find the patterns behind a face."
    description="Lab 5 — PCA & eigenfaces. Reduce dimensions, inspect variation, and test recognition on held-out faces."
    inputNote="Dataset experiment · LFW faces · no personal uploads required. Each run fits a new PCA and SVM."
    guideId="pca-guide" onOpenGuide={() => guide.current?.focus({ preventScroll: true })} wide
    actions={<LabButton disabled={lab.busy} onClick={() => void lab.refresh()}>Check dataset</LabButton>}>
    <LabWorkspace label="PCA and eigenfaces workspace" resultsId="pca-results" busy={lab.busy}
      tools={<ToolSidebar<Section> heading="Explore" value={section} onChange={setSection} tools={(Object.keys(sections) as Section[]).map(id => ({ id, label: sections[id].title,
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={sections[id].icon} /></svg>,
      }))} />}
      details={[
        { id: 'dataset', title: 'Dataset details', content: <>
        <p>{lab.dataset?.message ?? 'Checking the LFW dataset…'}</p>
        {lab.dataset?.ready && <><dl className="pca-facts"><div><dt>Faces</dt><dd>{lab.dataset.samples.toLocaleString()}</dd></div><div><dt>Image size</dt><dd>{lab.dataset.width} × {lab.dataset.height}</dd></div><div><dt>Pixel features</dt><dd>{lab.dataset.features.toLocaleString()}</dd></div><div><dt>Identities</dt><dd>{lab.dataset.names.length}</dd></div></dl>
          <details><summary>Included identities</summary><p>{lab.dataset.names.join(' · ')}</p></details></>}
</> },
        result && { id: 'run', title: 'Run details', content: <RunMetadata value={{ parameters: result.parameters, provenance: result.provenance, timings: result.timings }} /> }
      ]}
      controls={<><h2>{content.title}</h2><form onSubmit={event => { event.preventDefault(); void lab.run() }}>
        <NumberField required label="PCA components" value={lab.components} min={12} max={lab.dataset?.max_components || 300} step={1} disabled={lab.busy} onChange={lab.setComponents} />
        <div className="pca-actions"><LabButton variant="primary" type="submit" disabled={lab.busy || !lab.dataset?.ready}>Run experiment</LabButton>
          <LabButton disabled={lab.busy} onClick={() => lab.setComponents('150')}>Reset baseline</LabButton></div>
        <SettingsHelpLink guideId="pca-guide" onOpen={() => guide.current?.querySelector<HTMLButtonElement>('.learning-canvas-link')?.click()} />
      </form></>}>

      {lab.error && <LabError title="Could not run the experiment." message={lab.error} />}
      <LabStatus>{lab.busy ? 'Checking the dataset or fitting PCA and SVM… Keep this page open. Previous results remain available.'
        : lab.error ? 'Check the message above and retry.' : result ? `${stale ? 'Previous result · ' : ''}${result.parameters.components} components · ${result.train_count} training faces / ${result.test_count} held-out faces.`
          : lab.dataset?.ready ? 'Ready. Predict what will change, then run the experiment.' : 'The dataset must be prepared on this server before experiments can run.'}</LabStatus>
      {result ? <>
        {section === 'eigenfaces' && <section><h2>The first 12 eigenfaces</h2><p>Signed component weights: gray is zero, brighter is positive, darker is negative. Each component uses its own symmetric display range; brightness does not compare variance.</p>
          <EigenGallery items={result.eigenfaces} /><h2>The last 3 selected eigenfaces</h2><p>Compare these with components 1–3. The baseline ends at component 150.</p><EigenGallery items={result.tail_eigenfaces} /></section>}
        {section === 'variance' && <section><h2>How much variation remains?</h2><p><strong>{result.components_90} components</strong> retain at least 90% of training variance. Your {result.parameters.components}-component randomized PCA retains {(result.selected_variance * 100).toFixed(2)}%.</p>
          <VarianceChart values={result.cumulative_variance} threshold={result.components_90} selected={result.parameters.components} />
          <details><summary>Exact cumulative variance values</summary><div className="pca-table"><table><thead><tr><th>Components</th><th>Cumulative variance</th></tr></thead><tbody>{result.cumulative_variance.map((value, index) => <tr key={index}><td>{index + 1}</td><td>{(value * 100).toFixed(4)}%</td></tr>)}</tbody></table></div></details></section>}
        {section === 'recognition' && <section><h2>Recognition on held-out faces</h2><p><strong>{(result.accuracy * 100).toFixed(1)}% accuracy</strong> on {result.test_count} test faces. These fixed-split results apply to the included identities.</p>
          <InfoDetails title="What do the recognition metrics mean?">
            <p>Precision: how often predictions for an identity are correct. Recall: how many faces of that identity are recovered. F1 balances precision and recall. Support is the number of test faces for that identity. Accuracy is the fraction of all test predictions that are correct.</p>
          </InfoDetails>
          <div className="pca-table" tabIndex={0} role="region" aria-label="Classification report"><table><caption>Classification report · precision, recall and F1 range from 0 to 1</caption><thead><tr><th scope="col">Identity / average</th><th scope="col">Precision</th><th scope="col">Recall</th><th scope="col">F1</th><th scope="col">Support</th></tr></thead><tbody>{result.report.map(row => <tr key={row.name}><th scope="row">{row.name}</th><td>{row.precision.toFixed(3)}</td><td>{row.recall.toFixed(3)}</td><td>{row.f1.toFixed(3)}</td><td>{row.support}</td></tr>)}</tbody></table></div>
          <h3>First 12 test predictions</h3><PredictionGallery items={result.predictions} /></section>}
        {section === 'failures' && <section><h2>Learn from the misses</h2><p>{result.misclassified_count} of {result.test_count} test faces were misclassified. {result.failures.length > 0 ? `Showing the first ${result.failures.length} in test-split order.` : 'There are no misclassifications in this run.'}</p><PredictionGallery items={result.failures} /></section>}
        <div className="pca-actions lab-downloads"><DownloadLink href={`data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify({ ...result, eigenfaces: undefined, tail_eigenfaces: undefined, predictions: undefined, failures: undefined }, null, 2))}`} download="optiq-lab5-measurements.json">Measurements & predictions JSON</DownloadLink></div>

      </> : <p className="pca-empty">Run an experiment to see eigenfaces, the variance curve, recognition results, and misclassified faces. All four tools inspect the same completed run.</p>}
    </LabWorkspace>
    <LabGuide id="pca-guide" ref={guide} key={section} title={content.heading} concept={learningConcepts[section]} visual={<LearningFigure section={section} />} settingsHelp={<> <p>The component count sets how many variation patterns represent each face. Fewer components retain less information. Start with 150, then compare retained variance, recognition, and failures at a smaller count.</p>        <p>Baseline: 150 · whitened PCA · balanced RBF SVM · fixed split, seed 42.</p>
        <p className="lab-hint">Each run fits fresh models. Leaving the page or losing the connection stops waiting, but the server fit may continue. Wait for it to finish before retrying.</p>
 </>}><div className="lab-canvas-reading"><article><h3>{content.heading}</h3><p>{content.explanation}</p></article>
      <article><h3>What to compare</h3><p>Start with 150 components, then try a smaller count. Compare retained variance, classification metrics, and the actual failures. More components do not guarantee better recognition.</p></article></div>
      <section><h3>Connect it to Python</h3><pre tabIndex={0} aria-label="Python implementation"><code>{pythonExample}</code></pre></section>
      <details className="lab-preprocessing"><summary>Reproducibility & limitations</summary><ul>
        <li>LFW uses min_faces_per_person=70 and resize=0.4. The source's unstratified 80/20 split uses random_state=42.</li>
        <li>Both PCA fits use training data only. The classifier sees training projections only. Test labels are used for evaluation, never fitting.</li>
        <li>PCA centers features. Whitening rescales retained coordinates to unit training sample variance; it does not whiten the original pixels independently.</li>
        <li>The full PCA spectrum measures the 90% threshold. The randomized PCA used for recognition may differ slightly numerically. Component signs can flip without changing their meaning.</li>
        <li>Runs fit fresh models; only dataset files are cached. Leaving this page stops waiting for a response, but an active server fit finishes. One Lab 5 fit is allowed per server process.</li>
        <li>Repeatedly choosing settings using these test results can bias evaluation. Treat these as learning experiments, not a final unbiased model-selection study.</li>
      </ul></details>
    </LabGuide>
  </LabPage>
}
