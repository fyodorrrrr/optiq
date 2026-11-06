import SharedSamplePicker from '../../components/lab/SamplePicker'

import { samples } from './samples'
import type { Sample } from './api'

export default function SamplePicker({ disabled, onSelect }: {
  disabled: boolean; onSelect: (kind: Sample) => Promise<void>
}) {
  return <SharedSamplePicker disabled={disabled} options={samples} onSelect={onSelect} />
}
