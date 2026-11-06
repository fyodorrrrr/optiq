import { imageRequest } from '../../api/images'
import type { ImageFrame } from '../../api/images'
export type Method = 'threshold' | 'region' | 'edges' | 'semantic'
export type Sample = 'mascot' | 'touching' | 'uneven' | 'contours' | 'scene'
export interface Settings {
  method: Method; invert: boolean; adaptive_block: number; adaptive_c: number
  seed_x: number; seed_y: number; tolerance: number; watershed_fraction: number
  canny_low: number; canny_high: number; closing_size: number; min_area: number; opacity: number
}
export interface SemanticStatus { available: boolean; model: string; weights: string; message: string }
export interface Result {
  parameters: Settings
  views: { title: string; description: string; frame: ImageFrame }[]
  labels_png: string | null
  legend: { id: number; name: string; color: string; pixels: number }[]
  measurements: Record<string, number>; notes: string[]; provenance: Record<string, string | number>
}
export const getStatus = (signal: AbortSignal) => imageRequest<SemanticStatus>(7, 'status', signal)
export const getSample = (kind: Sample, signal: AbortSignal) => imageRequest<ImageFrame>(7, `sample?kind=${kind}`, signal)
export function loadImage(file: File, signal: AbortSignal) {
  const body = new FormData()
  body.set('file', file)
  return imageRequest<ImageFrame>(7, 'load', signal, body)
}
export function experiment(file: File, settings: Settings, signal: AbortSignal) {
  const body = new FormData()
  body.set('file', file)
  body.set('settings', JSON.stringify(settings))
  return imageRequest<Result>(7, 'experiment', signal, body)
}
