import { createContext, useContext, useMemo, useState } from 'react'

const AuthContext = createContext(null)

function readStoredUser() {
  try {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser)

  // 로그인 응답: { accessToken } — refreshToken은 httpOnly 쿠키로 온다.
  const login = (data) => {
    if (data?.accessToken) localStorage.setItem('accessToken', data.accessToken)
    const nextUser = {
      email: data?.email ?? '',
      name: data?.name ?? (data?.email ? data.email.split('@')[0] : ''),
      pointBalance: data?.pointBalance ?? 0,
    }
    localStorage.setItem('user', JSON.stringify(nextUser))
    setUser(nextUser)
  }

  // 포인트 적립/차감 후 헤더 잔액을 즉시 갱신한다(불변 업데이트).
  const setPoints = (pointBalance) => {
    setUser((prev) => {
      if (!prev) return prev
      const next = { ...prev, pointBalance }
      localStorage.setItem('user', JSON.stringify(next))
      return next
    })
  }

  const logout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('user')
    setUser(null)
  }

  const value = useMemo(() => ({ user, login, logout, setPoints }), [user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
