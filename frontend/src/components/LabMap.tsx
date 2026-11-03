import { useState } from 'react'
import type { CSSProperties } from 'react'
import { labs } from '../data/labs'

const positions = [[12, 40], [37, 40], [63, 40], [88, 40], [75, 255], [49, 255], [22, 255]]
const mobilePositions = [20.6, 36.7, 48.5, 36.7, 20.6, 36.7, 48.5]

export default function LabMap() {
  const [selectedId, setSelectedId] = useState(1)
  const selected = labs.find((lab) => lab.id === selectedId) ?? labs[0]

  return (
    <section className="labs" id="labs" aria-labelledby="map-title">
      <div className="section-heading"><h2 id="map-title">Find your next experiment.</h2>
        <p>Seven labs. A suggested path. Start wherever you like.</p></div>
      <div className="lab-browser">
      <div className="map" role="group" aria-label="Choose a laboratory">
        <svg className="trail" viewBox="0 0 1100 460" preserveAspectRatio="none" aria-hidden="true"><path d="M132 80H968C1110 80 1110 295 968 295H242" /></svg>
        <svg className="mobile-trail" viewBox="0 0 330 900" preserveAspectRatio="none" aria-hidden="true"><path d="M68 35C68 95 121 95 121 165S160 230 160 295S121 360 121 425S68 490 68 555S121 620 121 685S160 750 160 815" /></svg>
        {labs.map((lab, index) => (
          <div className="node-item" key={lab.id} style={{
            '--x': `${positions[index][0]}%`, '--y': `${positions[index][1]}px`,
            '--mx': `${mobilePositions[index]}%`, '--my': `${index * 130}px`,
          } as CSSProperties}>
            <button className="node" type="button" aria-pressed={selectedId === lab.id}
              aria-label={`Lab ${lab.id}: ${lab.title}. ${lab.id === 6 ? 'Partial · custom training pending' : lab.href ? 'Available' : 'Planned'}. Show details.`}
              aria-controls="lab-details" onClick={() => setSelectedId(lab.id)}>
              <span className="face"><svg viewBox="0 0 24 24" aria-hidden="true"><path d={lab.icon} /></svg></span>
            </button>
            <div><h3>{lab.title}</h3><span className={`state ${lab.href ? 'preview' : ''}`}>
              Lab {lab.id} · {lab.id === 6 ? 'Partial · custom training pending' : lab.href ? 'Available' : 'Planned'}
            </span></div>
          </div>
        ))}
      </div>
      <div className="lab-detail" id="lab-details" aria-live="polite" aria-atomic="true">
        <div><h3 className="detail-heading">Lab {selected.id} · {selected.title}</h3>
          <p className="detail-state">{selected.id === 6 ? 'Partial · pretrained detection and local training workflow' : selected.href ? 'Python · interactive lab' : 'Planned · freely accessible when implemented'}</p></div>
        <p className="detail-copy">{selected.description}</p>
        <div className="detail-action">{selected.href
          ? <a className="button" href={selected.href}>Open lab <span aria-hidden="true">→</span></a>
          : <p className="planned-action">Module not implemented yet.</p>}</div>
      </div>
      </div>
      <p className="preview-note">Labs 1–5 are available. Lab 6 has pretrained detection; custom training is pending. Lab 7 is available; all implemented labs are freely accessible.</p>
    </section>
  )
}
