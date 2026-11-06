import { imageRequest } from '../../api/images'
import type { ImageFrame } from '../../api/images'

export type Sample = 'mascot' | 'low-contrast' | 'uneven' | 'color'
export interface ContrastSettings {
  mode: 'grayscale' | 'color'
  clip_limit: number
  tiles_x: number
  tiles_y: number
  linear_method: 'adjust' | 'stretch'
  alpha: number
  beta: number
}

export interface ContrastView {
  frame: ImageFrame
  histogram: number[]
  statistics: { minimum: number; maximum: number; mean: number; standard_deviation: number; occupied_bins: number }
}

export interface ContrastResult {
  original: ContrastView
  equalized: ContrastView
  clahe: ContrastView
  linear: ContrastView
  parameters: ContrastSettings
  channel: string
  linear_transform: { scale: number; offset: number; note: string }
  engine: string
  notes: string[]
}

export function getSample(kind: Sample, signal: AbortSignal) {
  return imageRequest<ImageFrame>(3, `sample?kind=${kind}`, signal)
}

export function loadImage(file: File, signal: AbortSignal) {
  const body = new FormData()
  body.set('file', file)
  return imageRequest<ImageFrame>(3, 'load', signal, body)
}

export function compareContrast(file: File, settings: ContrastSettings, signal: AbortSignal) {
  const body = new FormData()
  body.set('file', file)
  body.set('settings', JSON.stringify(settings))
  return imageRequest<ContrastResult>(3, 'experiment', signal, body)
}
