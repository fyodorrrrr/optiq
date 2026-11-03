export default function VarianceChart({ values, threshold, selected }: { values: number[]; threshold: number; selected: number }) {
  const x = (count: number) => 50 + (count - 1) / Math.max(1, values.length - 1) * 600
  const y = (value: number) => 240 - value * 200
  return <figure className="pca-variance"><figcaption>Cumulative explained variance · full training spectrum</figcaption>
    <div className="pca-chart-scroll" tabIndex={0} role="region" aria-label="Scrollable variance chart"><svg viewBox="0 0 700 290" role="img" aria-label={`${threshold} components retain 90 percent of training variance. Selected count: ${selected}.`}>
      {[0, .5, .9, 1].map(value => <g key={value}><line x1="50" x2="650" y1={y(value)} y2={y(value)} stroke="currentColor" opacity=".15" /><text x="42" y={y(value) + 4} textAnchor="end">{value * 100}%</text></g>)}
      <polyline points={values.map((value, index) => `${x(index + 1)},${y(value)}`).join(' ')} fill="none" stroke="var(--accent)" strokeWidth="2.5" />
      <line x1={x(threshold)} x2={x(threshold)} y1="40" y2="240" stroke="currentColor" strokeDasharray="5 5" />
      <circle cx={x(selected)} cy={y(values[selected - 1])} r="5" fill="currentColor" />
      <text x="50" y="260">1</text><text x="650" y="260" textAnchor="end">{values.length}</text><text x="350" y="282" textAnchor="middle">Number of components</text>
    </svg></div><p>Dashed line: 90% threshold ({threshold}). Dot: selected component count. Variance measures training-data variation, not recognition accuracy.</p>
  </figure>
}
