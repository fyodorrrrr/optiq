import { useCallback, useEffect, useRef, useState } from 'react'
import { FieldError, numberSetting } from '../../components/lab/validation'
import { frameFile } from '../../api/images'
import type { ImageFrame } from '../../api/images'
import { compareContrast, getSample, loadImage } from './api'
import type { ContrastResult, ContrastSettings, Sample } from './api'

const baseline = { mode: 'grayscale', clip_limit: '2', tiles_x: '8', tiles_y: '8', linear_method: 'adjust', alpha: '1.2', beta: '0' }
export type Draft = typeof baseline

export default function useContrastExperiment() {
  const [source, setSource] = useState<{ file: File; frame: ImageFrame; name: string } | null>(null)
  const [draft, setDraft] = useState(baseline)
  const [result, setResult] = useState<ContrastResult | null>(null)
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState('')
  const [invalidField, setInvalidField] = useState('')
  const active = useRef<AbortController | null>(null)

  const accept = useCallback((frame: ImageFrame, file: File, name: string) => {
    setSource({ frame, file, name })
    setResult(null)
    setDraft(previous => ({ ...previous, mode: frame.channels === 3 ? 'color' : 'grayscale' }))
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    active.current = controller
    getSample('low-contrast', controller.signal).then(frame => {
      if (!controller.signal.aborted) accept(frame, frameFile(frame, 'optiq-low-contrast.png'), 'Low contrast · generated sample')
    }).catch(error => {
      if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Could not load the sample.')
    }).finally(() => {
      if (!controller.signal.aborted) setBusy(false)
    })
    return () => active.current?.abort()
  }, [accept])

  function clear(clearResult = true) {
    active.current?.abort()
    setBusy(false)
    setError('')
    setInvalidField('')
    if (clearResult) setResult(null)
  }

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

  async function sample(kind: Sample) {
    const controller = begin(true)
    try {
      const frame = await getSample(kind, controller.signal)
      const label = { 'low-contrast': 'Low contrast', uneven: 'Uneven lighting · seed 42', color: 'Color study' }[kind]
      if (!controller.signal.aborted) accept(frame, frameFile(frame, `optiq-${kind}.png`), `${label} · generated sample`)
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
    clear(false)
    setDraft(previous => ({ ...previous, [key]: value }))
  }

  function resetBaseline() {
    clear(false)
    setDraft(baseline)
  }

  async function run(onInvalid?: (field: string) => void) {
    if (!source || busy) return
    const controller = begin()
    try {
      const settings: ContrastSettings = {
        mode: draft.mode === 'color' ? 'color' : 'grayscale',
        linear_method: draft.linear_method === 'stretch' ? 'stretch' : 'adjust',
        clip_limit: numberSetting(draft.clip_limit, 'clip_limit', 'CLAHE clip limit', 0.1, 40, false),
        tiles_x: numberSetting(draft.tiles_x, 'tiles_x', 'Tiles across', 1, 16),
        tiles_y: numberSetting(draft.tiles_y, 'tiles_y', 'Tiles down', 1, 16),
        alpha: draft.linear_method === 'stretch' ? 1.2 : numberSetting(draft.alpha, 'alpha', 'Contrast scale', 0, 10, false),
        beta: draft.linear_method === 'stretch' ? 0 : numberSetting(draft.beta, 'beta', 'Brightness offset', -255, 255),
      }
      const response = await compareContrast(source.file, settings, controller.signal)
      if (!controller.signal.aborted) setResult(response)
    } catch (error) {
      if (!controller.signal.aborted) {
        setError(error instanceof Error ? error.message : 'Could not adjust the image contrast.')
        if (error instanceof FieldError) { setInvalidField(error.field); onInvalid?.(error.field) }
      }
    } finally {
      if (!controller.signal.aborted) setBusy(false)
    }
  }

  const resultIsPrevious = result !== null && (Object.keys(baseline) as (keyof Draft)[]).some(key =>
    result.parameters.linear_method === 'stretch' && draft.linear_method === 'stretch' && ['alpha', 'beta'].includes(key) ? false
      : ['mode', 'linear_method'].includes(key) ? draft[key] !== result.parameters[key] : draft[key].trim() === '' || Number(draft[key]) !== result.parameters[key])

  return { invalidField, resultIsPrevious, source, draft, result, busy, error, sample, upload, change, resetBaseline, clear, run }
}
