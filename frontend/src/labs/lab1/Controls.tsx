import { useId } from 'react'
import { maxResizePixels, maxResizeSide, resizeError } from './resizeLimits'
import { NumberField, SelectField } from '../../components/lab/Fields'
import type { Frame, Operation } from './api'
import type { Fields } from './useLab1'

export default function Controls({ operation, fields, frame, change }: {
  operation: Operation; fields: Fields; frame: Frame
  change: (key: keyof Fields, value: string | boolean) => void
}) {
  const sizeId = useId()
  const width = Number(fields.width)
  const height = Number(fields.height)
  const validDimensions = fields.width !== '' && fields.height !== '' && Number.isInteger(width) && Number.isInteger(height) && width > 0 && height > 0
  const sizeError = validDimensions ? resizeError(width, height) : undefined

  function numeric(key: 'x' | 'y' | 'width' | 'height' | 'intensity', label: string, min: number, max: number) {
    return <NumberField key={key} label={label} min={min} max={max} step="1" required
      aria-describedby={operation === 'resize' && (key === 'width' || key === 'height') ? sizeId : undefined}
      value={fields[key]} onChange={value => change(key, value)} />
  }

  return <div className="lab-control-fields">
    {(operation === 'inspect' || operation === 'edit' || operation === 'crop') && <div className="lab-field-row">
      {numeric('x', operation === 'crop' ? 'Left (x)' : 'X coordinate', 0, frame.width - 1)}
      {numeric('y', operation === 'crop' ? 'Top (y)' : 'Y coordinate', 0, frame.height - 1)}
    </div>}
    {(operation === 'crop' || operation === 'resize') && <div className="lab-field-row">
      {numeric('width', 'Width (px)', 1, operation === 'crop' ? frame.width - Number(fields.x) : maxResizeSide)}
      {numeric('height', 'Height (px)', 1, operation === 'crop' ? frame.height - Number(fields.y) : maxResizeSide)}
    </div>}
    {operation === 'resize' && <>
      <p id={sizeId} className={`lab-resize-size${sizeError ? ' lab-field-error' : ''}`} aria-live="polite">
        {validDimensions && <>Output: {(width * height).toLocaleString()} pixels. </>}
        Maximum {maxResizeSide} px per side and {maxResizePixels.toLocaleString()} pixels total.
      </p>
      <label className="lab-check"><input type="checkbox" checked={fields.keepRatio} onChange={event => change('keepRatio', event.target.checked)} />Keep aspect ratio</label>
      <SelectField hint={fields.interpolation === 'nearest' ? 'Copies nearby pixels, keeping hard edges.' : fields.interpolation === 'area' ? 'Averages pixel areas; useful for shrinking.' : 'Blends neighboring pixels for smoother transitions.'} label="Interpolation" value={fields.interpolation} onChange={value => change('interpolation', value)} options={[
        { value: 'linear', label: 'Linear' }, { value: 'nearest', label: 'Nearest neighbor' }, { value: 'area', label: 'Area' },
      ]} />
    </>}
    {operation === 'edit' && (frame.channels === 1
      ? numeric('intensity', 'New intensity', 0, 255)
      : <label className="lab-field">New pixel color (RGB)<input type="color" value={fields.color} onChange={event => change('color', event.target.value)} /></label>)}
  </div>
}
