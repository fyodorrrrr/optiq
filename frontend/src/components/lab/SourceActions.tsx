import { useRef } from 'react'
import LabButton from './LabButton'
import SamplePicker from './SamplePicker'
import type { SampleOption } from './SamplePicker'

export default function SourceActions<T extends string>({ busy, samples, onSample, onUpload }: {
  busy: boolean; samples: SampleOption<T>[]; onSample: (value: T) => Promise<void>; onUpload: (file: File) => Promise<void>
}) {
  const file = useRef<HTMLInputElement>(null)
  return <>
    <LabButton variant="primary" disabled={busy} onClick={() => file.current?.click()}>Upload image</LabButton>
    <SamplePicker disabled={busy} options={samples} onSelect={onSample} />
    <input ref={file} className="lab-file" type="file" accept="image/png,image/jpeg" aria-label="Choose image file" onChange={event => {
      const selected = event.target.files?.[0]
      if (selected) void onUpload(selected)
      event.target.value = ''
    }} />
  </>
}
