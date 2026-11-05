import { apiFetch } from '../../api/transport'
import type { ImageFrame } from '../../api/images'
export interface DatasetInfo { ready: boolean; message: string; samples: number; height: number; width: number; features: number; names: string[]; max_components: number }
export interface Eigenface { component: number; variance: number; frame: ImageFrame }
export interface Prediction { index: number; actual: string; predicted: string; frame: ImageFrame }
export interface Result {
  dataset: DatasetInfo
  parameters: { components: number }
  train_count: number; test_count: number; accuracy: number
  train_indices: number[]; test_indices: number[]; actual: number[]; predicted: number[]
  report: { name: string; kind: string; precision: number; recall: number; f1: number; support: number }[]
  eigenfaces: Eigenface[]; tail_eigenfaces: Eigenface[]
  cumulative_variance: number[]; selected_variance: number; components_90: number
  predictions: Prediction[]; failures: Prediction[]; misclassified_count: number
  timings: Record<string, number>; provenance: Record<string, string | number | boolean>
}
async function request<T>(path: string, signal: AbortSignal, components?: number): Promise<T> {
  return await apiFetch(`/api/labs/5/${path}`, signal, {
    method: components === undefined ? 'GET' : 'POST',
    headers: components === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: components === undefined ? undefined : JSON.stringify({ components }),
  }) as T
}
export const getDataset = (signal: AbortSignal) => request<DatasetInfo>('dataset', signal)
export const runExperiment = (components: number, signal: AbortSignal) => request<Result>('experiment', signal, components)
