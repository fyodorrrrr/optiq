import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { labs } from '../data/labs'
import LabPreview from './LabPreview'

const mobilePositions = [20.6, 36.7, 48.5, 36.7, 20.6, 36.7, 48.5]

export default function LabMap() {
  const [selectedId, setSelectedId] = useState(1)
  const [compact, setCompact] = useState(() => window.matchMedia('(max-width: 760px)').matches)
  const [trail, setTrail] = useState<{ width: number; height: number; path: string } | null>(null)
  const map = useRef<HTMLDivElement>(null)
  const selected = labs.find((lab) => lab.id === selectedId) ?? labs[0]

  useEffect(() => {
    const query = window.matchMedia('(max-width: 760px)')
    const update = () => setCompact(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    const element = map.current
    if (!element) return
    const observer = new ResizeObserver(() => {
      const bounds = element.getBoundingClientRect()
      const centers = Array.from(element.querySelectorAll<HTMLElement>('.map-stop .node')).map(node => {
        const rect = node.getBoundingClientRect()
        return { x: rect.left - bounds.left + rect.width / 2, y: rect.top - bounds.top + rect.height / 2 }
      })
      const path = centers.map((point, index) => {
        if (!index) return `M${point.x} ${point.y}`
        const previous = centers[index - 1]
        const middle = (previous.y + point.y) / 2
        return `C${previous.x} ${middle} ${point.x} ${middle} ${point.x} ${point.y}`
      }).join(' ')
      setTrail({ width: bounds.width, height: bounds.height, path })
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [compact, selectedId])

  function selectLab(id: number) {
    setSelectedId(id)
    if (compact) requestAnimationFrame(() => document.getElementById('lab-details')?.scrollIntoView({ block: 'nearest' }))
  }

  return (
    <section className="labs" id="labs" aria-labelledby="map-title">
      <div className="section-heading"><h2 id="map-title">Find your next experiment.</h2></div>
      <div className="lab-browser">
      <div ref={map} className="map" role="group" aria-label="Choose a laboratory">
        <svg className="map-trail" viewBox={trail ? `0 0 ${trail.width} ${trail.height}` : undefined} aria-hidden="true"><path d={trail?.path} /></svg>
        {labs.map((lab, index) => (
          <div className="map-stop" key={lab.id} style={{ '--mx': `${mobilePositions[index]}%`, '--my': `${index * 130}px` } as CSSProperties}>
          <button className="node-item" type="button" aria-pressed={selectedId === lab.id}
            aria-label={`Lab ${lab.id}: ${lab.title}. Show details.`}
            aria-controls="lab-details" onClick={() => selectLab(lab.id)}>
            <span className="node" aria-hidden="true">
              <span className="face"><svg viewBox="0 0 24 24" aria-hidden="true"><path d={lab.icon} /></svg></span>
            </span>
            <span className="node-copy"><span className="node-title">{lab.title}</span><span className={`state ${lab.href ? 'preview' : ''}`}>
              Lab {lab.id}
            </span></span>
          </button>
          {compact && selectedId === lab.id && <LabPreview lab={lab} compact />}
          </div>
        ))}
      </div>
      {!compact && <LabPreview lab={selected} />}
      </div>
    </section>
  )
}
