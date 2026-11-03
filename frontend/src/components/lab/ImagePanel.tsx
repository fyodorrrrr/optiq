import type { MouseEvent } from 'react'
import type { ImageFrame as Frame } from '../../api/images'
import ImageMetadata from './ImageMetadata'

export default function ImagePanel({ title, frame, onPick, empty, selection, description, showMetadata = true, metadataEssential = false, compact = false, imageAlt }: {
  compact?: boolean; imageAlt?: string; title: string; frame: Frame | null; showMetadata?: boolean; metadataEssential?: boolean; description?: string; onPick?: (x: number, y: number) => void; empty?: string
  selection?: { x: number; y: number; width?: number; height?: number }
}) {
  const validSelection = frame && selection && Number.isInteger(selection.x) && Number.isInteger(selection.y)
    && selection.x >= 0 && selection.y >= 0 && selection.x < frame.width && selection.y < frame.height
    && (selection.width === undefined || (Number.isInteger(selection.width) && Number.isInteger(selection.height)
      && selection.width > 0 && selection.height !== undefined && selection.height > 0 && selection.x + selection.width <= frame.width && selection.y + selection.height <= frame.height))

  function pick(event: MouseEvent<HTMLImageElement>) {
    if (!frame || !onPick) return
    const bounds = event.currentTarget.getBoundingClientRect()
    const scale = Math.min(bounds.width / frame.width, bounds.height / frame.height)
    const x = (event.clientX - bounds.left - (bounds.width - frame.width * scale) / 2) / scale
    const y = (event.clientY - bounds.top - (bounds.height - frame.height * scale) / 2) / scale
    if (x < 0 || y < 0 || x >= frame.width || y >= frame.height) return
    onPick(Math.floor(x), Math.floor(y))
  }

  return <figure className={`lab-image-panel${compact ? ' is-compact' : ''}`}>
    <figcaption>{title}{!compact && <span className="lab-preview-scale">Fit to panel</span>}</figcaption>
    <div className={`lab-image-stage ${onPick ? 'can-pick' : ''}`}>
      {frame ? <>
        <img src={frame.image} alt={imageAlt ?? `${title} image`} loading={compact ? 'lazy' : undefined} onClick={onPick ? pick : undefined} draggable={false} />
        {selection && validSelection && <svg
          className="lab-selection" viewBox={`0 0 ${frame.width} ${frame.height}`} aria-hidden="true">
          {selection.width !== undefined && selection.height !== undefined
            ? selection.width > 0 && selection.height > 0 && selection.x + selection.width <= frame.width && selection.y + selection.height <= frame.height && <rect className="lab-crop-marker" x={selection.x} y={selection.y} width={selection.width} height={selection.height} />
            : <circle className="lab-pixel-marker" cx={selection.x + .5} cy={selection.y + .5} r={Math.max(frame.width, frame.height) * .016} />}
        </svg>}
      </>
        : <p>{empty ?? 'Choose an image to begin.'}</p>}
    </div>
    {description && <p className="lab-image-description">{description}</p>}
    {frame && selection && <p className="lab-selection-label">{validSelection
      ? <>{selection.width === undefined ? 'Selected pixel' : 'Crop origin'}: ({selection.x}, {selection.y}){selection.width !== undefined && ` · ${selection.width} × ${selection.height} px`}</>
      : 'Enter valid coordinates and dimensions to preview the selection.'}</p>}
    {frame && showMetadata && (metadataEssential
      ? <ImageMetadata frame={frame} essential />
      : <details className="lab-metadata-help"><summary>Image details</summary><ImageMetadata frame={frame} /></details>)}
  </figure>
}
