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
  let response: Response
  try {
    response = await fetch(`/api/labs/${lab}/${path}`, {
      method: body ? 'POST' : 'GET', body,
      signal: AbortSignal.any([signal, AbortSignal.timeout(30000)]),
    })
  } catch (error) {
    if (signal.aborted) throw error
    throw new Error('The image service is unavailable. Please try again in a moment.', { cause: error })
  }
  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(typeof data?.detail === 'string' ? data.detail : 'Image processing failed. Check the input and try again.')
  }
  return response.json()
}

export function frameFile(frame: ImageFrame, name: string) {
  const binary = atob(frame.image.split(',')[1])
  return new File([Uint8Array.from(binary, character => character.charCodeAt(0))], name, { type: 'image/png' })
}
