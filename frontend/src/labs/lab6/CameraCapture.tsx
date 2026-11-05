import { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import type { Ref } from 'react'
import { LabError } from '../../components/lab/LabFeedback'

export type CameraState = 'idle' | 'pending' | 'running'
export interface CameraCaptureHandle { start: () => Promise<void>; stop: () => void }

export default function CameraCapture({ available, onFrame, onStop, onState, ref }: {
  available: boolean; onFrame: (file: File) => Promise<boolean>; onStop: () => void
  onState: (state: CameraState) => void; ref?: Ref<CameraCaptureHandle>
}) {
  const video = useRef<HTMLVideoElement>(null)
  const stream = useRef<MediaStream | null>(null)
  const generation = useRef(0)
  const active = useRef(false)
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const frameCallback = useRef(onFrame)
  const stopCallback = useRef(onStop)
  const activeCallback = useRef(onState)
  const [running, setRunning] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => { frameCallback.current = onFrame; stopCallback.current = onStop; activeCallback.current = onState })
  const release = useCallback(() => {
    generation.current += 1
    if (timeout.current) clearTimeout(timeout.current)
    stream.current?.getTracks().forEach(track => track.stop())
    stream.current = null
    if (video.current) video.current.srcObject = null
  }, [])
  const stop = useCallback(() => {
    release()
    active.current = false
    setRunning(false)
    setPending(false)
    activeCallback.current('idle')
    stopCallback.current()
  }, [release])
  useEffect(() => {
    function hidden() { if (document.hidden && active.current) stop() }
    document.addEventListener('visibilitychange', hidden)
    return () => {
      document.removeEventListener('visibilitychange', hidden)
      release()
      activeCallback.current('idle')
      if (active.current) stopCallback.current()
      active.current = false
    }
  }, [release, stop])
  async function start() {
    if (active.current || !available) return
    setError('')
    if (!navigator.mediaDevices?.getUserMedia) { setError('Camera access requires localhost or HTTPS and a supported browser. You can upload an image instead.'); return }
    release()
    const session = generation.current
    setPending(true)
    active.current = true
    activeCallback.current('pending')
    try {
      const media = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 640 }, height: { ideal: 480 } }, audio: false })
      if (session !== generation.current) { media.getTracks().forEach(track => track.stop()); return }
      stream.current = media
      if (!video.current) { stop(); return }
      video.current.srcObject = media
      await video.current.play()
      if (session !== generation.current) return
      setPending(false)
      setRunning(true)
      activeCallback.current('running')
      const canvas = document.createElement('canvas')
      async function next() {
        if (session !== generation.current || !video.current) return
        const started = performance.now()
        const view = video.current
        if (!view.videoWidth || !view.videoHeight) { timeout.current = setTimeout(() => void next(), 250); return }
        const scale = Math.min(1, 640 / Math.max(view.videoWidth, view.videoHeight))
        canvas.width = Math.max(1, Math.round(view.videoWidth * scale))
        canvas.height = Math.max(1, Math.round(view.videoHeight * scale))
        canvas.getContext('2d')?.drawImage(view, 0, 0, canvas.width, canvas.height)
        const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', .85))
        if (session !== generation.current) return
        const succeeded = blob && await frameCallback.current(new File([blob], 'camera.jpg', { type: 'image/jpeg' }))
        if (session !== generation.current) return
        if (!succeeded) { stop(); return }
        if (session === generation.current) timeout.current = setTimeout(() => void next(), Math.max(0, 500 - (performance.now() - started)))
      }
      void next()
      media.getVideoTracks().forEach(track => { track.onended = () => { if (session === generation.current) { setError('The camera disconnected. Reconnect it or upload an image.'); stop() } } })
    } catch (error) {
      if (session !== generation.current) return
      const name = error instanceof DOMException ? error.name : ''
      setError(name === 'NotAllowedError' ? 'Camera access was denied. Allow camera access in your browser settings, then retry, or upload an image.' : 'Could not start the camera. Check that it is connected and available, or upload an image.')
      stop()
    }
  }
  useImperativeHandle(ref, () => ({ start, stop }))
  return <figure className="lab-image-panel detection-camera">
    <figcaption>Live camera</figcaption>
    <div className="lab-image-stage">
      <video ref={video} muted playsInline aria-label="Live camera preview" hidden={!running} />
      {!running && <svg className="detection-camera-placeholder" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d="M14 8l6-3v14l-6-3M4 6h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" /></svg>}
    </div>
    <p role="status">{running ? 'Camera running · up to 2 frames/s.' : pending ? 'Waiting for camera permission…' : 'Camera stopped.'}</p>
    <p>Frames are sent for detection only while the camera is running.</p>
    {error && <LabError title="Camera unavailable." message={error} />}
  </figure>
}
