import ControlHelp from '../../components/lab/ControlHelp'
import type { Section } from './content'
import type useEdgeExperiment from './useEdgeExperiment'
import { revealField } from '../../components/lab/validation'
import LabButton from '../../components/lab/LabButton'
import { NumberField, SelectField } from '../../components/lab/Fields'

export default function EdgeControls({ lab, section, onRevealSettings }: { lab: ReturnType<typeof useEdgeExperiment>; section: Section; onRevealSettings: () => void }) {
  return <form onSubmit={event => { event.preventDefault(); void lab.run(field => revealField(field, onRevealSettings)) }}>
    <fieldset disabled={lab.busy || !lab.source}>
      <legend className="sr-only">Edge detection settings</legend>
      <SelectField label="Gaussian kernel" value={lab.draft.blur_kernel} onChange={value => lab.change('blur_kernel', value)}
        options={[1, 3, 5, 7, 9].map(size => ({ value: size, label: `${size} × ${size}${size === 3 ? ' · baseline' : size === 1 ? ' · no smoothing' : ''}` }))} />
      {(section === 'compare' || section === 'sobel') && <SelectField label="Sobel kernel" value={lab.draft.sobel_kernel} onChange={value => lab.change('sobel_kernel', value)}
        options={[3, 5, 7].map(size => ({ value: size, label: `${size} × ${size}${size === 3 ? ' · baseline' : ''}` }))} />}
      {(section === 'compare' || section === 'canny') && <div className="lab-field-row">
        <NumberField name="low_threshold" error={lab.invalidField === 'low_threshold' ? lab.error : undefined} label="Lower threshold" required min="0" max="2047" step="1" value={lab.draft.low_threshold} onChange={value => lab.change('low_threshold', value)} />
        <NumberField name="high_threshold" error={lab.invalidField === 'high_threshold' ? lab.error : undefined} label="Upper threshold" required min="1" max="2048" step="1" value={lab.draft.high_threshold} onChange={value => lab.change('high_threshold', value)} />
      </div>}
      {(section === 'compare' || section === 'canny') && <p className="lab-hint">Lower must be below upper.</p>}
      <ControlHelp key={section} title="How to adjust edge detection">
        <p>Choose settings, then run both detectors. They always use the same input and Gaussian blur.</p>
        <p>Larger Gaussian kernels smooth more noise and fine detail. The Sobel kernel sets the neighborhood used to measure brightness changes.</p>
        <p>Higher Canny thresholds generally retain fewer weak edges. The lower threshold must be smaller than the upper threshold.</p>
      </ControlHelp>
      <LabButton variant="primary" type="submit">{lab.busy ? 'Processing…' : 'Run both detectors'}</LabButton>
    </fieldset>
    <LabButton disabled={lab.busy} onClick={lab.resetBaseline}>Reset baseline</LabButton>
    {lab.result && <a className="lab-view-result" href="#edge-results">View results ↓</a>}
  </form>
}
