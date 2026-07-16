import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api.js'

export default function Signup() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (loading) return
    setError('')

    if (password.length < 4) {
      setError('비밀번호는 4자 이상 입력해주세요.')
      return
    }

    setLoading(true)
    try {
      await api.post('/auth/signup', { email, password, name })
      setDone(true)
      window.setTimeout(() => navigate('/login', { replace: true }), 1200)
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        (err?.response?.status === 409
          ? '이미 가입된 이메일이에요.'
          : '회원가입에 실패했어요. 입력값을 확인해주세요.')
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
          <h1 className="auth-title">회원가입</h1>
        </div>
        <p className="auth-sub">메뉴픽 계정을 만들어 나만의 스크랩북을 시작하세요.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="field">
            <span className="label">이름</span>
            <input
              className="input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름"
              autoComplete="name"
              required
            />
          </label>

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
              placeholder="4자 이상"
              autoComplete="new-password"
              required
            />
          </label>

          {error && <p className="auth-error" role="alert">{error}</p>}
          {done && <p className="auth-ok" role="status">가입 완료! 로그인 화면으로 이동합니다…</p>}

          <button className="btn-primary" type="submit" disabled={loading || done}>
            {loading ? '가입 중…' : '회원가입'}
          </button>
        </form>

        <p className="auth-alt">
          이미 계정이 있나요? <Link to="/login">로그인</Link>
        </p>
      </div>
    </div>
  )
}
