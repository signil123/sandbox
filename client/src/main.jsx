// File: client/src/main.jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { pushService } from './services/pushService'

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    pushService.ensureServiceWorker().catch(() => {})
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
