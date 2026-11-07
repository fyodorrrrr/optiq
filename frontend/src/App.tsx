import LabMap from './components/LabMap'
import HeroShapes from './components/HeroShapes'
import HeroPixel from './components/HeroPixel'
import LearningCards from './components/LearningCards'
import Wordmark from './components/Wordmark'
import { lazy, Suspense, useEffect, useRef } from 'react'
import { Link, Navigate, Route, Routes, useLocation } from 'react-router'
import useHomepageSmoothScroll from './hooks/useHomepageSmoothScroll'
import './App.css'

const Lab1 = lazy(() => import('./labs/lab1/Lab1'))
const Lab2 = lazy(() => import('./labs/lab2/Lab2'))
const Lab3 = lazy(() => import('./labs/lab3/Lab3'))
const Lab4 = lazy(() => import('./labs/lab4/Lab4'))
const Lab5 = lazy(() => import('./labs/lab5/Lab5'))
const Lab6 = lazy(() => import('./labs/lab6/Lab6'))
const Lab7 = lazy(() => import('./labs/lab7/Lab7'))

function Home() {
  const homepage = useRef<HTMLElement>(null)
  useHomepageSmoothScroll(homepage)
  return <>
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="site-header home-header">
      <a className="brand" href="#home" aria-label="Optiq home"><Wordmark /></a>
      <nav aria-label="Main navigation">
        <a href="https://github.com/fyodorrrrr/optiq" target="_blank" rel="noopener noreferrer">GitHub ↗</a>
      </nav>
    </header>
    <main ref={homepage} id="main" className="page-content" tabIndex={-1}>
      <section className="intro" id="home" aria-labelledby="intro-title">
        <HeroShapes />
        <div className="intro-content">
          <HeroPixel />
          <p className="intro-category">Interactive computer vision labs</p>
          <h1 id="intro-title">A different way<br />to see.</h1>
          <div className="intro-copy">
            <p>Explore images, adjust parameters, and understand what changes—and why.</p>
            <div className="intro-links">
              <a className="button" href="#labs">Explore the labs <span aria-hidden="true">→</span></a>
              <Link className="quiet-link" to="/labs/1">Start with Lab 1</Link>
            </div>
          </div>
        </div>
      </section>
      <LearningCards />
      <LabMap />
      <footer className="site-footer">
        <div><p>Optiq — computer vision, through experimentation.</p></div>
        <p>For students and developers.<br />Built one lab at a time.</p>
      </footer>
    </main>
  </>
}

export default function App() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    document.title = pathname === '/labs/1' ? 'Lab 1 · Image fundamentals — Optiq'
      : pathname === '/labs/2' ? 'Lab 2 · Edge detection — Optiq'
        : pathname === '/labs/3' ? 'Lab 3 · Histograms & contrast — Optiq' : pathname === '/labs/4' ? 'Lab 4 · Features & matching — Optiq' : pathname.startsWith('/labs/5') ? 'Lab 5 · PCA & eigenfaces — Optiq' : pathname === '/labs/6' ? 'Lab 6 · Object detection — Optiq' : pathname === '/labs/7' ? 'Lab 7 · Segmentation — Optiq' : 'Optiq — Computer vision through experimentation'
    const frame = requestAnimationFrame(() => {
      if (hash) document.getElementById(hash.slice(1))?.scrollIntoView()
      else window.scrollTo({ top: 0, behavior: 'instant' })
    })
    return () => cancelAnimationFrame(frame)
  }, [pathname, hash])

  return <Suspense fallback={<main className="lab-main route-loading" aria-busy="true"><p role="status">Loading lab…</p></main>}><Routes>
    <Route path="/" element={<Home />} />
    <Route path="/labs/1" element={<Lab1 />} />
    <Route path="/labs/2" element={<Lab2 />} />
    <Route path="/labs/3" element={<Lab3 />} />
    <Route path="/labs/4" element={<Lab4 />} />
    <Route path="/labs/5" element={<Lab5 />} />
    <Route path="/labs/5/demo" element={<Navigate to="/labs/5" replace />} />
    <Route path="/labs/6" element={<Lab6 />} />
    <Route path="/labs/7" element={<Lab7 />} />
    <Route path="*" element={<main className="lab-main"><h1>Page not found</h1><p>This page is not available.</p><Link to="/">Return to Optiq</Link></main>} />
  </Routes></Suspense>
}
