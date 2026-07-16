import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import Search from './pages/Search.jsx'
import Scraps from './pages/Scraps.jsx'
import History from './pages/History.jsx'
import Contribute from './pages/Contribute.jsx'
import Points from './pages/Points.jsx'
import MyPage from './pages/MyPage.jsx'
import Vote from './pages/Vote.jsx'
import ProtectedLayout from './components/ProtectedLayout.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      {/* 공유 투표 — 로그인 없이 누구나 접근하는 공개 페이지 */}
      <Route path="/vote/:token" element={<Vote />} />

      {/* 보호된 화면: 상단 네비게이션 + 로그인 확인 */}
      <Route element={<ProtectedLayout />}>
        <Route path="/search" element={<Search />} />
        <Route path="/scraps" element={<Scraps />} />
        <Route path="/history" element={<History />} />
        <Route path="/contribute" element={<Contribute />} />
        <Route path="/points" element={<Points />} />
        <Route path="/mypage" element={<MyPage />} />
      </Route>

      <Route path="/" element={<Navigate to="/search" replace />} />
      <Route path="*" element={<Navigate to="/search" replace />} />
    </Routes>
  )
}
