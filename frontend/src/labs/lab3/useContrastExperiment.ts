import { useCallback, useEffect, useRef, useState } from 'react'
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

  function clear() {
    active.current?.abort()
    setBusy(false)
    setError('')
    setResult(null)
  }

  function begin() {
    active.current?.abort()
    const controller = new AbortController()
    active.current = controller
    setBusy(true)
    setError('')
    setResult(null)
    return controller
  }

  async function sample(kind: Sample) {
    const controller = begin()
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
    clear()
    if (!['image/png', 'image/jpeg'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setError('Choose a PNG or JPEG no larger than 5 MiB.')
      return
    }
    const controller = begin()
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
    clear()
    setDraft(previous => ({ ...previous, [key]: value }))
  }

  function resetBaseline() {
    clear()
    setDraft(baseline)
  }

  async function run() {
    if (!source || busy) return
    const controller = begin()
    try {
      function number(key: 'clip_limit' | 'tiles_x' | 'tiles_y' | 'alpha' | 'beta') {
        const value = Number(draft[key])
        if (draft[key].trim() === '' || !Number.isFinite(value)) throw new Error('Enter finite numbers for all contrast settings.')
        if (['tiles_x', 'tiles_y', 'beta'].includes(key) && !Number.isInteger(value)) throw new Error('Tile counts and brightness offset must be whole numbers.')
        return value
      }
      const settings: ContrastSettings = {
        mode: draft.mode === 'color' ? 'color' : 'grayscale',
        linear_method: draft.linear_method === 'stretch' ? 'stretch' : 'adjust',
        clip_limit: number('clip_limit'), tiles_x: number('tiles_x'), tiles_y: number('tiles_y'), alpha: number('alpha'), beta: number('beta'),
      }
      const response = await compareContrast(source.file, settings, controller.signal)
      if (!controller.signal.aborted) setResult(response)
    } catch (error) {
      if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Could not adjust the image contrast.')
    } finally {
      if (!controller.signal.aborted) setBusy(false)
    }
  }

  return { source, draft, result, busy, error, sample, upload, change, resetBaseline, clear, run }
}
