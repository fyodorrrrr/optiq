import LabButton from '../../components/lab/LabButton'
import { NumberField, SelectField } from '../../components/lab/Fields'
import type { Section } from './content'
import type useContrastExperiment from './useContrastExperiment'

export default function ContrastControls({ lab, section }: { lab: ReturnType<typeof useContrastExperiment>; section: Section }) {
  return <form onSubmit={event => { event.preventDefault(); void lab.run() }}>
    <fieldset disabled={lab.busy || !lab.source}>
      <legend className="sr-only">Contrast settings</legend>
      <SelectField label="Processing mode" value={lab.draft.mode} onChange={value => lab.change('mode', value)} options={[
        { value: 'grayscale', label: 'Grayscale intensity' },
        { value: 'color', label: 'Color · adjust Y brightness', disabled: lab.source?.frame.channels !== 3 },
      ]} />
      {(section === 'compare' || section === 'clahe') && <>
        <NumberField label="CLAHE clip limit" min="0.1" max="40" step="0.1" required value={lab.draft.clip_limit} onChange={value => lab.change('clip_limit', value)} />
        <div className="lab-field-row">
          <NumberField label="Tiles across" min="1" max="16" step="1" required value={lab.draft.tiles_x} onChange={value => lab.change('tiles_x', value)} />
          <NumberField label="Tiles down" min="1" max="16" step="1" required value={lab.draft.tiles_y} onChange={value => lab.change('tiles_y', value)} />
        </div>
      </>}
      {(section === 'compare' || section === 'linear') && <>
        <SelectField label="Linear method" value={lab.draft.linear_method} onChange={value => lab.change('linear_method', value)} options={[
          { value: 'adjust', label: 'Manual scale & offset' }, { value: 'stretch', label: 'Stretch to full range' },
        ]} />
        {lab.draft.linear_method === 'adjust' && <>
          <NumberField label="Contrast scale (α)" min="0" max="10" step="0.1" required value={lab.draft.alpha} onChange={value => lab.change('alpha', value)} />
          <NumberField label="Brightness offset (β)" min="-255" max="255" step="1" required value={lab.draft.beta} onChange={value => lab.change('beta', value)} />
        </>}
      </>}
      <LabButton variant="primary" type="submit">{lab.busy ? 'Processing…' : 'Compare contrast'}</LabButton>
    </fieldset>
    <LabButton onClick={lab.resetBaseline}>Reset baseline</LabButton>
    {lab.result && <a className="lab-view-result" href="#contrast-results">View results ↓</a>}
    <p className="lab-hint">All methods start from the same original. Histograms share one count scale.</p>
  </form>
}
