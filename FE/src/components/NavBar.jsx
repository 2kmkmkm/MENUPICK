import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { formatPoint } from '../utils/format.js'

const linkClass = ({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')

export default function NavBar() {
  const { user } = useAuth()

  return (
    <header className="nav">
      <div className="nav-inner">
        <div className="nav-brand">
          <span className="nav-logo" aria-hidden="true">🍜</span>
          <span className="nav-title">메뉴픽</span>
        </div>

        <nav className="nav-links">
          <NavLink to="/search" className={linkClass}>검색</NavLink>
          <NavLink to="/mypage" className={linkClass}>마이페이지</NavLink>
        </nav>

        <div className="nav-user">
          {user && (
            <NavLink to="/mypage" className="nav-user-info">
              <strong className="nav-name">{user.name || '사용자'}</strong>
              <span className="nav-point">{formatPoint(user.pointBalance)}P</span>
            </NavLink>
          )}
        </div>
      </div>
    </header>
  )
}
