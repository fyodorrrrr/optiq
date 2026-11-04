function label(key: string) {
  return key.replaceAll('_', ' ').replace(/^./, letter => letter.toUpperCase())
}

function Values({ value }: { value: unknown }) {
  if (value === null || value === undefined) return <>Not recorded</>
  if (Array.isArray(value)) {
    if (value.every(item => item === null || typeof item !== 'object')) return <>{value.map(String).join(', ') || 'None'}</>
    return <ol>{value.map((item, index) => <li key={index}><Values value={item} /></li>)}</ol>
  }
  if (typeof value === 'object') return <dl className="lab-detail-list">{Object.entries(value).map(([key, item]) =>
    <div key={key}><dt>{label(key)}</dt><dd><Values value={item} /></dd></div>)}</dl>
  return <>{typeof value === 'boolean' ? value ? 'Yes' : 'No' : String(value)}</>
}

export default function RunMetadata({ value }: { value: Record<string, unknown> }) {
  return <><Values value={value} /><details className="lab-drawer-raw"><summary>View raw JSON</summary>
    <pre tabIndex={0} aria-label="Raw run details"><code>{JSON.stringify(value, null, 2)}</code></pre>
  </details></>
}
