import RunMetadata from '../../components/lab/RunMetadata'
import type { Result } from './api'

export default function PcaRunDetails({ result, previous }: { result: Result; previous: boolean }) {
  return <RunMetadata previous={previous}
    value={{ parameters: result.parameters, provenance: result.provenance, recorded_timings: result.timings }}
    summary={<>
      <p>Recorded PCA and SVM results. Selecting this run does not train a model.</p>
      <dl className="pca-facts pca-run-facts">
        <div><dt>PCA components</dt><dd>{result.parameters.components}</dd></div>
        <div><dt>Training / test faces</dt><dd>{result.train_count.toLocaleString()} / {result.test_count.toLocaleString()}</dd></div>
        <div><dt>Retained variance</dt><dd>{(result.selected_variance * 100).toFixed(2)}%</dd></div>
        <div><dt>Test accuracy</dt><dd>{(result.accuracy * 100).toFixed(1)}%</dd></div>
      </dl>
    </>} />
}
