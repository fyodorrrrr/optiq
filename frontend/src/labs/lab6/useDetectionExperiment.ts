import { useEffect, useRef, useState } from 'react'
import { frameFile } from '../../api/images'
import type { ImageFrame } from '../../api/images'
import { detect, getSample, getStatus, loadImage } from './api'
import type { Model, Result, SampleKind, Status } from './api'

export default function useDetectionExperiment() {
  const [status, setStatus] = useState<Status | null>(null)
  const [statusBusy, setStatusBusy] = useState(true)
  const [statusError, setStatusError] = useState('')
  const [source, setSource] = useState<{ file: File; frame: ImageFrame; name: string } | null>(null)
  const [result, setResult] = useState<Result | null>(null)
  const [resultCamera, setResultCamera] = useState(false)
  const [confidence, setConfidence] = useState('0.25')
  const [model, setModel] = useState<Model>('pretrained')
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState('')
  const [roundtrip, setRoundtrip] = useState<number | null>(null)
  const active = useRef<AbortController | null>(null)
  useEffect(() => {
    const controller = new AbortController()
    active.current = controller
    async function initial() {
      try {
        const state = await getStatus(controller.signal)
        if (controller.signal.aborted) return
        setStatus(state)
        setStatusBusy(false)
        if (state.bottle_sample_available || state.sample_available) {
          const kind = state.bottle_sample_available ? 'bottle' : 'bus'
          try {
            const frame = await getSample(controller.signal, kind)
            if (!controller.signal.aborted) setSource({ frame, file: frameFile(frame, `${kind}.png`), name: kind === 'bottle' ? 'Bottle sample' : 'Ultralytics bus sample' })
          } catch (error) { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Could not load the sample.') }
        }
      } catch (error) { if (!controller.signal.aborted) setStatusError(error instanceof Error ? error.message : 'Could not check detector status.') }
      finally { if (!controller.signal.aborted) { setBusy(false); setStatusBusy(false) } }
    }
    void initial()
    return () => active.current?.abort()
  }, [])
  function begin(clear = false) {
    active.current?.abort()
    setStatusBusy(false)
    const controller = new AbortController()
    active.current = controller
    setBusy(true)
    setError('')
    if (clear) setResult(null)
    return controller
  }
  function cancel() {
    active.current?.abort()
    setStatusBusy(false)
    setBusy(false)
  }
  async function refresh() {
    const controller = begin()
    setStatusBusy(true)
    setStatusError('')
    try { const state = await getStatus(controller.signal); if (!controller.signal.aborted) setStatus(state) }
    catch (error) { if (!controller.signal.aborted) setStatusError(error instanceof Error ? error.message : 'Could not refresh status.') }
    finally { if (!controller.signal.aborted) { setBusy(false); setStatusBusy(false) } }
  }
  async function sample(kind: SampleKind) {
    const controller = begin(true)
    try { const frame = await getSample(controller.signal, kind); if (!controller.signal.aborted) setSource({ frame, file: frameFile(frame, `${kind}.png`), name: kind === 'bottle' ? 'Bottle sample' : 'Ultralytics bus sample' }) }
    catch (error) { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Could not load the sample.') }
    finally { if (!controller.signal.aborted) setBusy(false) }
  }
  async function upload(file: File) {
    const controller = begin(true)
    try {
      if (!['image/png', 'image/jpeg'].includes(file.type) || file.size > 5 * 1024 * 1024) throw new Error('Choose a PNG or JPEG no larger than 5 MiB.')
      const frame = await loadImage(file, controller.signal)
      if (!controller.signal.aborted) setSource({ frame, file, name: file.name })
    } catch (error) { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Could not load this image.') }
    finally { if (!controller.signal.aborted) setBusy(false) }
  }
  async function run(file = source?.file, isCamera = false): Promise<boolean> {
    if (!file) return false
    const value = Number(confidence)
    if (!Number.isFinite(value) || value <= 0 || value > 1) { setError('Confidence must be greater than 0 and at most 1.'); return false }
    const controller = begin()
    const started = performance.now()
    try {
      const response = await detect(file, model, value, controller.signal)
      if (controller.signal.aborted) return false
      setResult(response)
      setResultCamera(isCamera)
      setRoundtrip(performance.now() - started)
      return true
    } catch (error) {
      if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Detection failed.')
      return false
    } finally { if (!controller.signal.aborted) setBusy(false) }
  }
  function changeConfidence(value: string) { cancel(); setConfidence(value) }
  function changeModel(value: Model) { cancel(); setModel(value) }
  return { status, statusBusy, statusError, source, result, resultCamera, confidence, model, busy, error, roundtrip, refresh, sample, upload, run, cancel, changeConfidence, changeModel }
}
