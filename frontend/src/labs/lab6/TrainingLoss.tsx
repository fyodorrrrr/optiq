const series = [
  { key: 'train/box_loss', label: 'Box', dash: undefined, color: 'var(--detection-box)' },
  { key: 'train/cls_loss', label: 'Classification', dash: '8 4', color: 'var(--detection-class)' },
  { key: 'train/dfl_loss', label: 'Distribution focal', dash: '2 4', color: 'var(--detection-distribution)' },
]

export default function TrainingLoss({ history }: { history: Record<string, number>[] }) {
  const available = series.filter(item => history.some(row => Number.isFinite(row[item.key])))
  const maximum = Math.max(1, ...history.flatMap(row => available.map(item => row[item.key] ?? 0)))
  const scale = Math.ceil(maximum * 2) / 2
  const description = available.map(item => {
    const values = history.map(row => row[item.key]).filter(Number.isFinite)
    return `${item.label}: ${values[0].toFixed(2)} to ${values.at(-1)!.toFixed(2)}.`
  }).join(' ')
  return <section className="detection-loss"><h3>Training loss</h3>
    <div className="detection-loss-plot"><div className="detection-loss-axis" aria-hidden="true">{[0, 1, 2, 3].map(index => <span key={index} style={{ top: `${index / 3 * 100}%` }}>{(scale * (1 - index / 3)).toFixed(1)}</span>)}</div><div><svg viewBox="0 0 504 180" preserveAspectRatio="none" role="img" aria-label={`Training loss over ${history.length} epochs. ${description}`}>
      {[0, 1, 2, 3].map(index => { const y = index * 60; return <g key={index}>
        <path d={`M0 ${y}H504`} className="detection-chart-grid" />
      </g> })}
      {available.map(item => <path key={item.key} d={history.map((row, index) => Number.isFinite(row[item.key])
        ? `${index > 0 && Number.isFinite(history[index - 1][item.key]) ? 'L' : 'M'}${index / Math.max(1, history.length - 1) * 504},${180 - row[item.key] / scale * 180}` : '').join(' ')}
        fill="none" stroke={item.color} strokeWidth="2" strokeDasharray={item.dash} vectorEffect="non-scaling-stroke" />)}
    </svg><div className="detection-loss-epochs" aria-hidden="true"><span>Epoch 1</span><span>Epoch {history.length}</span></div></div></div>
    <ul className="detection-chart-legend" aria-label="Loss curves">{available.map(item => <li key={item.key}>
      <svg viewBox="0 0 32 12" aria-hidden="true"><path d="M0 6H32" stroke={item.color} strokeWidth="2" strokeDasharray={item.dash} /></svg>{item.label}
    </li>)}</ul>
    <p>Lower loss means a better training fit, not measured accuracy.</p>
  </section>
}
