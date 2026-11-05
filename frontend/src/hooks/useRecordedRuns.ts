import { useEffect, useRef, useState } from 'react'
import { readRecordedIndex, readRecordedJson } from '../api/recorded'
import type { RecordedIndex, RecordedRun } from '../api/recorded'

type SavedResult = { parameters: object; provenance: Record<string, string | number | boolean> }
async function readRun<T extends SavedResult>(lab: number, index: RecordedIndex, id: string, signal: AbortSignal) {
  const run = index.runs.find(item => item.id === id)
  if (!run) throw new Error('Choose one of the recorded runs.')
  const sample = index.samples.find(item => item.id === run.sample)!
  const result = await readRecordedJson(lab, run.file, signal, run.sha256) as T
  if (result.provenance?.execution !== 'precomputed demonstration'
    || result.provenance.input_sha256 !== sample.input_sha256
    || result.provenance.source_service_sha256 !== index.source_service_sha256
    || Object.entries(run.parameters).some(([key, value]) => (result.parameters as Record<string, unknown>)[key] !== value)) {
    throw new Error('The saved run does not match this demonstration.')
  }
  return { result, run }
}
async function initial<T extends SavedResult>(lab: number, signal: AbortSignal) {
  const index = await readRecordedIndex(lab, signal)
  return { index, saved: await readRun<T>(lab, index, index.default_run, signal) }
}

export default function useRecordedRuns<T extends SavedResult>(lab: number) {
  const [index, setIndex] = useState<RecordedIndex | null>(null)
  const [selectedId, setSelectedId] = useState('')
  const [loaded, setLoaded] = useState<{ result: T; run: RecordedRun } | null>(null)
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState('')
  const active = useRef<AbortController | null>(null)
  const cache = useRef(new Map<string, { result: T; run: RecordedRun }>())
  useEffect(() => {
    const controller = new AbortController()
    active.current = controller
    initial<T>(lab, controller.signal).then(data => {
      if (controller.signal.aborted) return
      cache.current.set(data.saved.run.id, data.saved)
      setIndex(data.index)
      setSelectedId(data.saved.run.id)
      setLoaded(data.saved)
    }).catch(error => { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Could not load saved runs.') })
      .finally(() => { if (!controller.signal.aborted) setBusy(false) })
    return () => active.current?.abort()
  }, [lab])

  async function select(id: string) {
    if (!index) return
    active.current?.abort()
    const controller = new AbortController()
    active.current = controller
    setSelectedId(id)
    setBusy(true)
    setError('')
    try {
      const saved = cache.current.get(id) ?? await readRun<T>(lab, index, id, controller.signal)
      if (controller.signal.aborted) return
      cache.current.set(id, saved)
      setLoaded(saved)
    } catch (error) { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Could not load saved run.') }
    finally { if (!controller.signal.aborted) setBusy(false) }
  }
  async function reload() {
    active.current?.abort()
    const controller = new AbortController()
    active.current = controller
    setBusy(true)
    setError('')
    cache.current.clear()
    try {
      const data = await initial<T>(lab, controller.signal)
      if (controller.signal.aborted) return
      cache.current.set(data.saved.run.id, data.saved)
      setIndex(data.index)
      setSelectedId(data.saved.run.id)
      setLoaded(data.saved)
    } catch (error) { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Could not reload saved runs.') }
    finally { if (!controller.signal.aborted) setBusy(false) }
  }
  return { index, selected: index?.runs.find(run => run.id === selectedId), result: loaded?.result ?? null,
    source: index?.samples.find(sample => sample.id === loaded?.run.sample),
    stale: Boolean(loaded && loaded.run.id !== selectedId), busy, error, select, reload }
}
