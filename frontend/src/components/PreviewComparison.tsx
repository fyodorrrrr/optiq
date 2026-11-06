export default function PreviewComparison({ before, after, description }: { before: string; after: string; description: string }) {
  return <div className="preview-comparison" role="img" aria-label={`Fixed comparison: original on the left, processed result on the right. ${description}`}>
    <img src={after} alt="" width="640" height="480" loading="lazy" decoding="async" />
    <img className="comparison-original" src={before} alt="" width="640" height="480" loading="lazy" decoding="async" />
    <span className="comparison-divider" aria-hidden="true" />
  </div>
}
