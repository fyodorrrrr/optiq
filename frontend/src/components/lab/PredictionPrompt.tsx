import type { ReactNode } from 'react'

export default function PredictionPrompt({ children }: { children: ReactNode }) {
  return <div className="lab-prediction"><span>Predict</span><p>{children}</p></div>
}
