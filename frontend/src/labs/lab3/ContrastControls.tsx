import SettingsHelpLink from '../../components/lab/SettingsHelpLink'
import { revealField } from '../../components/lab/validation'
import LabButton from '../../components/lab/LabButton'
import { NumberField, SelectField } from '../../components/lab/Fields'
import type { Section } from './content'
import type useContrastExperiment from './useContrastExperiment'

export default function ContrastControls({ lab, section, onRevealSettings }: { lab: ReturnType<typeof useContrastExperiment>; section: Section; onRevealSettings: () => void }) {
  return <form onSubmit={event => { event.preventDefault(); void lab.run(field => revealField(field, onRevealSettings)) }}>
    <fieldset disabled={lab.busy || !lab.source}>
      <legend className="sr-only">Contrast settings</legend>
      <SelectField label="Processing mode" value={lab.draft.mode} onChange={value => lab.change('mode', value)} options={[
        { value: 'grayscale', label: 'Grayscale intensity' },
        { value: 'color', label: 'Color · adjust Y brightness', disabled: lab.source?.frame.channels !== 3 },
      ]} />
      <div className="lab-settings-group">
      {(section === 'compare' || section === 'clahe') && <details className="lab-settings-disclosure" open={section === 'clahe' || ['clip_limit', 'tiles_x', 'tiles_y'].includes(lab.invalidField)}><summary>CLAHE settings</summary>
        <NumberField name="clip_limit" error={lab.invalidField === 'clip_limit' ? lab.error : undefined} label="CLAHE clip limit" min="0.1" max="40" step="0.1" required value={lab.draft.clip_limit} onChange={value => lab.change('clip_limit', value)} />
        <div className="lab-field-row">
          <NumberField name="tiles_x" error={lab.invalidField === 'tiles_x' ? lab.error : undefined} label="Tiles across" min="1" max="16" step="1" required value={lab.draft.tiles_x} onChange={value => lab.change('tiles_x', value)} />
          <NumberField name="tiles_y" error={lab.invalidField === 'tiles_y' ? lab.error : undefined} label="Tiles down" min="1" max="16" step="1" required value={lab.draft.tiles_y} onChange={value => lab.change('tiles_y', value)} />
        </div>
      </details>}
      {(section === 'compare' || section === 'linear') && <details className="lab-settings-disclosure" open={section === 'linear' || ['alpha', 'beta'].includes(lab.invalidField)}><summary>Linear adjustment settings</summary>
        <SelectField label="Linear method" value={lab.draft.linear_method} onChange={value => lab.change('linear_method', value)} options={[
          { value: 'adjust', label: 'Manual scale & offset' }, { value: 'stretch', label: 'Stretch to full range' },
        ]} />
        {lab.draft.linear_method === 'adjust' && <>
          <NumberField name="alpha" error={lab.invalidField === 'alpha' ? lab.error : undefined} label="Contrast scale (α)" min="0" max="10" step="0.1" required value={lab.draft.alpha} onChange={value => lab.change('alpha', value)} />
          <NumberField name="beta" error={lab.invalidField === 'beta' ? lab.error : undefined} label="Brightness offset (β)" min="-255" max="255" step="1" required value={lab.draft.beta} onChange={value => lab.change('beta', value)} />
        </>}
      </details>}
      </div>
      <LabButton variant="primary" type="submit" aria-busy={lab.busy}>Compare contrast</LabButton>
    </fieldset>
    {lab.canReset && <LabButton disabled={lab.busy} onClick={lab.resetBaseline}>Reset baseline</LabButton>}
      <SettingsHelpLink guideId="contrast-guide" />
  </form>
}
