import { useEffect, useRef } from 'react'
import './HeroShapes.css'

// Chunky pixel silhouettes complement the mascot without competing with the copy.
const shapes = [
  'M32 0h32v32h32v32H64v32H32V64H0V32h32z',
  'M24 0h48v24h24v48H72v24H24V72H0V24h24zm8 32v32h32V32z',
  'M0 0h32v32h32v32h32v32H32V64H0z',
  'M0 0h96v96H0zm24 24v48h48V24z',
]

export default function HeroShapes() {
  const artwork = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = artwork.current
    const hero = root?.closest('section')
    if (!root || !hero) return
    const allowed = matchMedia('(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)')
    const elements = Array.from(root.querySelectorAll<SVGSVGElement>('svg'))
    let frame = 0
    let visible = true
    let targetX = 0
    let targetY = 0
    let x = 0
    let y = 0
    const paint = () => elements.forEach((element, index) => {
      const depth = index % 2 ? 16 : 8
      element.style.transform = `translate(${x * depth}px, ${y * depth}px)`
    })
    const reset = () => {
      cancelAnimationFrame(frame)
      frame = 0
      targetX = targetY = x = y = 0
      paint()
    }
    const tick = () => {
      frame = 0
      if (!visible || document.hidden || !allowed.matches) return reset()
      x += (targetX - x) * .12
      y += (targetY - y) * .12
      const settled = Math.abs(targetX - x) < .001 && Math.abs(targetY - y) < .001
      if (settled) { x = targetX; y = targetY }
      paint()
      if (!settled) frame = requestAnimationFrame(tick)
    }
    const start = () => {
      if (!frame && visible && !document.hidden && allowed.matches) frame = requestAnimationFrame(tick)
    }
    const move = (event: PointerEvent) => {
      if (!allowed.matches || event.pointerType === 'touch') return
      const bounds = root.getBoundingClientRect()
      targetX = Math.max(-1, Math.min(1, (event.clientX - bounds.left) / bounds.width * 2 - 1))
      targetY = Math.max(-1, Math.min(1, (event.clientY - bounds.top) / bounds.height * 2 - 1))
      start()
    }
    const leave = () => { targetX = targetY = 0; start() }
    const hide = () => { if (document.hidden) reset() }
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (!visible) reset()
    })
    observer.observe(hero)
    hero.addEventListener('pointermove', move, { passive: true })
    hero.addEventListener('pointerleave', leave)
    allowed.addEventListener('change', reset)
    document.addEventListener('visibilitychange', hide)
    return () => {
      reset()
      observer.disconnect()
      hero.removeEventListener('pointermove', move)
      hero.removeEventListener('pointerleave', leave)
      allowed.removeEventListener('change', reset)
      document.removeEventListener('visibilitychange', hide)
    }
  }, [])

  return <div className="hero-shapes" ref={artwork} aria-hidden="true">
    {shapes.map((path, index) => <svg key={index} viewBox="0 0 96 96" focusable="false"><path fillRule="evenodd" d={path} /></svg>)}
  </div>
}
