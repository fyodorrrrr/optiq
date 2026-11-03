import { NumberField, SelectField } from '../../components/lab/Fields'
import type { Frame, Operation } from './api'
import type { Fields } from './useLab1'

export default function Controls({ operation, fields, frame, change }: {
  operation: Operation; fields: Fields; frame: Frame
  change: (key: keyof Fields, value: string | boolean) => void
}) {
  function numeric(key: 'x' | 'y' | 'width' | 'height' | 'intensity', label: string, min: number, max: number) {
    return <NumberField key={key} label={label} min={min} max={max} step="1" required
      value={fields[key]} onChange={value => change(key, value)} />
  }

  return <div className="lab-control-fields">
    {(operation === 'inspect' || operation === 'edit' || operation === 'crop') && <div className="lab-field-row">
      {numeric('x', operation === 'crop' ? 'Left (x)' : 'X coordinate', 0, frame.width - 1)}
      {numeric('y', operation === 'crop' ? 'Top (y)' : 'Y coordinate', 0, frame.height - 1)}
    </div>}
    {(operation === 'crop' || operation === 'resize') && <div className="lab-field-row">
      {numeric('width', 'Width (px)', 1, operation === 'crop' ? frame.width - Number(fields.x) : 4096)}
      {numeric('height', 'Height (px)', 1, operation === 'crop' ? frame.height - Number(fields.y) : 4096)}
    </div>}
    {operation === 'resize' && <>
      <label className="lab-check"><input type="checkbox" checked={fields.keepRatio} onChange={event => change('keepRatio', event.target.checked)} />Keep aspect ratio (avoid stretching)</label>
      <SelectField hint={fields.interpolation === 'nearest' ? 'Copies nearby pixels, keeping hard edges.' : fields.interpolation === 'area' ? 'Averages pixel areas; useful for shrinking.' : 'Blends neighboring pixels for smoother transitions.'} label="Interpolation" value={fields.interpolation} onChange={value => change('interpolation', value)} options={[
        { value: 'linear', label: 'Linear' }, { value: 'nearest', label: 'Nearest neighbor' }, { value: 'area', label: 'Area' },
      ]} />
    </>}
    {operation === 'edit' && (frame.channels === 1
      ? numeric('intensity', 'New intensity', 0, 255)
      : <label className="lab-field">New pixel color (RGB)<input type="color" value={fields.color} onChange={event => change('color', event.target.value)} /></label>)}
  </div>
}
