import { useEffect, useRef, useState } from 'react'
import type { DatasetInfo, Result } from './api'
import { readRecordedJson } from '../../api/recorded'

interface Manifest {
  schema_version: number
  execution: string
  dataset_sha256: string
  source_service_sha256: string
  dataset: DatasetInfo
  runs: { components: number; file: string; sha256: string }[]
}
const readJson = (file: string, signal: AbortSignal, hash?: string) => readRecordedJson(5, file, signal, hash)

async function readManifest(signal: AbortSignal) {
  const index = await readJson('manifest.json', signal) as Manifest
  if (index.schema_version !== 1 || index.execution !== 'precomputed'
    || !index.dataset?.ready || !Array.isArray(index.runs)
    || !index.runs.some(run => run.components === 150)
    || index.runs.some(run => !Number.isInteger(run.components)
      || run.file !== `components-${run.components}.json` || !/^[a-f0-9]{64}$/.test(run.sha256))) {
    throw new Error('The saved-run index is invalid. Reload the saved runs.')
  }
  return index
}

async function readRun(index: Manifest, count: number, signal: AbortSignal) {
  const entry = index.runs.find(run => run.components === count)
  if (!entry) throw new Error('Choose one of the recorded component counts.')
  const data = await readJson(entry.file, signal, entry.sha256) as Result
  if (data.parameters?.components !== count || data.provenance?.execution !== 'precomputed demonstration'
    || data.provenance.dataset_sha256 !== index.dataset_sha256
    || data.provenance.source_service_sha256 !== index.source_service_sha256) {
    throw new Error('The saved run does not match this demonstration.')
  }
  return data
}

async function baseline(signal: AbortSignal) {
  const index = await readManifest(signal)
  return { index, result: await readRun(index, 150, signal) }
}

export default function usePcaDemo() {
  const [manifest, setManifest] = useState<Manifest | null>(null)
  const [components, setSelected] = useState('150')
  const [result, setResult] = useState<Result | null>(null)
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState('')
  const active = useRef<AbortController | null>(null)
  const saved = useRef(new Map<number, Result>())

  useEffect(() => {
    const controller = new AbortController()
    active.current = controller
    baseline(controller.signal).then(data => {
      if (controller.signal.aborted) return
      saved.current.set(150, data.result)
      setManifest(data.index)
      setResult(data.result)
    }).catch(error => {
      if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Could not load the saved runs.')
    }).finally(() => { if (!controller.signal.aborted) setBusy(false) })
    return () => active.current?.abort()
  }, [])

  async function refresh() {
    active.current?.abort()
    const controller = new AbortController()
    active.current = controller
    setBusy(true)
    setError('')
    saved.current.clear()
    try {
      const data = await baseline(controller.signal)
      if (controller.signal.aborted) return
      saved.current.set(150, data.result)
      setManifest(data.index)
      setSelected('150')
      setResult(data.result)
    } catch (error) {
      if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Could not load the saved runs.')
    } finally { if (!controller.signal.aborted) setBusy(false) }
  }

  async function select(value: string) {
    if (!manifest) return
    active.current?.abort()
    const controller = new AbortController()
    active.current = controller
    setSelected(value)
    setBusy(true)
    setError('')
    try {
      const count = Number(value)
      const data = saved.current.get(count) ?? await readRun(manifest, count, controller.signal)
      if (controller.signal.aborted) return
      saved.current.set(count, data)
      setResult(data)
    } catch (error) { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Could not load this saved run.') }
    finally { if (!controller.signal.aborted) setBusy(false) }
  }

  return { dataset: manifest?.dataset ?? null, components, result, busy, error,
    setComponents: (value: string) => { void select(value) }, refresh,
    options: manifest?.runs.map(run => ({ value: run.components, label: `${run.components} components` })) ?? [],
  }
}
