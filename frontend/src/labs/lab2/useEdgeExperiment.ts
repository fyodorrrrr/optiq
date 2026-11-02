import { useCallback, useEffect, useRef, useState } from 'react'
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

  function begin() {
    active.current?.abort()
    const controller = new AbortController()
    active.current = controller
    setBusy(true)
    setError('')
    setResult(null)
    return controller
  }

  function resetResult() {
    active.current?.abort()
    setBusy(false)
    setError('')
    setResult(null)
  }

  async function sample(kind: Sample) {
    const controller = begin()
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
    resetResult()
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
    resetResult()
    setDraft(previous => ({ ...previous, [key]: value }))
  }

  function resetBaseline() {
    resetResult()
    setDraft(baseline)
  }

  async function run() {
    if (!source) return
    const controller = begin()
    try {
      const entries = Object.entries(draft).map(([key, value]) => {
        if (value.trim() === '' || !Number.isInteger(Number(value))) throw new Error('Use whole numbers for thresholds and kernel sizes.')
        return [key, Number(value)]
      })
      const settings = Object.fromEntries(entries) as unknown as EdgeSettings
      if (settings.low_threshold >= settings.high_threshold) throw new Error('The lower Canny threshold must be smaller than the upper threshold.')
      const response = await compareEdges(source.file, settings, controller.signal)
      if (!controller.signal.aborted) setResult(response)
    } catch (error) {
      if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Could not compare the edges.')
    } finally {
      if (!controller.signal.aborted) setBusy(false)
    }
  }

  return { source, draft, result, busy, error, sample, upload, change, resetBaseline, resetResult, run }
}
