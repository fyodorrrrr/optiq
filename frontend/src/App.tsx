import LabMap from './components/LabMap'
import BackendStatus from './components/BackendStatus'
import './App.css'

export default function App() {
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
              <a className="quiet-link" href="/previews/lab-1.html">Try Lab 1 preview</a>
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
