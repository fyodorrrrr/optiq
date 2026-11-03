import { useEffect, useRef, useState } from 'react'
import { getDataset, runExperiment } from './api'
import type { DatasetInfo, Result } from './api'

export default function usePcaExperiment() {
  const [dataset, setDataset] = useState<DatasetInfo | null>(null)
  const [components, setComponents] = useState('150')
  const [result, setResult] = useState<Result | null>(null)
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState('')
  const active = useRef<AbortController | null>(null)
  useEffect(() => {
    const controller = new AbortController()
    active.current = controller
    getDataset(controller.signal).then(data => { if (!controller.signal.aborted) setDataset(data) })
      .catch(error => { if (!controller.signal.aborted) setError(error.message) })
      .finally(() => { if (!controller.signal.aborted) setBusy(false) })
    return () => active.current?.abort()
  }, [])
  async function refresh() {
    active.current?.abort()
    const controller = new AbortController()
    active.current = controller
    setBusy(true)
    setError('')
    try { const data = await getDataset(controller.signal); if (!controller.signal.aborted) setDataset(data) }
    catch (error) { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Could not check the dataset.') }
    finally { if (!controller.signal.aborted) setBusy(false) }
  }
  async function run() {
    if (busy || !dataset?.ready) return
    const count = Number(components)
    if (!Number.isInteger(count) || count < 12 || count > dataset.max_components) { setError(`Choose a whole number from 12 to ${dataset.max_components}.`); return }
    const controller = new AbortController()
    active.current = controller
    setBusy(true)
    setError('')
    try {
      const response = await runExperiment(count, controller.signal)
      if (!controller.signal.aborted) setResult(response)
    } catch (error) { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'The experiment failed.') }
    finally { if (!controller.signal.aborted) setBusy(false) }
  }
  return { dataset, components, setComponents, result, busy, error, refresh, run }
}
