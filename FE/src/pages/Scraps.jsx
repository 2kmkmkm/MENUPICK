import { useEffect, useMemo, useState } from 'react'
import api from '../api.js'
import { useAuth } from '../context/AuthContext.jsx'
import StarRating from '../components/StarRating.jsx'

// 원탭 방문 태그 — 리뷰 작성 부담을 탭 한 번으로 낮춘다(네이버 키워드 리뷰 패턴)
const TAGS = ['또 올 맛', '양 많음', '가성비', '분위기', '혼밥 OK', '웨이팅 있음']

const parseTags = (s) => (s || '').split(',').filter(Boolean)
const hasRecord = (s) => s.rating != null || parseTags(s.tags).length > 0 || Boolean(s.memo && s.memo.trim())

function monthKey(iso) {
  if (!iso) return '날짜 미상'
  const d = new Date(iso)
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월`
}

function dayLabel(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getMonth() + 1}.${d.getDate()}`
}

/**
 * 스크랩 카드 3가지 모습:
 *  - 미방문: '방문했어요' 버튼
 *  - 방문 + 기록 중(editing): 별점·태그·메모 폼 + 완료
 *  - 방문 + 기록 없음: '기록 남기기' 버튼(컴팩트)
 */
function ScrapRow({ scrap, editing, onPatch, onDelete, onStartRecord, onComplete, highlight }) {
  const [memo, setMemo] = useState(scrap.memo || '')
  const [saving, setSaving] = useState(false)

  const tags = parseTags(scrap.tags)

  // 완료 = 기록 끝. 메모 변경분을 저장하고 카드를 데이터에 맞는 탭(내 기록/가본 곳)으로 보낸다.
  const complete = async () => {
    setSaving(true)
    if ((scrap.memo || '') !== memo) {
      await onPatch(scrap.scrapId, { memo })
    }
    setSaving(false)
    const recorded = scrap.rating != null || tags.length > 0 || Boolean(memo.trim())
    onComplete?.(scrap.scrapId, recorded)
  }

  return (
    <article className={highlight ? 'scrap-card hl' : 'scrap-card'}>
      <div className="scrap-head">
        <div>
          <h3 className="scrap-name">{scrap.name}</h3>
          {scrap.address && <p className="scrap-addr muted">{scrap.address}</p>}
        </div>
        {scrap.menu && <span className="scrap-menu-tag">{scrap.menu}</span>}
      </div>

      {!scrap.visited ? (
        <div className="scrap-controls">
          <button
            type="button"
            className="visit-btn"
            onClick={() => onPatch(scrap.scrapId, { visited: true })}
          >
            🏁 방문했어요
          </button>
          <div className="scrap-actions">
            <button type="button" className="btn-danger" onClick={() => onDelete(scrap.scrapId)}>
              삭제
            </button>
          </div>
        </div>
      ) : editing ? (
        // 기록 폼 — 완료를 누르면 즉시 '내 기록'으로 이동
        <div className="record">
          <div className="record-head">
            <span className="record-title">어땠어요?</span>
            {scrap.visitedAt && <span className="record-date tnum">{dayLabel(scrap.visitedAt)} 방문</span>}
          </div>

          <StarRating
            value={scrap.rating}
            onChange={(rating) => onPatch(scrap.scrapId, { rating })}
          />

          <textarea
            className="memo-input"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="한 줄로 남겨두면 나중에 도움이 돼요. (건너뛰어도 OK)"
            rows={2}
          />
          <div className="memo-actions">
            <button
              type="button"
              className="visit-undo"
              onClick={() => onPatch(scrap.scrapId, { visited: false })}
            >
              방문 취소
            </button>
            <button type="button" className="btn-danger" onClick={() => onDelete(scrap.scrapId)}>
              삭제
            </button>
            <button type="button" className="memo-save" onClick={complete} disabled={saving}>
              {saving ? '저장 중…' : '완료'}
            </button>
          </div>
        </div>
      ) : (
        // 방문했지만 기록이 아직 없는 곳 — 기록 대기함
        <div className="scrap-controls">
          <button type="button" className="visit-btn" onClick={() => onStartRecord(scrap.scrapId)}>
            ✍️ 기록 남기기
          </button>
          <div className="scrap-actions">
            {scrap.visitedAt && <span className="muted record-date tnum">{dayLabel(scrap.visitedAt)} 방문</span>}
            <button type="button" className="btn-danger" onClick={() => onDelete(scrap.scrapId)}>
              삭제
            </button>
          </div>
        </div>
      )}
    </article>
  )
}

export default function Scraps() {
  const [scraps, setScraps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('want') // want(가고 싶은 곳) | been(가본 곳) | log(내 기록)
  const [active, setActive] = useState(() => new Set()) // 기록 폼이 열려 있는 카드 — 완료 전까지 현재 탭에 고정
  const [highlightId, setHighlightId] = useState(null)
  const [toast, setToast] = useState('')
  const { setPoints } = useAuth()

  useEffect(() => {
    let alive = true
    api
      .get('/scraps')
      .then(({ data }) => {
        const rows = (data?.restaurants ?? []).map((r) => ({
          scrapId: r.restaurantId,
          restaurantId: r.restaurantId,
          name: r.name,
          address: r.address,
          menu: Array.isArray(r.menu) ? r.menu.join(', ') : r.menu,
          memo: r.memo,
          rating: r.rating,
          visited: r.visited,
          tags: '',
          visitedAt: null,
        }))
        if (alive) setScraps(rows)
      })
      .catch(() => {
        if (alive) setError('스크랩북을 불러오지 못했어요. 백엔드 서버(:8080)를 확인해주세요.')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 2500)
    return () => clearTimeout(t)
  }, [toast])

  const addActive = (id) => setActive((prev) => new Set(prev).add(id))
  const dropActive = (id) => setActive((prev) => {
    const next = new Set(prev)
    next.delete(id)
    return next
  })

  const patch = async (id, body) => {
    setError('')
    // 방문 체크/취소는 로컬 상태 — 서버에는 리뷰(별점·메모) 저장 시점에 반영된다.
    if ('visited' in body) {
      setScraps((prev) => prev.map((s) => (s.scrapId === id ? { ...s, visited: body.visited } : s)))
      if (body.visited === true) addActive(id)
      if (body.visited === false) dropActive(id)
      return
    }
    // 별점/메모 — 서버는 둘을 함께 받으므로 현재 값과 병합해 보낸다.
    const current = scraps.find((s) => s.scrapId === id)
    const payload = {
      memo: body.memo ?? current?.memo ?? '',
      rating: body.rating ?? current?.rating ?? null,
    }
    try {
      const { data } = await api.put(`/scraps/review/${id}`, payload)
      setScraps((prev) => prev.map((s) => (
        s.scrapId === id
          ? { ...s, memo: data?.memo ?? payload.memo, rating: data?.rating ?? payload.rating, visited: true }
          : s
      )))
      // 헤더 포인트 동기화 — 리뷰 보상 정책이 붙으면 여기서 자동 반영된다.
      try {
        const { data: p } = await api.get('/point')
        if (p?.point != null) setPoints(p.point)
      } catch {
        /* 표시용 */
      }
    } catch {
      setError('변경 사항을 저장하지 못했어요.')
    }
  }

  // '완료' — 기록 폼을 닫고 카드를 데이터에 맞는 탭으로 보낸다
  const completeRecord = (id, recorded) => {
    dropActive(id)
    setToast(recorded ? '내 기록에 저장했어요 ✓' : '기록이 비어 있어 ‘가본 곳’에 보관할게요')
  }

  const remove = async (id) => {
    setError('')
    try {
      await api.post(`/scraps/${id}`) // 팀 스크랩은 토글 — 한 번 더 누르면 해제
      setScraps((prev) => prev.filter((s) => s.scrapId !== id))
      dropActive(id)
    } catch {
      setError('삭제하지 못했어요. 잠시 후 다시 시도해주세요.')
    }
  }

  const visitedList = useMemo(() => scraps.filter((s) => s.visited), [scraps])
  const wantList = useMemo(() => scraps.filter((s) => !s.visited), [scraps])
  const beenList = useMemo(() => visitedList.filter((s) => !hasRecord(s)), [visitedList])
  const recordedList = useMemo(() => visitedList.filter(hasRecord), [visitedList])

  // 기록 중인 카드는 현재 탭 최상단에 고정 — 편집 도중 카드가 사라지지 않게
  const activeCards = scraps.filter((s) => active.has(s.scrapId))
  const listFor = (t) => {
    if (t === 'want') return scraps.filter((s) => !s.visited && !active.has(s.scrapId))
    if (t === 'been') return beenList.filter((s) => !active.has(s.scrapId))
    return []
  }
  const shown = [...activeCards, ...listFor(tab)]

  // 월별 타임라인 (visitedAt 기준, 최신 월부터)
  const timeline = useMemo(() => {
    const list = recordedList.filter((s) => !active.has(s.scrapId))
    const sorted = [...list].sort((a, b) =>
      (b.visitedAt || '1970').localeCompare(a.visitedAt || '1970'))
    const groups = []
    for (const s of sorted) {
      const key = monthKey(s.visitedAt)
      const last = groups[groups.length - 1]
      if (last && last.key === key) last.items.push(s)
      else groups.push({ key, items: [s] })
    }
    return groups
  }, [recordedList, active])

  // 넛지: 방문했는데 기록이 없는 곳 1곳만
  const nudge = useMemo(() =>
    beenList.find((s) => !active.has(s.scrapId)),
  [beenList, active])

  const goRecord = () => {
    setTab('been')
    setHighlightId(nudge.scrapId)
    setTimeout(() => setHighlightId(null), 2500)
  }

  const progress = scraps.length === 0 ? 0 : Math.round((visitedList.length / scraps.length) * 100)

  const stats = {
    visits: visitedList.length,
    ratings: visitedList.filter((s) => s.rating != null).length,
    notes: visitedList.filter((s) => (s.memo && s.memo.trim()) || parseTags(s.tags).length > 0).length,
  }

  return (
    <div className="page">
      {toast && <div className="mp-toast" role="status">{toast}</div>}

      <div className="page-head">
        <h1 className="page-title">스크랩북</h1>
        <p className="page-sub muted">담아둔 맛집에 방문을 기록하고, 나만의 맛집 연대기를 쌓아보세요.</p>
      </div>

      {error && <p className="error-banner" role="alert">{error}</p>}

      {loading ? (
        <p className="muted loading-line">불러오는 중…</p>
      ) : scraps.length === 0 ? (
        <div className="empty-state">
          <span className="empty-emoji" aria-hidden="true">🔖</span>
          <p className="empty">아직 스크랩한 맛집이 없어요.</p>
          <p className="muted">검색 화면에서 마음에 드는 곳을 스크랩해보세요.</p>
        </div>
      ) : (
        <>
          <div className="visit-progress">
            <div className="visit-progress-label">
              <span>찜한 {scraps.length}곳 중 <b>{visitedList.length}곳</b> 방문</span>
              <span className="tnum">{progress}%</span>
            </div>
            <div className="visit-progress-bar">
              <div className="visit-progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {nudge && tab !== 'been' && (
            <button type="button" className="nudge-card" onClick={goRecord}>
              💬 지난번 다녀온 <b>{nudge.name}</b>, 어땠어요? <span className="nudge-cta">기록 남기기 ›</span>
            </button>
          )}

          <div className="seg-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'want'}
              className={tab === 'want' ? 'seg-tab on' : 'seg-tab'}
              onClick={() => setTab('want')}
            >
              가고 싶은 곳 <span className="tnum">{wantList.length}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'been'}
              className={tab === 'been' ? 'seg-tab on' : 'seg-tab'}
              onClick={() => setTab('been')}
            >
              가본 곳 <span className="tnum">{beenList.length}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'log'}
              className={tab === 'log' ? 'seg-tab on' : 'seg-tab'}
              onClick={() => setTab('log')}
            >
              내 기록 <span className="tnum">{recordedList.length}</span>
            </button>
          </div>

          {tab === 'log' ? (
            <section className="logtab">
              <div className="logtab-stats">
                <div className="logtab-stat"><b className="tnum">{stats.visits}</b><span>방문</span></div>
                <div className="logtab-stat"><b className="tnum">{stats.ratings}</b><span>별점</span></div>
                <div className="logtab-stat"><b className="tnum">{stats.notes}</b><span>메모·태그</span></div>
              </div>

              {/* 기록 수정 중인 카드는 타임라인 위에 폼으로 */}
              {activeCards.length > 0 && (
                <div className="scrap-list">
                  {activeCards.map((s) => (
                    <ScrapRow
                      key={s.scrapId}
                      scrap={s}
                      editing
                      onPatch={patch}
                      onDelete={remove}
                      onStartRecord={addActive}
                      onComplete={completeRecord}
                      highlight={highlightId === s.scrapId}
                    />
                  ))}
                </div>
              )}

              {timeline.length === 0 && activeCards.length === 0 ? (
                <div className="empty-state small">
                  <p className="muted">방문한 가게에 별점·태그를 남기고 완료를 누르면 여기에 쌓여요.</p>
                </div>
              ) : (
                <div className="mylog-timeline open">
                  {timeline.map((group) => (
                    <div key={group.key} className="mylog-month">
                      <h4 className="mylog-month-title">{group.key} <span className="muted tnum">({group.items.length}곳)</span></h4>
                      {group.items.map((s) => (
                        <div key={s.scrapId} className="mylog-row">
                          <span className="mylog-date tnum">{dayLabel(s.visitedAt) || '—'}</span>
                          <span className="mylog-name">{s.name}</span>
                          {s.rating != null && <span className="mylog-stars">{'★'.repeat(s.rating)}</span>}
                          {parseTags(s.tags).slice(0, 3).map((t) => (
                            <span key={t} className="mylog-tag">{t}</span>
                          ))}
                          {s.memo && <span className="mylog-memo muted">{s.memo}</span>}
                          <button
                            type="button"
                            className="mylog-edit"
                            aria-label={`${s.name} 기록 수정`}
                            onClick={() => addActive(s.scrapId)}
                          >
                            ✏️
                          </button>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </section>
          ) : shown.length === 0 ? (
            <div className="empty-state small">
              {tab === 'want' ? (
                <p className="muted">가고 싶은 곳을 다 다녀왔어요! 검색에서 새로운 맛집을 찾아보세요.</p>
              ) : (
                <p className="muted">기록을 기다리는 곳이 없어요 — 모두 ‘내 기록’에 정리됐어요.</p>
              )}
            </div>
          ) : (
            <div className="scrap-list">
              {shown.map((s) => (
                <ScrapRow
                  key={s.scrapId}
                  scrap={s}
                  editing={active.has(s.scrapId)}
                  onPatch={patch}
                  onDelete={remove}
                  onStartRecord={addActive}
                  onComplete={completeRecord}
                  highlight={highlightId === s.scrapId}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
