import axios from 'axios'

// 백엔드 API 베이스. Vite 프록시가 /api -> http://localhost:8080 으로 넘긴다.
// (백엔드 context-path 가 /api/v1 이므로 경로가 그대로 매칭된다.)
const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // refreshToken httpOnly 쿠키 왕복
})

// 요청 인터셉터: 토큰이 있으면 Authorization 헤더를 붙인다.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 백엔드 공통 응답 { status, message, data } 를 언래핑해 data 만 남긴다.
// 페이지 코드는 res.data 로 실제 데이터에 바로 접근한다.
function unwrap(response) {
  const body = response?.data
  if (body && typeof body === 'object' && 'status' in body && 'message' in body) {
    response.message = body.message
    response.data = body.data ?? null
  }
  return response
}

function clearSession() {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('user')
}

// 401 → refresh 쿠키로 액세스 토큰 재발급(RTR) 후 원요청 1회 재시도.
// 재발급도 실패하면 세션을 지우고 로그인으로 보낸다.
let refreshing = null

async function refreshAccessToken() {
  if (!refreshing) {
    refreshing = axios
      .post('/api/v1/auth/refresh', null, { withCredentials: true })
      .then((res) => {
        const token = res?.data?.data?.accessToken
        if (!token) throw new Error('no token')
        localStorage.setItem('accessToken', token)
        return token
      })
      .finally(() => {
        refreshing = null
      })
  }
  return refreshing
}

api.interceptors.response.use(unwrap, async (error) => {
  const status = error?.response?.status
  const original = error?.config
  const isAuthCall = original?.url?.startsWith('/auth/')

  if (status === 401 && original && !original._retried && !isAuthCall) {
    original._retried = true
    try {
      const token = await refreshAccessToken()
      original.headers.Authorization = `Bearer ${token}`
      return api(original)
    } catch {
      /* 재발급 실패 → 아래 공통 처리 */
    }
  }

  if (status === 401 && !isAuthCall) {
    clearSession()
    if (window.location.pathname !== '/login') {
      window.location.assign('/login')
    }
  }
  // 에러 메시지도 공통 규격에서 꺼내 쓰기 쉽게
  if (error?.response?.data?.message) {
    error.message = error.response.data.message
  }
  return Promise.reject(error)
})

export default api
