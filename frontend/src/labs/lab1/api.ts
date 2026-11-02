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
  let response: Response
  try {
    response = await fetch(`/api/labs/1/${path}`, {
      method: body ? 'POST' : 'GET', body,
      signal: AbortSignal.any([signal, AbortSignal.timeout(30000)]),
    })
  } catch (error) {
    if (signal.aborted) throw error
    throw new Error('Could not reach the image service. Check that FastAPI is running, then try again.', { cause: error })
  }
  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(typeof data?.detail === 'string' ? data.detail : 'Image processing failed. Check your input and try again.')
  }
  return response.json()
}

export function getSample(kind: 'color' | 'grayscale', signal: AbortSignal) {
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
