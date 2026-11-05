import { useEffect, useState } from 'react'
import mascot from '../../assets/learning/start.png'

export default function LabConnectionLoading() {
  const [longWait, setLongWait] = useState(false)
  useEffect(() => {
    const timer = setTimeout(() => setLongWait(true), 5500)
    return () => clearTimeout(timer)
  }, [])

  return <div className="lab-connection-loading" role="status" aria-live="polite">
    <img src={mascot} alt="" width="112" height="80" className="lab-loading-mascot" />
    <span className="lab-loading-dots" aria-hidden="true"><i /><i /><i /></span>
    <h3>Connecting to the lab…</h3>
    <p>{longWait ? 'The server may be waking up. This can take about a minute.' : 'Waiting for the image service.'}</p>
  </div>
}
