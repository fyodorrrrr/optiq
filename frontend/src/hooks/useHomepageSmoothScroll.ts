import { useEffect } from 'react'
import type { RefObject } from 'react'
import Lenis from 'lenis'
import { useNavigate } from 'react-router'
import 'lenis/dist/lenis.css'

export default function useHomepageSmoothScroll(root: RefObject<HTMLElement | null>) {
  const navigate = useNavigate()

  useEffect(() => {
    const element = root.current
    if (!element) return
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    let lenis: Lenis | undefined

    function configure() {
      lenis?.destroy()
      lenis = undefined
      if (preference.matches) return
      lenis = new Lenis({
        autoRaf: true,
        lerp: .085,
        smoothWheel: true,
        syncTouch: false,
        anchors: false,
        stopInertiaOnNavigate: true,
        respectReducedMotion: true,
      })
    }

    function followAnchor(event: MouseEvent) {
      if (!lenis || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href^="#"]') : null
      if (!link || link.hash.length < 2) return
      const target = document.getElementById(decodeURIComponent(link.hash.slice(1)))
      if (!target) return
      event.preventDefault()
      // Focus or browser navigation may have moved the native scroll position.
      lenis.scrollTo(window.scrollY, { immediate: true })
      lenis.scrollTo(target, {
        offset: -(parseFloat(getComputedStyle(target).scrollMarginTop) || 0),
        onComplete: () => {
          navigate(link.hash)
          if (link.classList.contains('skip-link')) target.focus({ preventScroll: true })
        },
      })
    }

    function stopGlideForControl(event: MouseEvent) {
      if (event.target instanceof Element && event.target.closest('button')) {
        lenis?.scrollTo(window.scrollY, { immediate: true })
      }
    }

    configure()
    preference.addEventListener('change', configure)
    document.addEventListener('click', followAnchor)
    element.addEventListener('click', stopGlideForControl, true)
    return () => {
      lenis?.destroy()
      preference.removeEventListener('change', configure)
      document.removeEventListener('click', followAnchor)
      element.removeEventListener('click', stopGlideForControl, true)
    }
  }, [root, navigate])
}
