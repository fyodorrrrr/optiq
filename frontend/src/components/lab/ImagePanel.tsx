import { useRef } from 'react'
import type { KeyboardEvent, MouseEvent, PointerEvent } from 'react'
import type { ImageFrame as Frame } from '../../api/images'
import ImageMetadata from './ImageMetadata'
import InfoDetails from './InfoDetails'

export default function ImagePanel({ title, frame, onPick, empty, selection, description, showMetadata = true, metadataEssential = false, compact = false, imageAlt, pixelOverlay, onMoveSelection }: {
  onMoveSelection?: (x: number, y: number) => void
  pixelOverlay?: 'prompt' | 'selected'
  compact?: boolean; imageAlt?: string; title: string; frame: Frame | null; showMetadata?: boolean; metadataEssential?: boolean; description?: string; onPick?: (x: number, y: number) => void; empty?: string
  selection?: { x: number; y: number; width?: number; height?: number }
}) {
  const drag = useRef<{ pointerId: number; clientX: number; clientY: number; x: number; y: number; scale: number } | null>(null)
  const validSelection = frame && selection && Number.isInteger(selection.x) && Number.isInteger(selection.y)
    && selection.x >= 0 && selection.y >= 0 && selection.x < frame.width && selection.y < frame.height
    && (selection.width === undefined || (Number.isInteger(selection.width) && Number.isInteger(selection.height)
      && selection.width > 0 && selection.height !== undefined && selection.height > 0 && selection.x + selection.width <= frame.width && selection.y + selection.height <= frame.height))

  function moveCrop(x: number, y: number) {
    if (!frame || !selection || selection.width === undefined || selection.height === undefined || !onMoveSelection) return
    onMoveSelection(Math.max(0, Math.min(frame.width - selection.width, Math.round(x))),
      Math.max(0, Math.min(frame.height - selection.height, Math.round(y))))
  }

  function startDrag(event: PointerEvent<SVGRectElement>) {
    if (!frame || !selection || !onMoveSelection || !event.isPrimary || event.button !== 0) return
    const svg = event.currentTarget.ownerSVGElement
    if (!svg) return
    const bounds = svg.getBoundingClientRect()
    const scale = Math.min(bounds.width / frame.width, bounds.height / frame.height)
    if (!scale) return
    event.preventDefault()
    event.currentTarget.focus({ preventScroll: true })
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = { pointerId: event.pointerId, clientX: event.clientX, clientY: event.clientY, x: selection.x, y: selection.y, scale }
    event.currentTarget.dataset.dragging = 'true'
  }

  function dragCrop(event: PointerEvent<SVGRectElement>) {
    const start = drag.current
    if (!start || start.pointerId !== event.pointerId) return
    moveCrop(start.x + (event.clientX - start.clientX) / start.scale,
      start.y + (event.clientY - start.clientY) / start.scale)
  }

  function endDrag(event: PointerEvent<SVGRectElement>) {
    drag.current = null
    delete event.currentTarget.dataset.dragging
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }

  function moveWithKeys(event: KeyboardEvent<SVGRectElement>) {
    if (!selection) return
    const directions: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }
    const direction = directions[event.key]
    if (!direction) return
    event.preventDefault()
    const step = event.shiftKey ? 10 : 1
    moveCrop(selection.x + direction[0] * step, selection.y + direction[1] * step)
  }

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
    <figcaption>{title}</figcaption>
    <div className={`lab-image-stage ${onPick ? 'can-pick' : ''}`}>
      {frame ? <>
        <img src={frame.image} alt={imageAlt ?? `${title} image`} loading={compact ? 'lazy' : undefined} onClick={onPick ? pick : undefined} draggable={false} />
        {selection && validSelection && pixelOverlay !== 'prompt' && <svg
          className="lab-selection" aria-hidden={onMoveSelection ? undefined : true} viewBox={`0 0 ${frame.width} ${frame.height}`}>
          {selection.width !== undefined && selection.height !== undefined
            ? selection.width > 0 && selection.height > 0 && selection.x + selection.width <= frame.width && selection.y + selection.height <= frame.height && <rect className={`lab-crop-marker${onMoveSelection ? ' can-move-crop' : ''}`}
              role={onMoveSelection ? 'button' : undefined} tabIndex={onMoveSelection ? 0 : undefined}
              aria-label={onMoveSelection ? 'Move crop selection with arrow keys; hold Shift for larger steps' : undefined}
              onPointerDown={onMoveSelection ? startDrag : undefined}
              onPointerMove={onMoveSelection ? dragCrop : undefined}
              onPointerUp={onMoveSelection ? endDrag : undefined}
              onPointerCancel={onMoveSelection ? endDrag : undefined}
              onLostPointerCapture={onMoveSelection ? endDrag : undefined}
              onKeyDown={onMoveSelection ? moveWithKeys : undefined} x={selection.x} y={selection.y} width={selection.width} height={selection.height} />
            : <circle className="lab-pixel-marker" cx={selection.x + .5} cy={selection.y + .5} r={Math.max(frame.width, frame.height) * .016} />}
        </svg>}

      </>
        : <p>{empty ?? 'Choose an image to begin.'}</p>}
    </div>
    {frame && pixelOverlay && <span className="lab-pixel-hint" role="status">{!validSelection
      ? 'Check pixel coordinates'
      : pixelOverlay === 'selected' ? `Selected pixel: (${selection!.x}, ${selection!.y})` : 'Click to select a pixel'}</span>}
    {description && <p className="lab-image-description">{description}</p>}
    {frame && selection && !pixelOverlay && <p className="lab-selection-label">{validSelection
      ? <>{selection.width === undefined ? 'Selected pixel' : 'Crop origin'}: ({selection.x}, {selection.y}){selection.width !== undefined && ` · ${selection.width} × ${selection.height} px`}</>
      : 'Enter valid coordinates and dimensions to preview the selection.'}</p>}
    {frame && showMetadata && (metadataEssential
      ? <ImageMetadata frame={frame} essential />
      : <InfoDetails title="Image details"><ImageMetadata frame={frame} /></InfoDetails>)}
  </figure>
}
