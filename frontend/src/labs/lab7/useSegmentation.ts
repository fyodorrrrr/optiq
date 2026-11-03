import { useEffect, useRef, useState } from 'react'
import { frameFile } from '../../api/images'
import type { ImageFrame } from '../../api/images'
import { experiment, getSample, getStatus, loadImage } from './api'
import type { Method, Result, Sample, SemanticStatus, Settings } from './api'
const baseline = { invert: false, adaptive_block: '31', adaptive_c: '5', seed_x: '170', seed_y: '180', tolerance: '20', watershed_fraction: '0.7', canny_low: '60', canny_high: '150', closing_size: '3', min_area: '50', opacity: '0.5' }
export type Draft = typeof baseline
export default function useSegmentation() {
  const [source, setSource] = useState<{ file: File; frame: ImageFrame; name: string } | null>(null)
  const [method, setMethod] = useState<Method>('threshold')
  const [draft, setDraft] = useState(baseline)
  const [status, setStatus] = useState<SemanticStatus | null>(null)
  const [result, setResult] = useState<Result | null>(null)
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState('')
  const active = useRef<AbortController | null>(null)
  function accept(frame: ImageFrame, file: File, name: string) {
    setSource({ frame, file, name })
    setResult(null)
    setDraft(previous => ({ ...previous, seed_x: String(Math.min(Number(previous.seed_x) || 0, frame.width - 1)), seed_y: String(Math.min(Number(previous.seed_y) || 0, frame.height - 1)) }))
  }
  useEffect(() => {
    const controller = new AbortController()
    active.current = controller
    Promise.all([getSample('touching', controller.signal), getStatus(controller.signal)]).then(([frame, state]) => {
      if (!controller.signal.aborted) { accept(frame, frameFile(frame, 'touching.png'), 'Touching objects'); setStatus(state) }
    }).catch(error => { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Could not load the sample.') })
      .finally(() => { if (!controller.signal.aborted) setBusy(false) })
    return () => active.current?.abort()
  }, [])
  function cancel() { active.current?.abort(); setBusy(false); setError('') }
  function begin() {
    active.current?.abort()
    const controller = new AbortController()
    active.current = controller
    setBusy(true)
    setError('')
    return controller
  }
  async function sample(kind: Sample) {
    const controller = begin()
    try {
      const frame = await getSample(kind, controller.signal)
      if (!controller.signal.aborted) accept(frame, frameFile(frame, `${kind}.png`), { touching: 'Touching objects', uneven: 'Uneven lighting', contours: 'Closed contours', scene: 'Natural scene · Ultralytics bus sample' }[kind])
    } catch (error) { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Could not load this sample.') }
    finally { if (!controller.signal.aborted) setBusy(false) }
  }
  async function upload(file: File) {
    const controller = begin()
    try {
      if (!['image/png', 'image/jpeg'].includes(file.type) || file.size > 5 * 1024 * 1024) throw new Error('Choose a PNG or JPEG up to 5 MiB.')
      const frame = await loadImage(file, controller.signal)
      if (!controller.signal.aborted) accept(frame, file, file.name)
    } catch (error) { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Could not load this image.') }
    finally { if (!controller.signal.aborted) setBusy(false) }
  }
  function change(key: keyof Draft, value: string | boolean) { cancel(); setDraft(previous => ({ ...previous, [key]: value })) }
  function choose(value: Method) { cancel(); setMethod(value) }
  function seed(x: number, y: number) { cancel(); setDraft(previous => ({ ...previous, seed_x: String(x), seed_y: String(y) })) }
  function reset() { cancel(); setDraft({ ...baseline, seed_x: String(Math.min(170, (source?.frame.width ?? 171) - 1)), seed_y: String(Math.min(180, (source?.frame.height ?? 181) - 1)) }) }
  function settings(): Settings {
    const numeric = Object.fromEntries(Object.entries(draft).filter(([key]) => key !== 'invert').map(([key, value]) => {
      if (typeof value !== 'string' || value.trim() === '' || !Number.isFinite(Number(value))) throw new Error('Enter finite values for the segmentation settings.')
      return [key, Number(value)]
    })) as Omit<Settings, 'method' | 'invert'>
    return { ...numeric, method, invert: draft.invert }
  }
  async function run() {
    if (!source || busy) return
    const controller = begin()
    try { const response = await experiment(source.file, settings(), controller.signal); if (!controller.signal.aborted) setResult(response) }
    catch (error) { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Segmentation failed.') }
    finally { if (!controller.signal.aborted) setBusy(false) }
  }
  async function refresh() {
    const controller = begin()
    try { const response = await getStatus(controller.signal); if (!controller.signal.aborted) setStatus(response) }
    catch (error) { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Could not check semantic setup.') }
    finally { if (!controller.signal.aborted) setBusy(false) }
  }
  let stale = false
  // Compare by fields because backend serialization order can differ.
  if (result) { try { const current = settings(); stale = (Object.keys(current) as (keyof Settings)[]).some(key => current[key] !== result.parameters[key]) } catch { stale = true } }
  return { source, method, draft, status, result, busy, error, stale, sample, upload, change, choose, seed, reset, run, refresh }
}
