import { useState } from 'react'
import type { CSSProperties } from 'react'

export default function PreviewComparison({ before, after, description }: { before: string; after: string; description: string }) {
  const [position, setPosition] = useState(50)

  return <div className="preview-comparison" style={{ '--split': `${position}%` } as CSSProperties}>
    <img src={after} alt={description} width="640" height="480" decoding="async" />
    <img className="comparison-original" src={before} alt="" width="640" height="480" decoding="async" />
    <span className="comparison-divider" aria-hidden="true"><span>‹ ›</span></span>
    <input type="range" min="0" max="100" value={position}
      aria-label="Compare original and processed sample"
      aria-valuetext={`${position}% original image visible`}
      onChange={event => setPosition(Number(event.target.value))} />
  </div>
}
