import { apiFetch } from '../../api/transport'

export interface Frame {
  image: string
  width: number
  height: number
  channels: number
  shape: number[]
  dtype: string
  color_space: 'BGR' | 'Grayscale'
  notes: string[]
}

export interface PixelValue {
  bgr: number[] | null
  rgb: number[] | null
  intensity: number | null
}

export interface ExperimentResult {
  result: Frame
  operation: Operation
  parameters: Record<string, unknown>
  engine: string
  pixel: null | {
    x: number
    y: number
    before: PixelValue
    after: PixelValue
    before_zoom: string
    after_zoom: string
  }
}

export type Operation = 'inspect' | 'edit' | 'grayscale' | 'crop' | 'resize' | 'rotate'

async function request<T>(path: string, signal: AbortSignal, body?: FormData): Promise<T> {
  return await apiFetch(`/api/labs/1/${path}`, signal, {
    method: body ? 'POST' : 'GET', body,
  }) as T
}

export type Sample = 'mascot' | 'color' | 'grayscale'

export function getSample(kind: Sample, signal: AbortSignal) {
  return request<Frame>(`sample?kind=${kind}`, signal)
}

export function loadImage(file: File, signal: AbortSignal) {
  const body = new FormData()
  body.set('file', file)
  return request<Frame>('load', signal, body)
}

export function runExperiment(file: File, settings: Record<string, unknown>, signal: AbortSignal) {
  const body = new FormData()
  body.set('file', file)
  body.set('settings', JSON.stringify(settings))
  return request<ExperimentResult>('experiment', signal, body)
}

export function sampleFile(frame: Frame) {
  const binary = atob(frame.image.split(',')[1])
  return new File([Uint8Array.from(binary, (character) => character.charCodeAt(0))], 'optiq-sample.png', { type: 'image/png' })
}
