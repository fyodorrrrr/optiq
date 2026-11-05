import { useState } from 'react'
import { apiUrl } from '../api/transport'

export default function BackendStatus() {
  const [status, setStatus] = useState('Check the connection to the Optiq backend.')
  const [loading, setLoading] = useState(false)

  async function checkBackend() {
    setLoading(true)
    setStatus('Connecting…')

    try {
      const response = await fetch(apiUrl('/api/health'), {
        signal: AbortSignal.timeout(10000),
      })
      if (!response.ok) throw new Error('Backend request failed')

      const data: unknown = await response.json()
      if (
        typeof data !== 'object' || data === null ||
        !('status' in data) || data.status !== 'ok' ||
        !('message' in data) || typeof data.message !== 'string'
      ) throw new Error('Unexpected backend response')

      setStatus(data.message)
    } catch {
      setStatus('Could not connect. Start the FastAPI backend and try again.')
    } finally {
      setLoading(false)
    }
  }

  return <details className="backend-status"><summary>Development connection check</summary>
    <button className="secondary-button" disabled={loading} onClick={checkBackend}>
      {loading ? 'Connecting…' : 'Check backend connection'}
    </button><p role="status">{status}</p>
  </details>
}
