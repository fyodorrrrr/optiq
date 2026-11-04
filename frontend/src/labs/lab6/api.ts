import { imageRequest } from '../../api/images'
import type { ImageFrame } from '../../api/images'
export type SampleKind = 'bus' | 'bottle'
export type Model = 'pretrained' | 'custom'
export interface Dataset {
  ready?: boolean; message?: string; names?: string[]; sha256?: string
  splits?: Record<string, { images: number; objects: number; backgrounds: number }>
}
export interface Training {
  status: string; message: string; baseline?: boolean; epochs_completed?: number; evaluation_split?: string
  metrics?: { precision: number; recall: number; map50: number; map50_95: number }
  parameters?: Record<string, string | number | boolean>
  history?: Record<string, number>[]
  weight_sha256?: string; dataset_sha256?: string
}
export interface Status {
  models: { id: Model; title: string; available: boolean; message: string }[]
  sample_available: boolean; bottle_sample_available: boolean; dataset: Dataset; training: Training
}
export interface Detection { class_id: number; label: string; confidence: number; xyxy: number[] }
export interface Result {
  output: ImageFrame; detections: Detection[]; parameters: { model: Model; confidence: number }
  elapsed_ms: number; stages_ms: Record<string, number>; provenance: Record<string, string | number>
}
export const getStatus = (signal: AbortSignal) => imageRequest<Status>(6, 'status', signal)
export const getSample = (signal: AbortSignal, kind: SampleKind = 'bus') => imageRequest<ImageFrame>(6, `sample?kind=${kind}`, signal)
export function loadImage(file: File, signal: AbortSignal) {
  const body = new FormData()
  body.set('file', file)
  return imageRequest<ImageFrame>(6, 'load', signal, body)
}
export function detect(file: File, model: Model, confidence: number, signal: AbortSignal) {
  const body = new FormData()
  body.set('file', file)
  body.set('settings', JSON.stringify({ model, confidence }))
  return imageRequest<Result>(6, 'experiment', signal, body)
}
