import { renderFree } from './profile'

// Vite replaces this at build time; keep it empty for the local /api proxy.
const configuredOrigin = (import.meta.env.VITE_API_BASE_URL ?? '').trim().replace(/\/$/, '')
if (configuredOrigin) {
  const origin = new URL(configuredOrigin)
  if (origin.origin !== configuredOrigin || (origin.protocol !== 'https:' && !(import.meta.env.DEV && origin.protocol === 'http:'))) {
    throw new Error('VITE_API_BASE_URL must be an HTTPS origin without a path.')
  }
}

export function apiUrl(path: string) {
  return `${configuredOrigin}${path}`
}

export async function apiFetch(path: string, signal: AbortSignal, init: RequestInit = {}) {
  // Settle superseded effect cancellation before opening a connection.
  await Promise.resolve()
  signal.throwIfAborted()
  const timeout = AbortSignal.timeout(init.method === 'POST' ? 120000 : renderFree ? 90000 : 30000)
  try {
    // Read the response body inside the same deadline as the request.
    const response = await fetch(apiUrl(path), { ...init, signal: AbortSignal.any([signal, timeout]) })
    const data: unknown = await response.json().catch((error: unknown) => {
      if (signal.aborted || timeout.aborted) throw error
      return null
    })
    if (!response.ok) {
      const detail = typeof data === 'object' && data !== null && 'detail' in data ? data.detail : null
      throw new Error(typeof detail === 'string' ? detail : 'The request failed. Please try again.')
    }
    if (data === null) throw new Error('The service returned an unexpected response. Please try again.')
    return data
  } catch (error) {
    if (signal.aborted) throw error
    if (timeout.aborted) {
      throw new Error('The request took too long. Processing may still be running; wait before retrying.', { cause: error })
    }
    if (error instanceof TypeError) {
      throw new Error('Could not reach the service. Check your connection and try again.', { cause: error })
    }
    throw error
  }
}
