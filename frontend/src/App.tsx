import LabMap from './components/LabMap'
import BackendStatus from './components/BackendStatus'
import { useEffect } from 'react'
import { Link, Route, Routes, useLocation } from 'react-router'
import Lab1 from './labs/lab1/Lab1'
import './App.css'

function Home() {
  return <>
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="site-header">
      <a className="brand" href="#home" aria-label="Optiq home">optiq<span>.</span></a>
      <nav aria-label="Main navigation">
        <a href="#labs">Explore labs</a>
        <a href="https://github.com/fyodorrrrr/optiq" target="_blank" rel="noopener noreferrer">GitHub ↗</a>
      </nav>
    </header>
    <main id="main" className="page-content">
      <section className="intro" id="home" aria-labelledby="intro-title">
        <div className="intro-content">
          <h1 id="intro-title">A different way<br />to see.</h1>
          <div className="intro-copy">
            <p>Get hands-on with computer vision. Explore an image, change the parameters, and discover why the result changes.</p>
            <div className="intro-links">
              <a className="button" href="#labs">Explore the labs <span aria-hidden="true">→</span></a>
              <a className="quiet-link" href="/labs/1">Open Lab 1</a>
            </div>
          </div>
        </div>
        <a className="scroll-cue" href="#labs">Your next experiment is below <span aria-hidden="true">↓</span></a>
      </section>
      <LabMap />
      <footer className="site-footer">
        <div><p>Optiq — computer vision, through experimentation.</p><BackendStatus /></div>
        <p>For students and developers.<br />Built one lab at a time.</p>
      </footer>
    </main>
  </>
}

export default function App() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    document.title = pathname === '/labs/1' ? 'Lab 1 · Image fundamentals — Optiq' : 'Optiq — Computer vision through experimentation'
    const frame = requestAnimationFrame(() => {
      if (hash) document.getElementById(hash.slice(1))?.scrollIntoView()
      else window.scrollTo({ top: 0, behavior: 'instant' })
    })
    return () => cancelAnimationFrame(frame)
  }, [pathname, hash])

  return <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/labs/1" element={<Lab1 />} />
    <Route path="*" element={<main className="lab-main"><h1>Page not found</h1><p>This page is not available.</p><Link to="/">Return to Optiq</Link></main>} />
  </Routes>
}
