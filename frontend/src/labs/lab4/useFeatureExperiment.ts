import { useCallback, useEffect, useRef, useState } from 'react'
import { FieldError, numberSetting } from '../../components/lab/validation'
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
  const [invalidField, setInvalidField] = useState('')
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
    Promise.all([getCapabilities(controller.signal), getPair('mascot', controller.signal)]).then(([caps, pair]) => {
      if (!controller.signal.aborted) { setCapabilities(caps); acceptPair(pair, 'Optiq mascot pair') }
    }).catch(error => {
      if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Could not load the image pair.')
    }).finally(() => { if (!controller.signal.aborted) setBusy(false) })
    return () => active.current?.abort()
  }, [acceptPair])

  function clear(clearResult = true) {
    active.current?.abort()
    setBusy(false); setError(''); setInvalidField(''); if (clearResult) setResult(null)
  }

  function begin(clearResult = false) {
    active.current?.abort()
    const controller = new AbortController()
    active.current = controller
    setBusy(true); setError(''); setInvalidField(''); if (clearResult) setResult(null)
    return controller
  }

  async function sample(kind: Sample) {
    const controller = begin(true)
    try {
      const [caps, pair] = await Promise.all([getCapabilities(controller.signal), getPair(kind, controller.signal)])
      if (!controller.signal.aborted) { setCapabilities(caps); acceptPair(pair, kind === 'mascot' ? 'Optiq mascot pair' : kind === 'rotated' ? 'Rotated sample' : 'Scaled sample') }
    } catch (error) {
      if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Could not load the pair.')
    } finally { if (!controller.signal.aborted) setBusy(false) }
  }

  async function upload(side: 'first' | 'second', file: File) {
    if (!['image/png', 'image/jpeg'].includes(file.type) || file.size > 5 * 1024 * 1024) { setError('Choose a PNG or JPEG no larger than 5 MiB.'); return }
    const controller = begin(true)
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

  function change(key: keyof Draft, value: string | boolean) { clear(false); setDraft(previous => ({ ...previous, [key]: value })) }
  function resetBaseline() { clear(false); setDraft(baseline) }

  async function run(onInvalid?: (field: string) => void) {
    if (!sources.first || !sources.second || busy) return
    const controller = begin()
    try {
      const settings: FeatureSettings = {
        hessian_threshold: numberSetting(draft.hessian_threshold, 'hessian_threshold', 'SURF Hessian threshold', 1, 100000, false),
        upright: draft.upright,
        ratio_threshold: numberSetting(draft.ratio_threshold, 'ratio_threshold', 'Match ratio threshold', 0.01, 0.99, false),
        max_features: numberSetting(draft.max_features, 'max_features', 'Maximum features', 1, 1000),
        max_matches: numberSetting(draft.max_matches, 'max_matches', 'Maximum displayed matches', 1, 100),
      }
      const response = await compareFeatures(sources.first.file, sources.second.file, settings, controller.signal)
      if (!controller.signal.aborted) setResult(response)
    } catch (error) {
      if (!controller.signal.aborted) {
        setError(error instanceof Error ? error.message : 'Could not compare the features.')
        if (error instanceof FieldError) { setInvalidField(error.field); onInvalid?.(error.field) }
      }
    } finally { if (!controller.signal.aborted) setBusy(false) }
  }

  const canReset = (Object.keys(baseline) as (keyof Draft)[]).some(key => draft[key] !== baseline[key])

  const resultIsPrevious = result !== null && (Object.keys(baseline) as (keyof Draft)[]).some(key =>
    typeof draft[key] === 'boolean' ? draft[key] !== result.parameters[key] : String(draft[key]).trim() === '' || Number(draft[key]) !== result.parameters[key])

  return { canReset, invalidField, resultIsPrevious, sources, sampleNotes, capabilities, draft, result, busy, error, sample, upload, change, resetBaseline, clear, run }
}
