import { useState } from 'react'
import type { CSSProperties, PointerEvent } from 'react'

export default function PreviewComparison({ before, after, description }: { before: string; after: string; description: string }) {
  const [position, setPosition] = useState(60)
  const [dragging, setDragging] = useState(false)
  function move(event: PointerEvent<HTMLInputElement>) {
    const bounds = event.currentTarget.getBoundingClientRect()
    setPosition(Math.min(100, Math.max(0, (event.clientX - bounds.left) / bounds.width * 100)))
  }

  return <div className="preview-comparison" data-dragging={dragging} style={{ '--split': `${position}%` } as CSSProperties}>
    <img src={after} alt={description} width="640" height="480" decoding="async" />
    <img className="comparison-original" src={before} alt="" width="640" height="480" decoding="async" />
    <span className="comparison-divider" aria-hidden="true"><span>‹ ›</span></span>
    <input type="range" min="0" max="100" step="0.1" value={position}
      aria-label="Compare original and processed sample"
      aria-valuetext={`${Math.round(position)}% original image visible`}
      onPointerDown={event => {
        event.preventDefault()
        event.currentTarget.focus()
        event.currentTarget.setPointerCapture(event.pointerId)
        setDragging(true)
        move(event)
      }}
      onPointerMove={event => { if (event.currentTarget.hasPointerCapture(event.pointerId)) move(event) }}
      onPointerUp={event => {
        move(event)
        event.currentTarget.releasePointerCapture(event.pointerId)
        setDragging(false)
      }}
      onPointerCancel={() => setDragging(false)}
      onLostPointerCapture={() => setDragging(false)}
      onChange={event => setPosition(Number(event.target.value))} />
  </div>
}
