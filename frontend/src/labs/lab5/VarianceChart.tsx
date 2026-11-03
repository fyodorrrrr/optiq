export default function VarianceChart({ values, threshold, selected }: { values: number[]; threshold: number; selected: number }) {
  const x = (count: number) => (count - 1) / Math.max(1, values.length - 1) * 600
  const y = (value: number) => 220 - value * 220
  return <figure className="pca-variance"><figcaption>Cumulative explained variance · full training spectrum</figcaption>
    <div className="pca-chart-scroll"><div className="pca-variance-plot">
      <div className="pca-variance-y" aria-hidden="true">{[0, .5, .9, 1].map(value => <span key={value} style={{ top: `${(1 - value) * 100}%` }}>{value * 100}%</span>)}</div>
      <svg viewBox="-4 -4 608 228" preserveAspectRatio="none" role="img" aria-label={`${threshold} components retain 90 percent of training variance. Selected count: ${selected}. The curve shows cumulative training variance, not recognition accuracy.`}>
        {[0, .5, .9, 1].map(value => <line key={value} x1="0" x2="600" y1={y(value)} y2={y(value)} stroke="currentColor" opacity=".15" />)}
        <polyline points={values.map((value, index) => `${x(index + 1)},${y(value)}`).join(' ')} fill="none" stroke="var(--accent)" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
        <line x1={x(threshold)} x2={x(threshold)} y1="0" y2="220" stroke="currentColor" strokeDasharray="5 5" />
        <circle cx={x(selected)} cy={y(values[selected - 1])} r="4" fill="currentColor" />
      </svg>
      <div className="pca-variance-x" aria-hidden="true"><span>1</span><span>{values.length}</span></div>
      <p className="pca-axis-title">Number of components</p>
    </div></div><p>Dashed line: 90% threshold ({threshold}). Dot: selected component count. Variance measures training-data variation, not recognition accuracy.</p>
  </figure>
}
