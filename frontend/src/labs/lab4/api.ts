import { imageRequest } from '../../api/images'
import type { ImageFrame } from '../../api/images'

export type Algorithm = 'surf' | 'sift' | 'orb'
export type Sample = 'mascot' | 'rotated' | 'scaled'
export interface FeatureSettings {
  hessian_threshold: number; upright: boolean; ratio_threshold: number; max_features: number; max_matches: number
}
export interface Capabilities {
  engine: string
  algorithms: { id: Algorithm; title: string; available: boolean; reason: string | null }[]
}
export interface SamplePair { first: ImageFrame; second: ImageFrame; notes: string[] }
export interface FeatureResult {
  algorithm: Algorithm
  status: 'ok' | 'unavailable' | 'error'
  message: string | null
  keypoints_first: number | null
  keypoints_second: number | null
  descriptor_dimensions: number | null
  descriptor_dtype: string | null
  norm: string | null
  first_ms: number | null
  second_ms: number | null
  match_ms: number | null
  good_matches: number | null
  displayed_matches: number | null
  keypoints_first_image: ImageFrame | null
  keypoints_second_image: ImageFrame | null
  matches_image: ImageFrame | null
}
export interface FeatureComparison { algorithms: FeatureResult[]; parameters: FeatureSettings; engine: string; notes: string[] }

export function getCapabilities(signal: AbortSignal) {
  return imageRequest<Capabilities>(4, 'capabilities', signal)
}
export function getPair(kind: Sample, signal: AbortSignal) {
  return imageRequest<SamplePair>(4, `sample?kind=${kind}`, signal)
}
export function loadImage(file: File, signal: AbortSignal) {
  const body = new FormData()
  body.set('file', file)
  return imageRequest<ImageFrame>(4, 'load', signal, body)
}
export function compareFeatures(first: File, second: File, settings: FeatureSettings, signal: AbortSignal) {
  const body = new FormData()
  body.set('first', first)
  body.set('second', second)
  body.set('settings', JSON.stringify(settings))
  return imageRequest<FeatureComparison>(4, 'experiment', signal, body)
}
