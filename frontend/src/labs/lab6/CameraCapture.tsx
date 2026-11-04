import { useCallback, useEffect, useRef, useState } from 'react'
import LabButton from '../../components/lab/LabButton'
import { LabError } from '../../components/lab/LabFeedback'

export default function CameraCapture({ available, onFrame, onStop, onRunning }: {
  available: boolean; onFrame: (file: File) => Promise<boolean>; onStop: () => void; onRunning: (running: boolean) => void
}) {
  const video = useRef<HTMLVideoElement>(null)
  const stream = useRef<MediaStream | null>(null)
  const generation = useRef(0)
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const frameCallback = useRef(onFrame)
  const stopCallback = useRef(onStop)
  const runningCallback = useRef(onRunning)
  const [running, setRunning] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => { frameCallback.current = onFrame; stopCallback.current = onStop; runningCallback.current = onRunning })
  const release = useCallback(() => {
    generation.current += 1
    if (timeout.current) clearTimeout(timeout.current)
    stream.current?.getTracks().forEach(track => track.stop())
    stream.current = null
    if (video.current) video.current.srcObject = null
  }, [])
  const stop = useCallback(() => {
    release()
    setRunning(false)
    setPending(false)
    runningCallback.current(false)
    stopCallback.current()
  }, [release])
  useEffect(() => {
    function hidden() { if (document.hidden) stop() }
    document.addEventListener('visibilitychange', hidden)
    return () => {
      document.removeEventListener('visibilitychange', hidden)
      release()
      runningCallback.current(false)
      stopCallback.current()
    }
  }, [release, stop])
  async function start() {
    setError('')
    if (!navigator.mediaDevices?.getUserMedia) { setError('Camera access requires localhost or HTTPS and a supported browser. You can upload an image instead.'); return }
    release()
    const session = generation.current
    setPending(true)
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
      runningCallback.current(true)
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
        if (!blob || !await frameCallback.current(new File([blob], 'camera.jpg', { type: 'image/jpeg' }))) { stop(); return }
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
  return <details className="detection-camera" onToggle={event => {
    if (event.newState === 'closed' && (running || pending)) stop()
  }}><summary>Camera input</summary><div className="detection-actions">
    <LabButton disabled={!available || running || pending} onClick={() => void start()}>Start camera</LabButton>
    <LabButton disabled={!running && !pending} onClick={stop}>Stop camera</LabButton></div>
    <p>Frames are sent to the detection server only while running. Up to 2 requests per second, one at a time. Stop the camera before using an uploaded image.</p>
    <video ref={video} muted playsInline aria-label="Live camera preview" hidden={!running} />
    <span role="status">{running ? 'Camera running · sending frames for detection.' : pending ? 'Waiting for camera permission…' : 'Camera stopped.'}</span>
    {error && <LabError title="Camera unavailable." message={error} />}
  </details>
}
