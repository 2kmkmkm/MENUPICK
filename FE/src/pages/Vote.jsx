import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'

// 비로그인 공개 페이지 — api.js(토큰 인터셉터)와 분리해 순수 fetch 로 부른다.
const POLL_MS = 3000

// 익명 투표자 식별: 브라우저 로컬 UUID. 완벽한 중복 방지가 아니라
// "한 브라우저 한 표 + 재투표는 변경"을 위한 soft key 다.
function voterKey() {
  let key = localStorage.getItem('mp_voter_key')
  if (!key) {
    key = crypto.randomUUID()
    localStorage.setItem('mp_voter_key', key)
  }
  return key
}

export default function Vote() {
  const { token } = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [voting, setVoting] = useState(false)
  const timerRef = useRef(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/shared/${token}?voter=${voterKey()}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.message || '링크를 열 수 없어요.')
      }
      const body = await res.json()
      setData(body.data ?? body)
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }, [token])

  // 첫 로드 + 3초 폴링(실시간 결과). 마감되면 폴링을 멈춘다.
  useEffect(() => {
    load()
    timerRef.current = setInterval(load, POLL_MS)
    return () => clearInterval(timerRef.current)
  }, [load])

  useEffect(() => {
    if (data?.closed && timerRef.current) clearInterval(timerRef.current)
  }, [data?.closed])

  const castVote = async (restaurantId) => {
    if (voting || data?.closed) return
    setVoting(true)
    try {
      const res = await fetch(`/api/v1/shared/${token}/votes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantId, voterKey: voterKey() }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.message || '투표에 실패했어요.')
      setData(body.data ?? body)
    } catch (err) {
      setError(err.message)
    } finally {
      setVoting(false)
    }
  }

  if (error && !data) {
    return (
      <div className="vote-page">
        <header className="vote-brand">🍜 메뉴픽</header>
        <div className="empty-state">
          <span className="empty-emoji" aria-hidden="true">🗳️</span>
          <p className="empty">{error}</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="vote-page">
        <header className="vote-brand">🍜 메뉴픽</header>
        <p className="muted loading-line">불러오는 중…</p>
      </div>
    )
  }

  const counts = data.votes || {}
  const maxCount = Math.max(1, ...Object.values(counts))

  return (
    <div className="vote-page">
      <header className="vote-brand">🍜 메뉴픽</header>

      <div className="vote-head">
        <h1 className="vote-title">"{Array.isArray(data.menu) ? data.menu.join(', ') : data.menu}" 어디로 갈까요?</h1>
        <p className="vote-sub">
          AI가 후기로 고른 top {data.places.length} — 마음에 드는 곳에 투표하세요!
        </p>
        <div className="vote-meta">
          <span className="tnum">🗳️ {data.totalVotes}표</span>
          {data.closed
            ? <span className="vote-closed-badge">투표 마감</span>
            : <span className="vote-live">● 실시간 집계 중</span>}
        </div>
      </div>

      {data.closed && (
        <div className="vote-closed-banner" role="status">
          투표가 마감됐어요 — 최다 득표 가게로 만나요! 🎉
        </div>
      )}

      <div className="vote-list">
        {data.places.map((p) => {
          const count = counts[p.restaurantId] || 0
          const isMine = data.myVote === p.restaurantId
          const percent = data.totalVotes === 0 ? 0 : Math.round((count / data.totalVotes) * 100)
          const isTop = data.closed && count === maxCount && count > 0
          return (
            <article key={p.restaurantId} className={isTop ? 'vote-card top' : 'vote-card'}>
              <div className="vote-card-head">
                <span className={`rec-rank rank-${p.rankNo}`}>{p.rankNo}</span>
                <div className="vote-card-name">
                  <h3>{p.name} {isTop && '👑'}</h3>
                  <span className="vote-card-cat">
                    {[p.category, p.groupOk ? '👥 단체 가능' : null].filter(Boolean).join(' · ')}
                  </span>
                </div>
              </div>

              {p.reason && <p className="vote-card-reason">{p.reason}</p>}

              <div className="vote-bar-row">
                <div className="vote-bar">
                  <div className="vote-bar-fill" style={{ width: `${percent}%` }} />
                </div>
                <span className="vote-count tnum">{count}표 · {percent}%</span>
              </div>

              <div className="vote-card-foot">
                {p.placeUrl && /^https?:\/\//i.test(p.placeUrl) && (
                  <a className="rec-link" href={p.placeUrl} target="_blank" rel="noopener noreferrer">
                    원문 보기 ↗
                  </a>
                )}
                <button
                  type="button"
                  className={isMine ? 'vote-btn mine' : 'vote-btn'}
                  onClick={() => castVote(p.restaurantId)}
                  disabled={voting || data.closed}
                >
                  {isMine ? '내 선택 ✓' : data.closed ? '마감' : '여기로!'}
                </button>
              </div>
            </article>
          )
        })}
      </div>

      {!data.closed && data.myVote != null && (
        <p className="vote-hint muted">다른 곳을 누르면 선택이 바뀌어요.</p>
      )}
      {error && <p className="contribute-error">{error}</p>}
    </div>
  )
}
