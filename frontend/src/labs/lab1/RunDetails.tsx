import type { ExperimentResult, Frame } from './api'
import { experiments } from './content'

const parameterLabels: Record<string, string> = {
  x: 'X coordinate', y: 'Y coordinate', width: 'Width', height: 'Height',
  color: 'New color (RGB)', intensity: 'New intensity', interpolation: 'Interpolation', quarter_turns: 'Rotation',
}

function parameterValue(name: string, value: unknown): string {
  if (name === 'quarter_turns') return `${Number(value) * 90}°${Number(value) ? ' clockwise' : ' · original orientation'}`
  if (name === 'width' || name === 'height') return `${value} px`
  if (name === 'interpolation') return value === 'nearest' ? 'Nearest neighbor' : value === 'linear' ? 'Linear' : value === 'area' ? 'Area' : String(value)
  return Array.isArray(value) ? value.join(', ') : String(value)
}

export default function RunDetails({ output, source, previous }: {
  output: ExperimentResult; source: Frame | undefined; previous: boolean
}) {
  return <>
    <p>{previous ? 'These settings produced the previous result shown in the workspace.' : 'These settings produced the displayed result.'}</p>
    <dl className="lab-detail-list">
      <div><dt>Operation</dt><dd>{experiments[output.operation].title}</dd></div>
      {Object.entries(output.parameters).filter(([key]) => key !== 'operation').map(([key, value]) => <div key={key}>
        <dt>{parameterLabels[key] ?? key}</dt><dd>{parameterValue(key, value)}</dd>
      </div>)}
      <div><dt>Engine</dt><dd>{output.engine}</dd></div>
      {source && <div><dt>Original pixel type</dt><dd>{source.dtype}</dd></div>}
      <div><dt>Result pixel type</dt><dd>{output.result.dtype}</dd></div>
    </dl>
    <details className="lab-drawer-raw"><summary>View raw JSON</summary>
      <pre tabIndex={0} aria-label="Raw run parameters"><code>{JSON.stringify({ parameters: output.parameters, engine: output.engine, original_dtype: source?.dtype, result_dtype: output.result.dtype }, null, 2)}</code></pre>
    </details>
  </>
}
