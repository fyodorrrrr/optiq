import { useRef } from 'react'
import LabButton from './LabButton'

export default function ImageUploadButton({ busy, onUpload, label = 'Upload image' }: {
  busy: boolean; onUpload: (file: File) => Promise<void>; label?: string
}) {
  const file = useRef<HTMLInputElement>(null)
  return <>
    <LabButton variant="primary" data-pending={busy} disabled={busy} onClick={() => file.current?.click()}>{label}</LabButton>
    <input ref={file} className="lab-file" type="file" accept="image/png,image/jpeg" aria-label={label === 'Upload image' ? 'Choose image file' : `Choose file for ${label}`} onChange={event => {
      const selected = event.target.files?.[0]
      if (selected) void onUpload(selected)
      event.target.value = ''
    }} />
  </>
}
