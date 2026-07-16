import { useEffect, useState } from 'react'
import api from '../api.js'
import RecommendationResult from '../components/RecommendationResult.jsx'
import { useScrapper } from '../hooks/useScrapper.js'
import { formatDateTime } from '../utils/format.js'

export default function History() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [selectedId, setSelectedId] = useState(null)
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')

  const { scrappedIds, scrappingId, toast, scrap } = useScrapper()

  useEffect(() => {
    let active = true
    api
      .get('/history')
      .then(({ data }) => {
        const rows = (Array.isArray(data) ? data : []).map((h) => ({
          recId: h.recommendationId,
          menu: Array.isArray(h.menu) ? h.menu.join(', ') : h.menu,
          createdAt: h.createdAt,
          topName: h.location, // 검색 위치 라벨을 부제로 노출
        }))
        if (active) setList(rows)
      })
      .catch(() => {
        if (active) setError('검색 기록을 불러오지 못했어요. 백엔드 서버(:8080)를 확인해주세요.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const openDetail = async (recId) => {
    setSelectedId(recId)
    setDetail(null)
    setDetailError('')
    setDetailLoading(true)
    try {
      const { data } = await api.get(`/recommendations/${recId}`)
      setDetail({
        ...data,
        recId: data.recommendationId,
        menu: Array.isArray(data.menu) ? data.menu.join(', ') : data.menu,
        generatedAt: data.createdAt,
      })
    } catch {
      setDetailError('상세 기록을 불러오지 못했어요.')
    } finally {
      setDetailLoading(false)
    }
  }

  const closeDetail = () => {
    setSelectedId(null)
    setDetail(null)
    setDetailError('')
  }

  return (
    <div className="page">
      <div className="page-head">
        <h1 className="page-title">내 기록</h1>
        <p className="page-sub muted">지난 검색과 AI 추천 결과를 다시 확인할 수 있어요.</p>
      </div>

      {error && <p className="error-banner" role="alert">{error}</p>}

      {loading ? (
        <p className="muted loading-line">불러오는 중…</p>
      ) : list.length === 0 ? (
        <div className="empty-state">
          <span className="empty-emoji" aria-hidden="true">🕓</span>
          <p className="empty">아직 검색 기록이 없어요.</p>
          <p className="muted">검색 화면에서 메뉴를 검색하면 여기에 쌓여요.</p>
        </div>
      ) : (
        <div className="history-list">
          {list.map((h) => {
            const isActive = h.recId === selectedId
            return (
              <button
                type="button"
                key={h.recId}
                className={isActive ? 'history-card active' : 'history-card'}
                onClick={() => (isActive ? closeDetail() : openDetail(h.recId))}
              >
                <div className="history-main">
                  <span className="history-menu">{h.menu}</span>
                  {h.topName && <span className="history-top">📍 {h.topName}</span>}
                </div>
                <div className="history-meta">
                  {h.count != null && <span className="count-chip tnum">{h.count}곳</span>}
                  <span className="muted tnum">{formatDateTime(h.createdAt)}</span>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* 상세 패널 */}
      {selectedId && (
        <section className="detail-panel">
          <div className="detail-head">
            <h2 className="section-title">추천 상세</h2>
            <button type="button" className="btn-ghost" onClick={closeDetail}>닫기</button>
          </div>

          {detailLoading && <p className="muted loading-line">불러오는 중…</p>}
          {detailError && <p className="error-banner" role="alert">{detailError}</p>}
          {!detailLoading && detail && (
            <RecommendationResult
              result={detail}
              onScrap={(item) => scrap(item, detail.menu)}
              scrappedIds={scrappedIds}
              scrappingId={scrappingId}
            />
          )}
        </section>
      )}

      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  )
}
