import { useEffect } from 'react'
import type { RefObject } from 'react'
import Lenis from 'lenis'
import { useNavigate } from 'react-router'
import 'lenis/dist/lenis.css'

export default function useHomepageMotion(root: RefObject<HTMLElement | null>) {
  const navigate = useNavigate()

  useEffect(() => {
    const element = root.current
    if (!element) return
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const targets = Array.from(element.querySelectorAll<HTMLElement>('.learning-cards-section > h2, .learning-card, .labs > .section-heading, .lab-browser'))
    const animations = new Map<HTMLElement, Animation>()
    let lenis: Lenis | undefined
    let observer: IntersectionObserver | undefined

    function reveal(target: HTMLElement, animate = true) {
      observer?.unobserve(target)
      target.removeAttribute('data-entrance')
      if (!animate || preference.matches) return
      const animation = target.animate([
        { opacity: .25, translate: '0 18px' },
        { opacity: 1, translate: '0 0' },
      ], { duration: 520, easing: 'cubic-bezier(.16, 1, .3, 1)' })
      animations.set(target, animation)
      animation.onfinish = () => animations.delete(target)
    }

    function configure() {
      lenis?.destroy()
      lenis = undefined
      observer?.disconnect()
      animations.forEach(animation => animation.cancel())
      animations.clear()
      if (preference.matches) {
        targets.forEach(target => target.removeAttribute('data-entrance'))
        return
      }
      lenis = new Lenis({
        autoRaf: true,
        lerp: .085,
        smoothWheel: true,
        syncTouch: false,
        anchors: false,
        stopInertiaOnNavigate: true,
        respectReducedMotion: true,
      })
      observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) reveal(entry.target as HTMLElement)
        })
      }, { rootMargin: '0px 0px -7% 0px', threshold: 0 })
      targets.forEach(target => {
        // Keep everything already in view immediately readable.
        if (target.getBoundingClientRect().top < innerHeight * .93) return
        target.dataset.entrance = 'pending'
        observer?.observe(target)
      })
    }

    function focus(event: FocusEvent) {
      if (!(event.target instanceof Element)) return
      targets.forEach(target => {
        if (!target.contains(event.target as Node)) return
        animations.get(target)?.cancel()
        animations.delete(target)
        reveal(target, false)
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
    element.addEventListener('focusin', focus)
    element.addEventListener('click', stopGlideForControl, true)
    return () => {
      lenis?.destroy()
      observer?.disconnect()
      animations.forEach(animation => animation.cancel())
      targets.forEach(target => target.removeAttribute('data-entrance'))
      preference.removeEventListener('change', configure)
      document.removeEventListener('click', followAnchor)
      element.removeEventListener('focusin', focus)
      element.removeEventListener('click', stopGlideForControl, true)
    }
  }, [root, navigate])
}
