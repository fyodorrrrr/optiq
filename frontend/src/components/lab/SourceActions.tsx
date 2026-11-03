import ImageUploadButton from './ImageUploadButton'
import SamplePicker from './SamplePicker'
import type { SampleOption } from './SamplePicker'

export default function SourceActions<T extends string>({ busy, samples, onSample, onUpload }: {
  busy: boolean; samples: SampleOption<T>[]; onSample: (value: T) => Promise<void>; onUpload: (file: File) => Promise<void>
}) {
  return <>
    <ImageUploadButton busy={busy} onUpload={onUpload} />
    <SamplePicker disabled={busy} options={samples} onSelect={onSample} />
  </>
}
