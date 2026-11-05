import { apiFetch } from './transport'

export interface ImageFrame {
  image: string
  width: number
  height: number
  channels: number
  shape: number[]
  dtype: string
  color_space: 'BGR' | 'Grayscale'
  notes: string[]
}

export async function imageRequest<T>(lab: number, path: string, signal: AbortSignal, body?: FormData): Promise<T> {
  return await apiFetch(`/api/labs/${lab}/${path}`, signal, {
    method: body ? 'POST' : 'GET', body,
  }) as T
}

export function frameFile(frame: ImageFrame, name: string) {
  const binary = atob(frame.image.split(',')[1])
  return new File([Uint8Array.from(binary, character => character.charCodeAt(0))], name, { type: 'image/png' })
}
