import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api.js'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const [email, setEmail] = useState('demo@menupick.app')
  const [password, setPassword] = useState('1234')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, setPoints } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (loading) return
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', { email, password })
      login({ ...data, email })
      try {
        const { data: p } = await api.get('/point')
        if (p?.point != null) setPoints(p.point)
      } catch {
        /* 잔액 표시는 부가 정보 — 실패해도 로그인은 계속 */
      }
      navigate('/search', { replace: true })
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        (err?.response?.status === 401
          ? '이메일 또는 비밀번호가 올바르지 않아요.'
          : '로그인에 실패했어요. 잠시 후 다시 시도해주세요.')
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="auth-logo" aria-hidden="true">🍜</span>
          <h1 className="auth-title">메뉴픽</h1>
        </div>
        <p className="auth-sub">먹고 싶은 메뉴만 검색하면, AI가 근거와 함께 맛집을 골라드려요.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="field">
            <span className="label">이메일</span>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </label>

          <label className="field">
            <span className="label">비밀번호</span>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호"
              autoComplete="current-password"
              required
            />
          </label>

          {error && <p className="auth-error" role="alert">{error}</p>}

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? '로그인 중…' : '로그인'}
          </button>
        </form>

        <p className="auth-hint">데모 계정: demo@menupick.app / 1234</p>
        <p className="auth-alt">
          아직 계정이 없나요? <Link to="/signup">회원가입</Link>
        </p>
      </div>
    </div>
  )
}
