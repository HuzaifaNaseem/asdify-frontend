import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import './index.css'
import App from './App.jsx'
import { initializeApiConfig } from './services/apiConfig'

const rootEl = document.getElementById('root')

function showBootMessage(message) {
  if (!rootEl) return
  rootEl.innerHTML = `<div class="app-boot" role="status">${message}</div>`
}

async function boot() {
  showBootMessage('Connecting to Asdify…')
  try {
    await initializeApiConfig()
  } catch (err) {
    console.error('[Asdify] API configuration failed:', err)
  }
  createRoot(rootEl).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void boot()
