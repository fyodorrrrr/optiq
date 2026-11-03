import type { ContrastResult } from './api'

export default function ContrastRunDetails({ result }: { result: ContrastResult }) {
  const settings = result.parameters
  const views = [
    ['Original', result.original], ['Global equalization', result.equalized],
    ['CLAHE', result.clahe], ['Linear adjustment', result.linear],
  ] as const

  return <details className="lab-result-disclosure lab-preprocessing">
    <summary>Run settings & measurements</summary>
    <dl className="lab-run-settings">
      <div><dt>Processing mode</dt><dd>{settings.mode === 'color' ? 'Color · Y brightness' : 'Grayscale'}</dd></div>
      <div><dt>CLAHE clip limit</dt><dd>{settings.clip_limit}</dd></div>
      <div><dt>Tile grid</dt><dd>{settings.tiles_x} × {settings.tiles_y}</dd></div>
      <div><dt>Linear method</dt><dd>{settings.linear_method === 'stretch' ? 'Stretch to full range' : 'Manual scale & offset'}</dd></div>
      <div><dt>Applied scale</dt><dd>{result.linear_transform.scale.toLocaleString(undefined, { maximumFractionDigits: 4 })}</dd></div>
      <div><dt>Applied offset</dt><dd>{result.linear_transform.offset.toLocaleString(undefined, { maximumFractionDigits: 4 })}</dd></div>
    </dl>
    <div className="lab-measurements-scroll" tabIndex={0} role="region" aria-label="Brightness measurements comparison">
      <table className="lab-measurements-table">
        <caption>{result.channel} · measurements from the displayed run</caption>
        <thead><tr><th scope="col">Method</th><th scope="col">Minimum</th><th scope="col">Maximum</th><th scope="col">Mean</th></tr></thead>
        <tbody>{views.map(([label, view]) => <tr key={label}><th scope="row">{label}</th>
          <td>{view.statistics.minimum}</td><td>{view.statistics.maximum}</td><td>{view.statistics.mean.toFixed(1)}</td>
        </tr>)}</tbody>
      </table>
    </div>
    <p className="lab-measurements-note">Minimum and maximum are observed brightness values. Mean is average brightness. Applied coefficients are rounded here; exact values and additional statistics are available below.</p>
    <details className="lab-metadata-help"><summary>Raw response</summary><pre>{JSON.stringify({
      engine: result.engine, parameters: settings, linear_transform: result.linear_transform, channel: result.channel,
      statistics: Object.fromEntries(views.map(([label, view]) => [label, view.statistics])),
    }, null, 2)}</pre></details>
  </details>
}
