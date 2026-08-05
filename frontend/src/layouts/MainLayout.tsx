import { Outlet } from 'react-router-dom'
import Sidebar, { SIDEBAR_WIDTH } from '../components/common/Sidebar'
import Header from '../components/common/Header'
import Footer from '../components/common/Footer'

export default function MainLayout() {
  return (
    <div className="min-vh-100 bg-light">
      <div className="no-print">
        <Sidebar />
        <Header />
      </div>
      <div className="d-flex flex-column min-vh-100 app-content" style={{ marginLeft: SIDEBAR_WIDTH }}>
        <main className="flex-grow-1 app-main" style={{ padding: '88px 24px 24px' }}>
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  )
}
