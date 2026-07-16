// 거리(미터)를 사람이 읽기 좋은 형태로 변환한다.
export function formatDistance(meters) {
  if (meters == null || Number.isNaN(Number(meters))) return ''
  const m = Number(meters)
  if (m < 1000) return `${Math.round(m)}m`
  return `${(m / 1000).toFixed(1)}km`
}

// ISO 문자열/타임스탬프를 한국어 날짜/시간으로 변환한다.
export function formatDateTime(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatPoint(value) {
  const n = Number(value ?? 0)
  if (Number.isNaN(n)) return '0'
  return n.toLocaleString('ko-KR')
}
