import { Link, useNavigate } from 'react-router-dom'
import api from '../api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { formatPoint } from '../utils/format.js'

const MENU = [
  { to: '/scraps', icon: '📌', label: '스크랩북', desc: '담아둔 맛집과 방문 후기' },
  { to: '/history', icon: '🕘', label: '내 기록', desc: '지난 추천 검색 내역' },
  { to: '/contribute', icon: '➕', label: '맛집 제보', desc: '카카오 확인 매장 등록 +5P' },
  { to: '/points', icon: '🪙', label: '포인트 내역', desc: '적립·사용 내역 보기' },
]

export default function MyPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout') // 서버의 리프레시 토큰 무효화 + 쿠키 삭제
    } catch {
      /* 이미 만료됐어도 로컬 세션은 지운다 */
    }
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="page mypage">
      <section className="mypage-profile">
        <div className="mypage-avatar" aria-hidden="true">
          {(user?.name || '유').charAt(0)}
        </div>
        <div className="mypage-id">
          <strong className="mypage-name">{user?.name || '사용자'}</strong>
          {user?.email && <span className="mypage-email">{user.email}</span>}
        </div>
        <Link to="/points" className="mypage-point">
          <span className="mypage-point-value tnum">{formatPoint(user?.pointBalance)}P</span>
          <span className="mypage-point-label">보유 포인트</span>
        </Link>
      </section>

      <nav className="mypage-menu">
        {MENU.map((item) => (
          <Link key={item.to} to={item.to} className="mypage-row">
            <span className="mypage-row-icon" aria-hidden="true">{item.icon}</span>
            <span className="mypage-row-text">
              <span className="mypage-row-label">{item.label}</span>
              <span className="mypage-row-desc">{item.desc}</span>
            </span>
            <span className="mypage-row-arrow" aria-hidden="true">›</span>
          </Link>
        ))}
      </nav>

      <button type="button" className="mypage-logout" onClick={handleLogout}>
        로그아웃
      </button>
    </div>
  )
}
