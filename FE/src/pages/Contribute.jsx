import { useState } from 'react'
import api from '../api.js'
import { kakaoSearchPlacesMulti, KakaoError } from '../utils/kakao.js'
import { useAuth } from '../context/AuthContext.jsx'

const norm = (s) => (s || '').toLowerCase().replace(/\s+/g, '')

export default function Contribute() {
  const { setPoints } = useAuth()

  // 1단계: 실존 가게 검색 → 2단계: 선택한 갈래별 폼
  const [query, setQuery] = useState('')
  const [searchBusy, setSearchBusy] = useState(false)
  const [searched, setSearched] = useState(false)
  const [dbMatches, setDbMatches] = useState([])
  const [kakaoMatches, setKakaoMatches] = useState([])
  const [kakaoNote, setKakaoNote] = useState('')

  // selected: {type:'db', place} | {type:'kakao', place} | {type:'manual'}
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({ menu: '', comment: '', name: '', category: '', address: '', groupOk: false })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(null) // { name, awarded, pointBalance }

  const update = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const resetToSearch = () => {
    setSelected(null)
    setError('')
    setForm({ menu: '', comment: '', name: '', category: '', address: '', groupOk: false })
  }

  // 실존 가게 검색: 우리 DB(등록된 가게) + 카카오(실제 있는 가게)를 함께 조회한다.
  const search = async (e) => {
    e?.preventDefault()
    const q = query.trim()
    if (q.length < 2) {
      setError('가게 이름을 두 글자 이상 입력해주세요.')
      return
    }
    setError('')
    setDone(null)
    setSearchBusy(true)
    setSelected(null)
    try {
      // 카카오 검색은 전국 대상 — 반경을 걸면 신당동 밖 가게(예: 인하대 인근) 제보가 막힌다.
      const [dbRes, kakaoRes] = await Promise.allSettled([
        api.get('/places/lookup', { params: { query: q } }),
        kakaoSearchPlacesMulti(q),
      ])
      const db = dbRes.status === 'fulfilled' ? dbRes.value.data : []
      setDbMatches(db)

      if (kakaoRes.status === 'fulfilled') {
        // 이미 우리 DB에 있는 가게는 카카오 결과에서 숨긴다(같은 상호는 리뷰로 유도)
        const dbNames = new Set(db.map((p) => norm(p.name)))
        setKakaoMatches(kakaoRes.value.filter((p) => !dbNames.has(norm(p.name))))
        setKakaoNote('')
      } else {
        setKakaoMatches([])
        const code = kakaoRes.reason instanceof KakaoError ? kakaoRes.reason.code : ''
        setKakaoNote(code === 'NO_KEY'
          ? '카카오 키가 없어 실존 가게 검색을 건너뛰었어요.'
          : '카카오 검색에 실패했어요. 직접 입력으로 제보할 수 있어요.')
      }
      setSearched(true)
    } finally {
      setSearchBusy(false)
    }
  }

  const pickDb = (place) => {
    setSelected({ type: 'db', place })
    setForm((prev) => ({ ...prev, menu: '', comment: '' }))
    setError('')
  }
  const pickKakao = (place) => {
    setSelected({ type: 'kakao', place })
    setForm((prev) => ({ ...prev, menu: '', groupOk: false }))
    setError('')
  }
  const pickManual = () => {
    setSelected({ type: 'manual' })
    setForm((prev) => ({ ...prev, name: query.trim(), category: '', address: '', menu: '', groupOk: false }))
    setError('')
  }

  const finish = (data) => {
    setPoints(data.pointBalance)
    setDone(data)
    setSelected(null)
    setQuery('')
    setSearched(false)
    setDbMatches([])
    setKakaoMatches([])
    setForm({ menu: '', comment: '', name: '', category: '', address: '', groupOk: false })
  }

  const fail = (err, fallback) => {
    setError(err?.response?.data?.message || fallback)
  }

  // 갈래 1: 등록된 가게에 리뷰 제보 (+1P)
  const submitReview = async (e) => {
    e.preventDefault()
    if (!form.menu.trim()) return setError('어떤 메뉴가 맛있었는지 알려주세요.')
    setBusy(true)
    setError('')
    try {
      const res = await api.post('/contributions/review', {
        restaurantId: selected.place.id,
        menu: form.menu.trim(),
        comment: form.comment.trim() || null,
      })
      finish(res.data)
    } catch (err) {
      fail(err, '리뷰 제보에 실패했어요. 잠시 후 다시 시도해주세요.')
    } finally {
      setBusy(false)
    }
  }

  // 갈래 2: 카카오로 확인된 실존 가게 신규 등록 (+5P) — 좌표·주소·링크를 검증값 그대로 쓴다.
  const submitKakao = async (e) => {
    e.preventDefault()
    if (!form.menu.trim()) return setError('대표 메뉴를 입력해주세요.')
    setBusy(true)
    setError('')
    try {
      const p = selected.place
      const res = await api.post('/contributions', {
        name: p.name,
        category: p.category || null,
        address: p.address || null,
        menu: form.menu.trim(),
        lat: p.lat,
        lng: p.lng,
        groupOk: form.groupOk,
        placeUrl: p.placeUrl || null,
      })
      finish(res.data)
    } catch (err) {
      fail(err, '등록에 실패했어요. 잠시 후 다시 시도해주세요.')
    } finally {
      setBusy(false)
    }
  }

  // 갈래 3: 직접 입력(폴백) — 주소를 지오코딩해 좌표를 얻는다.
  const submitManual = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.menu.trim() || !form.address.trim()) {
      return setError('매장 이름 · 대표 메뉴 · 주소는 필수입니다.')
    }
    setBusy(true)
    setError('')
    try {
      const geo = await api.get('/geocode', { params: { query: form.address.trim() } })
      const res = await api.post('/contributions', {
        name: form.name.trim(),
        category: form.category.trim() || null,
        address: form.address.trim(),
        menu: form.menu.trim(),
        lat: geo.data.lat,
        lng: geo.data.lng,
        groupOk: form.groupOk,
        placeUrl: null,
      })
      finish(res.data)
    } catch (err) {
      fail(err, '주소를 찾지 못했어요. 조금 더 자세히 입력해 주세요.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page contribute">
      <header className="contribute-head">
        <h1>내가 아는 맛집, 제보하기</h1>
        <p>
          가게를 먼저 검색해서 <strong>실제 있는 가게인지 확인</strong>하고 제보해요.
          카카오 확인 매장 <strong>+5P</strong> · 직접 입력 <strong>0P</strong> · 등록된 가게 리뷰 <strong>+1P</strong>.
        </p>
      </header>

      {done && (
        <div className="contribute-done" role="status">
          🎉 <strong>{done.name}</strong> 제보 완료!{' '}
          {done.awarded > 0
            ? <><strong>+{done.awarded}P</strong> 적립 (잔액 {done.pointBalance}P)</>
            : <>직접 입력 제보는 검증 전 포인트가 적립되지 않아요. (잔액 {done.pointBalance}P)</>}
        </div>
      )}

      {/* 1단계 — 가게 검색 */}
      <form className="lookup-bar" onSubmit={search}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="가게 이름으로 검색 — 예) 금돼지식당"
        />
        <button type="submit" disabled={searchBusy}>{searchBusy ? '찾는 중…' : '가게 찾기'}</button>
      </form>

      {error && !selected && <p className="contribute-error">{error}</p>}

      {/* 검색 결과 */}
      {searched && !selected && (
        <div className="lookup-results">
          {dbMatches.length > 0 && (
            <section>
              <h2 className="lookup-title">메뉴픽에 이미 있는 가게 — 리뷰로 제보 (+1P)</h2>
              {dbMatches.map((p) => (
                <button key={p.id} type="button" className="lookup-row" onClick={() => pickDb(p)}>
                  <span className="lookup-badge db">등록됨</span>
                  <span className="lookup-text">
                    <span className="lookup-name">{p.name}</span>
                    <span className="lookup-desc">{[p.category, p.address].filter(Boolean).join(' · ')}</span>
                  </span>
                  <span className="lookup-arrow" aria-hidden="true">›</span>
                </button>
              ))}
            </section>
          )}

          {kakaoMatches.length > 0 && (
            <section>
              <h2 className="lookup-title">카카오에서 확인된 가게 — 새로 등록 (+5P)</h2>
              {kakaoMatches.map((p) => (
                <button key={p.kakaoId} type="button" className="lookup-row" onClick={() => pickKakao(p)}>
                  <span className="lookup-badge kakao">실존 확인</span>
                  <span className="lookup-text">
                    <span className="lookup-name">{p.name}</span>
                    <span className="lookup-desc">{[p.category, p.address].filter(Boolean).join(' · ')}</span>
                  </span>
                  <span className="lookup-arrow" aria-hidden="true">›</span>
                </button>
              ))}
            </section>
          )}

          {kakaoNote && <p className="lookup-note">{kakaoNote}</p>}
          {dbMatches.length === 0 && kakaoMatches.length === 0 && (
            <p className="lookup-note">'{query.trim()}' 검색 결과가 없어요.</p>
          )}

          <button type="button" className="lookup-manual" onClick={pickManual}>
            찾는 가게가 없나요? 직접 입력하기
          </button>
        </div>
      )}

      {/* 2단계 — 갈래별 폼 */}
      {selected?.type === 'db' && (
        <form className="contribute-form" onSubmit={submitReview}>
          <div className="picked-place">
            <strong>{selected.place.name}</strong>
            <span>{[selected.place.category, selected.place.address].filter(Boolean).join(' · ')}</span>
          </div>
          <label className="field">
            <span>맛있었던 메뉴 *</span>
            <input value={form.menu} onChange={update('menu')} placeholder="예) 삼겹살" />
          </label>
          <label className="field">
            <span>한줄평 (선택)</span>
            <input value={form.comment} onChange={update('comment')} placeholder="예) 두툼한 목살이 인생급" maxLength={300} />
          </label>
          {error && <p className="contribute-error">{error}</p>}
          <button type="submit" className="find-btn" disabled={busy}>
            {busy ? '제보 중…' : '리뷰 제보하고 +1P 받기'}
          </button>
          <button type="button" className="lookup-back" onClick={resetToSearch}>← 다른 가게 선택</button>
        </form>
      )}

      {selected?.type === 'kakao' && (
        <form className="contribute-form" onSubmit={submitKakao}>
          <div className="picked-place">
            <strong>{selected.place.name}</strong>
            <span>{[selected.place.category, selected.place.address].filter(Boolean).join(' · ')}</span>
            {selected.place.placeUrl && (
              <a href={selected.place.placeUrl} target="_blank" rel="noopener noreferrer">카카오에서 확인 ↗</a>
            )}
          </div>
          <label className="field">
            <span>대표 메뉴 *</span>
            <input value={form.menu} onChange={update('menu')} placeholder="예) 칼국수" />
          </label>
          <label className="field-check">
            <input type="checkbox" checked={form.groupOk} onChange={update('groupOk')} />
            <span>단체 이용 가능 (5인 이상 방문 가능)</span>
          </label>
          {error && <p className="contribute-error">{error}</p>}
          <button type="submit" className="find-btn" disabled={busy}>
            {busy ? '등록 중…' : '이 가게 등록하고 +5P 받기'}
          </button>
          <button type="button" className="lookup-back" onClick={resetToSearch}>← 다른 가게 선택</button>
        </form>
      )}

      {selected?.type === 'manual' && (
        <form className="contribute-form" onSubmit={submitManual}>
          <p className="lookup-note">검색으로 확인되지 않은 가게예요. 정보를 정확히 입력해주세요.</p>
          <label className="field">
            <span>매장 이름 *</span>
            <input value={form.name} onChange={update('name')} placeholder="예) 금돼지식당" />
          </label>
          <label className="field">
            <span>대표 메뉴 *</span>
            <input value={form.menu} onChange={update('menu')} placeholder="예) 삼겹살" />
          </label>
          <label className="field">
            <span>주소 *</span>
            <input value={form.address} onChange={update('address')} placeholder="예) 서울 중구 다산로 149" />
          </label>
          <label className="field">
            <span>업종 (선택)</span>
            <input value={form.category} onChange={update('category')} placeholder="예) 한식 · 고깃집" />
          </label>
          <label className="field-check">
            <input type="checkbox" checked={form.groupOk} onChange={update('groupOk')} />
            <span>단체 이용 가능 (5인 이상 방문 가능)</span>
          </label>
          {error && <p className="contribute-error">{error}</p>}
          <button type="submit" className="find-btn" disabled={busy}>
            {busy ? '등록 중…' : '직접 입력으로 제보하기 (0P)'}
          </button>
          <button type="button" className="lookup-back" onClick={resetToSearch}>← 검색으로 돌아가기</button>
        </form>
      )}
    </div>
  )
}
