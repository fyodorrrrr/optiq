import { useCallback, useEffect, useRef, useState } from 'react'
import { frameFile } from '../../api/images'
import type { ImageFrame } from '../../api/images'
import { compareFeatures, getCapabilities, getPair, loadImage } from './api'
import type { Capabilities, FeatureComparison, FeatureSettings, Sample, SamplePair } from './api'

interface Source { frame: ImageFrame; file: File; name: string }
const baseline = { hessian_threshold: '400', upright: false, ratio_threshold: '0.75', max_features: '500', max_matches: '50' }
export type Draft = typeof baseline

export default function useFeatureExperiment() {
  const [sources, setSources] = useState<{ first: Source | null; second: Source | null }>({ first: null, second: null })
  const [sampleNotes, setSampleNotes] = useState<string[]>([])
  const [capabilities, setCapabilities] = useState<Capabilities | null>(null)
  const [draft, setDraft] = useState(baseline)
  const [result, setResult] = useState<FeatureComparison | null>(null)
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState('')
  const active = useRef<AbortController | null>(null)

  const acceptPair = useCallback((pair: SamplePair, label: string) => {
    setSources({ first: { frame: pair.first, file: frameFile(pair.first, 'target-a.png'), name: `${label} · A` },
      second: { frame: pair.second, file: frameFile(pair.second, 'target-b.png'), name: `${label} · B` } })
    setSampleNotes(pair.notes)
    setResult(null)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    active.current = controller
    Promise.all([getCapabilities(controller.signal), getPair('rotated', controller.signal)]).then(([caps, pair]) => {
      if (!controller.signal.aborted) { setCapabilities(caps); acceptPair(pair, 'Rotated sample') }
    }).catch(error => {
      if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Could not load the image pair.')
    }).finally(() => { if (!controller.signal.aborted) setBusy(false) })
    return () => active.current?.abort()
  }, [acceptPair])

  function clear() {
    active.current?.abort()
    setBusy(false); setError(''); setResult(null)
  }

  function begin() {
    active.current?.abort()
    const controller = new AbortController()
    active.current = controller
    setBusy(true); setError(''); setResult(null)
    return controller
  }

  async function sample(kind: Sample) {
    const controller = begin()
    try {
      const [caps, pair] = await Promise.all([getCapabilities(controller.signal), getPair(kind, controller.signal)])
      if (!controller.signal.aborted) { setCapabilities(caps); acceptPair(pair, kind === 'rotated' ? 'Rotated sample' : 'Scaled sample') }
    } catch (error) {
      if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Could not load the pair.')
    } finally { if (!controller.signal.aborted) setBusy(false) }
  }

  async function upload(side: 'first' | 'second', file: File) {
    clear()
    if (!['image/png', 'image/jpeg'].includes(file.type) || file.size > 5 * 1024 * 1024) { setError('Choose a PNG or JPEG no larger than 5 MiB.'); return }
    const controller = begin()
    try {
      const frame = await loadImage(file, controller.signal)
      if (!controller.signal.aborted) {
        setSources(previous => ({ ...previous, [side]: { frame, file, name: file.name } }))
        setSampleNotes(['Custom image pair. No known geometric relationship is assumed.'])
      }
    } catch (error) {
      if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Could not load this image.')
    } finally { if (!controller.signal.aborted) setBusy(false) }
  }

  function change(key: keyof Draft, value: string | boolean) { clear(); setDraft(previous => ({ ...previous, [key]: value })) }
  function resetBaseline() { clear(); setDraft(baseline) }

  async function run() {
    if (!sources.first || !sources.second || busy) return
    const controller = begin()
    try {
      function number(key: 'hessian_threshold' | 'ratio_threshold' | 'max_features' | 'max_matches') {
        const value = Number(draft[key])
        if (draft[key].trim() === '' || !Number.isFinite(value)) throw new Error('Enter finite numbers for feature settings.')
        return value
      }
      const settings: FeatureSettings = { hessian_threshold: number('hessian_threshold'), upright: draft.upright,
        ratio_threshold: number('ratio_threshold'), max_features: number('max_features'), max_matches: number('max_matches') }
      const response = await compareFeatures(sources.first.file, sources.second.file, settings, controller.signal)
      if (!controller.signal.aborted) setResult(response)
    } catch (error) {
      if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Could not compare the features.')
    } finally { if (!controller.signal.aborted) setBusy(false) }
  }

  return { sources, sampleNotes, capabilities, draft, result, busy, error, sample, upload, change, resetBaseline, clear, run }
}
