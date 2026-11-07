import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router'
import SiteAnalytics from './components/SiteAnalytics'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      {import.meta.env.PROD && <SiteAnalytics />}
    </BrowserRouter>
  </StrictMode>,
)
