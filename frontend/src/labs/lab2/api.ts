import { imageRequest } from '../../api/images'
import type { ImageFrame } from '../../api/images'

export interface EdgeSettings {
  blur_kernel: number
  sobel_kernel: number
  low_threshold: number
  high_threshold: number
}

export interface EdgeResult {
  original: ImageFrame
  blurred: ImageFrame
  sobel: ImageFrame
  sobel_x: ImageFrame
  sobel_y: ImageFrame
  canny: ImageFrame
  parameters: EdgeSettings
  engine: string
  display_scaling: string
  statistics: {
    sobel_max: number
    sobel_x_min: number
    sobel_x_max: number
    sobel_y_min: number
    sobel_y_max: number
    canny_edge_pixels: number
    canny_edge_percent: number
  }
}

export type Sample = 'shapes' | 'noisy'

export function getSample(kind: Sample, signal: AbortSignal) {
  return imageRequest<ImageFrame>(2, `sample?kind=${kind}`, signal)
}

export function loadImage(file: File, signal: AbortSignal) {
  const body = new FormData()
  body.set('file', file)
  return imageRequest<ImageFrame>(2, 'load', signal, body)
}

export function compareEdges(file: File, settings: EdgeSettings, signal: AbortSignal) {
  const body = new FormData()
  body.set('file', file)
  body.set('settings', JSON.stringify(settings))
  return imageRequest<EdgeResult>(2, 'experiment', signal, body)
}
