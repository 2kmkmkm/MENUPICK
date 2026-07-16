import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import NavBar from './NavBar.jsx'

export default function ProtectedLayout() {
  const { user } = useAuth()
  const token = localStorage.getItem('accessToken')

  if (!user || !token) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="app-shell">
      <NavBar />
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}
