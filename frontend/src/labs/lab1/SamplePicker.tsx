import SharedSamplePicker from '../../components/lab/SamplePicker'

import { samples } from './samples'

export default function SamplePicker({ disabled, onSelect }: {
  disabled: boolean; onSelect: (kind: 'color' | 'grayscale') => Promise<void>
}) {
  return <SharedSamplePicker disabled={disabled} options={samples} onSelect={onSelect} />
}
