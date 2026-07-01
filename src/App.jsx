import { useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'

import { AuthProvider } from './state/AuthContext'
import { ThemeProvider } from './state/ThemeContext'
import { AppRoutes } from './routes/AppRoutes'
import { ensureGuestSession } from './services/sessionService'

export default function App() {
  useEffect(() => {
    void ensureGuestSession()
  }, [])

  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
