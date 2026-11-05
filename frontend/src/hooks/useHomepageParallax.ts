import { useEffect, useRef } from 'react'

// Ease artwork toward native scroll positions without moving the scroll container.
export default function useHomepageParallax() {
  const root = useRef<HTMLElement>(null)

  useEffect(() => {
    const element = root.current
    if (!element) return
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))
    const layers = [
      { target: element.querySelector<HTMLElement>('.hero-pixel'), anchor: element.querySelector('.intro'), depth: 80, hero: true },
      { target: element.querySelector<HTMLElement>('.intro h1'), anchor: element.querySelector('.intro'), depth: 16, hero: true },
      ...Array.from(element.querySelectorAll<HTMLElement>('.learning-card-illustration')).map((target, index) => ({
        target, anchor: target.closest('.learning-card'), depth: [40, 52, 34][index] ?? 40, hero: false,
      })),
    ].map(layer => ({ ...layer, current: 0, destination: 0 }))
    let frame = 0
    let lastTime = 0
    let disposed = false

    function animate(time: number) {
      // Frame-rate-independent easing gives a short trailing glide, then stops.
      const elapsed = lastTime ? Math.min(64, time - lastTime) : 16.67
      lastTime = time
      const ease = 1 - Math.exp(-elapsed / 145)
      let moving = false
      for (const layer of layers) {
        const difference = layer.destination - layer.current
        layer.current = Math.abs(difference) < .05 ? layer.destination : layer.current + difference * ease
        moving ||= Math.abs(layer.destination - layer.current) >= .05
        layer.target?.style.setProperty('--parallax-y', `${layer.current.toFixed(3)}px`)
      }
      frame = moving ? requestAnimationFrame(animate) : 0
      if (!moving) lastTime = 0
    }

    function update() {
      if (disposed) return
      if (preference.matches || document.hidden) {
        cancelAnimationFrame(frame)
        frame = 0
        lastTime = 0
        layers.forEach(layer => {
          layer.current = layer.destination = 0
          layer.target?.style.removeProperty('--parallax-y')
        })
        return
      }
      const mobile = window.innerWidth <= 760
      for (const layer of layers) {
        if (!layer.anchor) continue
        const bounds = layer.anchor.getBoundingClientRect()
        const progress = layer.hero
          ? clamp(-bounds.top / Math.max(1, bounds.height), 0, 1)
          : clamp((window.innerHeight - bounds.top) / (window.innerHeight + bounds.height), 0, 1)
        layer.destination = progress * layer.depth * (mobile ? .55 : 1) * (layer.hero ? 1 : -1)
      }
      if (!frame) frame = requestAnimationFrame(animate)
    }

    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    document.addEventListener('visibilitychange', update)
    preference.addEventListener('change', update)
    void document.fonts.ready.then(update)
    update()
    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
      document.removeEventListener('visibilitychange', update)
      preference.removeEventListener('change', update)
      layers.forEach(layer => layer.target?.style.removeProperty('--parallax-y'))
    }
  }, [])

  return root
}
