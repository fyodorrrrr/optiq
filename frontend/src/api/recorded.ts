import type { ImageFrame } from './images'

export interface RecordedRun {
  id: string
  sample: string
  parameters: Record<string, string | number>
  file: string
  sha256: string
}
export interface RecordedIndex {
  schema_version: number
  execution: string
  recorded_utc: string
  source_service_sha256: string
  default_run: string
  samples: { id: string; title: string; frame: ImageFrame; input_sha256: string }[]
  runs: RecordedRun[]
  context?: unknown
  training_log?: { file: string; sha256: string }
}
export function recordedUrl(lab: number, file: string) {
  return `${import.meta.env.BASE_URL}demos/lab${lab}/${file}`
}
export async function readRecordedJson(lab: number, file: string, signal: AbortSignal, hash?: string): Promise<unknown> {
  signal.throwIfAborted()
  const response = await fetch(recordedUrl(lab, file), { signal, cache: 'no-cache' })
  if (!response.ok) throw new Error('This saved run is unavailable. Reload the saved runs to try again.')
  const content = await response.arrayBuffer()
  if (hash) {
    const digest = await crypto.subtle.digest('SHA-256', content)
    const actual = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')
    if (actual !== hash) throw new Error('The saved run does not match its recording. Reload the saved runs.')
  }
  signal.throwIfAborted()
  return JSON.parse(new TextDecoder().decode(content))
}
export async function readRecordedIndex(lab: number, signal: AbortSignal) {
  const index = await readRecordedJson(lab, 'manifest.json', signal) as RecordedIndex
  if (index.schema_version !== 1 || index.execution !== 'precomputed'
    || !Array.isArray(index.samples) || !Array.isArray(index.runs)
    || !index.runs.some(run => run.id === index.default_run)
    || index.runs.some(run => !/^[a-z0-9-]+$/.test(run.id) || run.file !== `${run.id}.json`
      || !/^[a-f0-9]{64}$/.test(run.sha256) || !index.samples.some(sample => sample.id === run.sample))) {
    throw new Error('The saved-run index is invalid. Reload the saved runs.')
  }
  return index
}
