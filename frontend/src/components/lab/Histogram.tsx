import { useId } from 'react'
import './Histogram.css'

export default function Histogram({ title, counts, maxCount, channel }: {
  title: string; counts: number[]; maxCount: number; channel: string
}) {
  const id = useId()
  const scale = Math.max(1, maxCount)
  const total = counts.reduce((sum, count) => sum + count, 0)

  return <figure className="lab-histogram">
    <figcaption>{title}</figcaption>
    <div className="lab-histogram-count"><span>Pixels / bin</span><span>{maxCount.toLocaleString()}</span></div>
    <svg viewBox="0 0 256 100" preserveAspectRatio="none" role="img" aria-labelledby={`${id}-title ${id}-description`}>
      <title id={`${id}-title`}>{title}</title>
      <desc id={`${id}-description`}>{channel}. 256 intensity bins from 0 to 255. {total.toLocaleString()} pixels total. Shared count scale: 0 to {maxCount.toLocaleString()}.</desc>
      {counts.map((count, intensity) => <rect key={intensity} x={intensity} y={100 - count / scale * 100} width="1" height={count / scale * 100}>
        <title>Intensity {intensity}: {count.toLocaleString()} pixels</title>
      </rect>)}
    </svg>
    <div className="lab-histogram-axis" aria-hidden="true"><span>0</span><span>64</span><span>128</span><span>192</span><span>255</span></div>
  </figure>
}
