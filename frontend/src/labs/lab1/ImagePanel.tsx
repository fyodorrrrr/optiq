import type { MouseEvent } from 'react'
import type { Frame } from './api'

export default function ImagePanel({ title, frame, onPick, empty }: {
  title: string; frame: Frame | null; onPick?: (x: number, y: number) => void; empty?: string
}) {
  function pick(event: MouseEvent<HTMLImageElement>) {
    if (!frame || !onPick) return
    const bounds = event.currentTarget.getBoundingClientRect()
    onPick(Math.min(frame.width - 1, Math.floor((event.clientX - bounds.left) / bounds.width * frame.width)),
      Math.min(frame.height - 1, Math.floor((event.clientY - bounds.top) / bounds.height * frame.height)))
  }

  return <figure className="lab-image-panel">
    <figcaption>{title}</figcaption>
    <div className={`lab-image-stage ${onPick ? 'can-pick' : ''}`}>
      {frame ? <img src={frame.image} alt={`${title} image`} onClick={onPick ? pick : undefined} draggable={false} />
        : <p>{empty ?? 'Choose an image to begin.'}</p>}
    </div>
    {frame && <dl className="lab-metadata">
      <div><dt>Dimensions</dt><dd>{frame.width} × {frame.height} px</dd></div>
      <div><dt>Array shape</dt><dd>({frame.shape.join(', ')})</dd></div>
      <div><dt>Channels</dt><dd>{frame.channels} · {frame.color_space}</dd></div>
      <div><dt>Data type</dt><dd>{frame.dtype} · 0–255</dd></div>
    </dl>}
  </figure>
}
