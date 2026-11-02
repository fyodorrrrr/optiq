import type { Frame, Operation } from './api'
import type { Fields } from './useLab1'

export default function Controls({ operation, fields, frame, change }: {
  operation: Operation; fields: Fields; frame: Frame
  change: (key: keyof Fields, value: string | boolean) => void
}) {
  function numeric(key: 'x' | 'y' | 'width' | 'height' | 'intensity', label: string, min: number, max: number) {
    return <label className="lab-field" key={key}>{label}<input type="number" min={min} max={max} step="1" required
      value={fields[key]} onChange={event => change(key, event.target.value)} /></label>
  }

  return <>
    {(operation === 'inspect' || operation === 'edit' || operation === 'crop') && <div className="lab-field-row">
      {numeric('x', operation === 'crop' ? 'Left (x)' : 'X coordinate', 0, frame.width - 1)}
      {numeric('y', operation === 'crop' ? 'Top (y)' : 'Y coordinate', 0, frame.height - 1)}
    </div>}
    {(operation === 'crop' || operation === 'resize') && <div className="lab-field-row">
      {numeric('width', 'Width (px)', 1, operation === 'crop' ? frame.width - Number(fields.x) : 4096)}
      {numeric('height', 'Height (px)', 1, operation === 'crop' ? frame.height - Number(fields.y) : 4096)}
    </div>}
    {operation === 'resize' && <>
      <label className="lab-check"><input type="checkbox" checked={fields.keepRatio} onChange={event => change('keepRatio', event.target.checked)} />Keep aspect ratio</label>
      <label className="lab-field">Interpolation<select value={fields.interpolation} onChange={event => change('interpolation', event.target.value)}>
        <option value="linear">Linear · blend neighbors</option><option value="nearest">Nearest · keep hard edges</option><option value="area">Area · useful for shrinking</option>
      </select></label>
    </>}
    {operation === 'edit' && (frame.channels === 1
      ? numeric('intensity', 'New intensity', 0, 255)
      : <label className="lab-field">New pixel color (RGB)<input type="color" value={fields.color} onChange={event => change('color', event.target.value)} /></label>)}
    {(operation === 'inspect' || operation === 'edit') && <p className="lab-hint">Click the original image to choose a pixel, or enter coordinates above. Then run the experiment.</p>}
  </>
}
