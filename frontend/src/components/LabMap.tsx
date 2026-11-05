import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { labs } from '../data/labs'
import LabPreview from './LabPreview'

const groupEnds: Record<number, number> = { 3: 1, 5: 4, 7: 6 }

const mobilePositions = [20.6, 36.7, 48.5, 36.7, 20.6, 36.7, 48.5]
const groups: Record<number, string> = {
  1: 'Foundations',
  4: 'Features & recognition',
  6: 'Detection & segmentation',
}

function HandwrittenLine({ text }: { text: string }) {
  return <span className="map-note-line" aria-hidden="true">{[...text].map((letter, index) => {
    const position = text.length > 1 ? index / (text.length - 1) * 2 - 1 : 0
    return <span className="map-note-letter" key={index} style={{
      '--note-rise': `${position * position * 2.5}px`,
      '--note-tilt': `${position * 6}deg`,
    } as CSSProperties}>{letter === ' ' ? '\u00a0' : letter}</span>
  })}</span>
}


export default function LabMap() {
  const [selectedId, setSelectedId] = useState(1)
  const [hoveredId, setHoveredId] = useState<number | null>(null)
  const [focusedId, setFocusedId] = useState<number | null>(null)
  const [compact, setCompact] = useState(() => window.matchMedia('(max-width: 760px)').matches)
  const [trail, setTrail] = useState<{ width: number; height: number; path: string; segments: { path: string; fraction: number }[] } | null>(null)
  const map = useRef<HTMLDivElement>(null)
  const anchor = useRef<{ element: HTMLButtonElement; top: number } | null>(null)
  const selected = labs.find((lab) => lab.id === selectedId) ?? labs[0]
  const activeId = hoveredId ?? focusedId ?? selectedId

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
      const segments = centers.slice(1).map((point, index) => {
        const previous = centers[index]
        const middle = (previous.y + point.y) / 2
        const path = `M${previous.x} ${previous.y}C${previous.x} ${middle} ${point.x} ${middle} ${point.x} ${point.y}`
        const curve = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        curve.setAttribute('d', path)
        return { path, fraction: Math.min(.4, 64 / Math.max(1, curve.getTotalLength())) }
      })
      setTrail({ width: bounds.width, height: bounds.height, path, segments })
    })
    observer.observe(element)
    element.querySelectorAll('.map-stop').forEach(stop => observer.observe(stop))
    return () => observer.disconnect()
  }, [compact, selectedId])

  useLayoutEffect(() => {
    const previous = anchor.current
    anchor.current = null
    if (compact && previous?.element.isConnected) {
      window.scrollBy({ top: previous.element.getBoundingClientRect().top - previous.top, behavior: 'instant' })
    }
  }, [compact, selectedId])

  function selectLab(id: number, element: HTMLButtonElement) {
    if (id === selectedId) return
    if (compact) anchor.current = { element, top: element.getBoundingClientRect().top }
    setSelectedId(id)
  }

  return (
    <section className="labs" id="labs" aria-labelledby="map-title">
      <div className="section-heading"><h2 id="map-title">Find your next experiment.</h2></div>
      <div className="lab-browser">
      <div ref={map} className="map" role="group" aria-label="Choose a laboratory">
        <svg className="map-trail" viewBox={trail ? `0 0 ${trail.width} ${trail.height}` : undefined} aria-hidden="true">
          <path d={trail?.path} />
          {labs.map((lab, index) => <g className="map-trail-highlight" data-active={activeId === lab.id} key={lab.id}>
            {trail?.segments[index - 1] && <path d={trail.segments[index - 1].path} pathLength="1" strokeDasharray={`${trail.segments[index - 1].fraction} ${1 - trail.segments[index - 1].fraction}`} strokeDashoffset={trail.segments[index - 1].fraction - 1} />}
            {trail?.segments[index] && <path d={trail.segments[index].path} pathLength="1" strokeDasharray={`${trail.segments[index].fraction} ${1 - trail.segments[index].fraction}`} />}
          </g>)}
        </svg>
        {labs.map((lab, index) => (
          <div className="map-stop" key={lab.id} data-group-start={Boolean(groups[lab.id])} data-divider={Boolean(groups[lab.id] && index > 0)} style={{ '--mx': `${mobilePositions[index]}%`, '--my': `${index * 104 + Object.keys(groups).filter(id => Number(id) > 1 && Number(id) <= lab.id).length * 32}px` } as CSSProperties}>
          {groups[lab.id] && index > 0 && <svg className="map-group-divider" viewBox="0 0 400 28" preserveAspectRatio="none" aria-hidden="true" focusable="false">
            <path d={lab.id === 4 ? 'M4 18C80 2 120 25 200 14S320 4 396 14' : 'M4 10C90 25 145 2 215 13S330 24 396 9'} />
          </svg>}
          <button className="node-item" type="button" aria-pressed={selectedId === lab.id} data-engaged={activeId === lab.id}
            aria-label={`Lab ${lab.id}: ${lab.title}. Show details.`}
            onPointerEnter={event => { if (event.pointerType !== 'touch') setHoveredId(lab.id) }} onPointerLeave={() => setHoveredId(null)}
            onFocus={() => setFocusedId(lab.id)} onBlur={() => setFocusedId(null)}
            aria-controls="lab-details" onClick={event => selectLab(lab.id, event.currentTarget)}>
            <span className="node" aria-hidden="true">
              <span className="face"><svg viewBox="0 0 24 24" aria-hidden="true"><path d={lab.icon} /></svg></span>
            </span>
            <span className="node-copy"><span className="node-title">{lab.title}</span><span className={`state ${lab.href ? 'preview' : ''}`}>
              Lab {lab.id}
            </span></span>
          </button>
          {compact && selectedId === lab.id && <LabPreview lab={lab} compact />}
          {groupEnds[lab.id] && <h3 className="map-group-heading" aria-label={groups[groupEnds[lab.id]]} data-group={groupEnds[lab.id]} data-align={lab.id === 5 ? 'right' : 'left'}>
            {(groups[groupEnds[lab.id]].includes(' & ')
              ? groups[groupEnds[lab.id]].replace(' & ', ' &|').split('|')
              : [groups[groupEnds[lab.id]]]).map(line => <HandwrittenLine key={line} text={line} />)}
          </h3>}
          </div>
        ))}
      </div>
      {!compact && <LabPreview lab={selected} />}
      </div>
    </section>
  )
}
