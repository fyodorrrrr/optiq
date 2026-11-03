import { useCallback, useEffect, useRef, useState } from 'react'
import { FieldError, numberSetting } from '../../components/lab/validation'
import { frameFile } from '../../api/images'
import type { ImageFrame } from '../../api/images'
import { compareEdges, getSample, loadImage } from './api'
import type { EdgeResult, EdgeSettings, Sample } from './api'

const baseline = { blur_kernel: '3', sobel_kernel: '3', low_threshold: '100', high_threshold: '200' }
type Draft = typeof baseline

export default function useEdgeExperiment() {
  const [source, setSource] = useState<{ file: File; frame: ImageFrame; name: string } | null>(null)
  const [draft, setDraft] = useState<Draft>(baseline)
  const [result, setResult] = useState<EdgeResult | null>(null)
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState('')
  const [invalidField, setInvalidField] = useState('')
  const active = useRef<AbortController | null>(null)

  const accept = useCallback((frame: ImageFrame, file: File, name: string) => {
    setSource({ frame, file, name })
    setResult(null)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    active.current = controller
    getSample('shapes', controller.signal).then(frame => {
      if (!controller.signal.aborted) accept(frame, frameFile(frame, 'optiq-edges.png'), 'Shapes · generated sample')
    }).catch(error => {
      if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Could not load the sample.')
    }).finally(() => {
      if (!controller.signal.aborted) setBusy(false)
    })
    return () => active.current?.abort()
  }, [accept])

  function begin(clearResult = false) {
    active.current?.abort()
    const controller = new AbortController()
    active.current = controller
    setBusy(true)
    setError('')
    setInvalidField('')
    if (clearResult) setResult(null)
    return controller
  }

  function resetResult(clearResult = true) {
    active.current?.abort()
    setBusy(false)
    setError('')
    setInvalidField('')
    if (clearResult) setResult(null)
  }

  async function sample(kind: Sample) {
    const controller = begin(true)
    try {
      const frame = await getSample(kind, controller.signal)
      if (!controller.signal.aborted) accept(frame, frameFile(frame, `optiq-${kind}.png`), `${kind === 'noisy' ? 'Noisy shapes · seed 42' : 'Shapes'} · generated sample`)
    } catch (error) {
      if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Could not load the sample.')
    } finally {
      if (!controller.signal.aborted) setBusy(false)
    }
  }

  async function upload(file: File) {
    if (!['image/png', 'image/jpeg'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setError('Choose a PNG or JPEG no larger than 5 MiB.')
      return
    }
    const controller = begin(true)
    try {
      const frame = await loadImage(file, controller.signal)
      if (!controller.signal.aborted) accept(frame, file, file.name)
    } catch (error) {
      if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Could not load this image.')
    } finally {
      if (!controller.signal.aborted) setBusy(false)
    }
  }

  function change(key: keyof Draft, value: string) {
    resetResult(false)
    setDraft(previous => ({ ...previous, [key]: value }))
  }

  function resetBaseline() {
    resetResult(false)
    setDraft(baseline)
  }

  async function run(onInvalid?: (field: string) => void) {
    if (!source || busy) return
    const controller = begin()
    try {
      const settings: EdgeSettings = {
        blur_kernel: numberSetting(draft.blur_kernel, 'blur_kernel', 'Gaussian kernel', 1, 9),
        sobel_kernel: numberSetting(draft.sobel_kernel, 'sobel_kernel', 'Sobel kernel', 3, 7),
        low_threshold: numberSetting(draft.low_threshold, 'low_threshold', 'Lower threshold', 0, 2047),
        high_threshold: numberSetting(draft.high_threshold, 'high_threshold', 'Upper threshold', 1, 2048),
      }
      if (settings.low_threshold >= settings.high_threshold) throw new FieldError('low_threshold', 'Lower threshold must be smaller than upper threshold.')
      const response = await compareEdges(source.file, settings, controller.signal)
      if (!controller.signal.aborted) setResult(response)
    } catch (error) {
      if (!controller.signal.aborted) {
        setError(error instanceof Error ? error.message : 'Could not compare the edges.')
        if (error instanceof FieldError) { setInvalidField(error.field); onInvalid?.(error.field) }
      }
    } finally {
      if (!controller.signal.aborted) setBusy(false)
    }
  }

  const resultIsPrevious = result !== null && (Object.keys(baseline) as (keyof Draft)[]).some(key =>
    draft[key].trim() === '' || Number(draft[key]) !== result.parameters[key])

  return { invalidField, source, draft, result, resultIsPrevious, busy, error, sample, upload, change, resetBaseline, resetResult, run }
}
