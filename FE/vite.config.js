import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 백엔드는 http://localhost:8080 에서 동작한다고 가정한다.
// 개발 서버에서 /api 로 시작하는 요청을 백엔드로 프록시한다.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: 'localhost', // 개발 서버를 로컬에만 바인딩하고 백엔드 CORS origin과 일치시킨다.
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
