import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Footer } from './Footer'

export function MainLayout() {
  return (
    <div className="app-shell">
      <Header />
      <main className="app-main" id="main-content">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
