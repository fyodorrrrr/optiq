const names: Record<string, string> = {
  pca: 'PCA', svm: 'SVM', iou: 'IoU', opencv: 'OpenCV', numpy: 'NumPy', sklearn: 'scikit-learn',
  imgsz: 'Image size', stages_ms: 'Timings', adaptive_c: 'Adaptive constant C', adaptive_block: 'Adaptive block size',
}

function label(key: string) {
  if (names[key]) return names[key]
  const words = key.replace(/_(seconds|ms)$/, '').split('_').map(word => names[word.toLowerCase()] ?? word)
  return words.join(' ').replace(/^./, letter => letter.toUpperCase())
}

function displayValue(key: string, value: unknown, group: string): string {
  if (value === null || value === undefined) return 'Not recorded'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'number') {
    if (key.endsWith('_seconds')) return `${value.toLocaleString(undefined, { maximumFractionDigits: 3 })} s`
    if (key.endsWith('_ms') || group === 'stages_ms') return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })} ms`
    return Number.isInteger(value) ? value.toLocaleString() : String(value)
  }
  if (Array.isArray(value)) return value.map(String).join(', ') || 'None'
  return String(value)
}

function Fields({ value, group }: { value: Record<string, unknown>; group: string }) {
  return <table className="run-metadata-table"><tbody>{Object.entries(value).map(([key, item]) =>
    <tr key={key}><th scope="row">{label(key)}</th><td>{item && typeof item === 'object' && !Array.isArray(item)
      ? <Fields value={item as Record<string, unknown>} group={key} />
      : Array.isArray(item) && item.some(entry => entry && typeof entry === 'object')
        ? <ol>{item.map((entry, index) => <li key={index}><Fields value={entry as Record<string, unknown>} group={key} /></li>)}</ol>
        : displayValue(key, item, group)}</td></tr>
  )}</tbody></table>
}

export default function RunMetadata({ value, previous = false, parameterKeys }: {
  value: Record<string, unknown>; previous?: boolean; parameterKeys?: readonly string[]
}) {
  // The compact view can filter irrelevant settings; raw JSON always preserves the complete response.
  const sections = Object.entries(value).filter(([key]) => key !== 'provenance' && key !== 'notes')
  return <div className="run-metadata">
    {previous && <p className="run-metadata-previous">Previous result</p>}
    {sections.map(([key, item]) => {
      const fields = item && typeof item === 'object' && !Array.isArray(item) ? item as Record<string, unknown> : null
      const relevant = fields && key === 'parameters' && parameterKeys
        ? Object.fromEntries(Object.entries(fields).filter(([name]) => parameterKeys.includes(name))) : fields
      return relevant ? <section key={key}><h3>{label(key)}</h3><Fields value={relevant} group={key} /></section>
        : <Fields key={key} value={{ [key]: item }} group={key} />
    })}
    {value.provenance && typeof value.provenance === 'object' ? <details className="lab-drawer-raw run-metadata-provenance">
      <summary>Provenance</summary><Fields value={value.provenance as Record<string, unknown>} group="provenance" />
    </details> : null}
    {value.notes ? <details className="lab-drawer-raw"><summary>Notes</summary>
      {Array.isArray(value.notes) ? <ul>{value.notes.map((note, index) => <li key={index}>{String(note)}</li>)}</ul> : <p>{String(value.notes)}</p>}
    </details> : null}
    <details className="lab-drawer-raw"><summary>View raw JSON</summary>
      <pre tabIndex={0} aria-label="Raw run details"><code>{JSON.stringify(value, null, 2)}</code></pre>
    </details>
  </div>
}
