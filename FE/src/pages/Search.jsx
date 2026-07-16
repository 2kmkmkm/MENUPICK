import { useState, useMemo, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import api from '../api.js'
import { kakaoSearchPlace, KakaoError } from '../utils/kakao.js'
import { shareVoteToKakao } from '../utils/kakaoShare.js'
import { useAuth } from '../context/AuthContext.jsx'
import MapView from '../components/MapView.jsx'
import LoadingStages from '../components/LoadingStages.jsx'
import RecommendationResult from '../components/RecommendationResult.jsx'
import { useScrapper } from '../hooks/useScrapper.js'
import useSheetDrag from '../hooks/useSheetDrag.js'

// 신당동(파일럿 동) 인근 수집 데이터의 중심 — 지오로케이션 거부 시 폴백
const DONG_PRESET = { lat: 37.5629, lng: 127.0162 }
const DONG_LABEL = '신당동 인근'
const RADIUS_OPTIONS = [500, 1000, 1500, 2000, 3000]
const VWORLD_KEY = import.meta.env.VITE_VWORLD_KEY || ''

// 자주 찾는 메뉴 — 탭 한 번으로 결과로 넘어간다
const POPULAR = ['해장국', '김치찌개', '마라탕', '삼겹살', '돈까스', '떡볶이', '국밥', '칼국수', '파스타', '치킨', '족발', '초밥']

export default function Search() {
  const [step, setStep] = useState('compose') // compose(위치·메뉴 고르기) → result(결과)
  const [menu, setMenu] = useState('') // 입력창 초안(아직 추가 전)
  const [menus, setMenus] = useState([]) // 확정된 메뉴 목록(여러 개 동시 검색)
  const [headcount, setHeadcount] = useState(1) // 인원수(기본 1, +/- 조정)
  const [queryMenu, setQueryMenu] = useState('') // 실제로 검색한 메뉴 라벨(결과 화면 표시용)
  const [center, setCenter] = useState(DONG_PRESET)
  const [radius, setRadius] = useState(1500)
  const [baseMap, setBaseMap] = useState('osm')
  const [selectedId, setSelectedId] = useState(null)

  const [places, setPlaces] = useState(null)
  const [placesError, setPlacesError] = useState('')
  const [rec, setRec] = useState(null)
  const [share, setShare] = useState(null) // { token, closed } — 이 추천의 투표 링크
  const [shareBusy, setShareBusy] = useState(false)
  const [winner, setWinner] = useState(null) // 마감 후 최다 득표 가게 (RecoPlaceDto)
  const [sheetPos, setSheetPos] = useState('half') // 결과 바텀시트: peek(지도 중심) | half(리스트)
  const sheetRef = useRef(null)
  const sheetDrag = useSheetDrag(sheetRef, setSheetPos) // 손가락 따라 움직이는 드래그 제스처
  const [recLoading, setRecLoading] = useState(false)
  const [recError, setRecError] = useState('')
  const [searching, setSearching] = useState(false)
  const [locating, setLocating] = useState(false)
  const [notice, setNotice] = useState('')
  const [locQuery, setLocQuery] = useState('')
  const [centerLabel, setCenterLabel] = useState('')

  const { scrappedIds, scrappingId, toast, scrap } = useScrapper()
  const { setPoints } = useAuth()

  const locName = centerLabel || DONG_LABEL

  // 현재 위치 잡기 (지오로케이션). 페이지 로드 시 자동 호출하지 않는다(권한 프롬프트 오남용 방지).
  const locate = async () => {
    if (!('geolocation' in navigator)) {
      setNotice('이 브라우저는 위치 기능을 지원하지 않아요. 지도를 눌러 위치를 정할 수 있어요.')
      return
    }
    try {
      const perm = navigator.permissions && (await navigator.permissions.query({ name: 'geolocation' }))
      if (perm && perm.state === 'denied') {
        setCenter(DONG_PRESET)
        setCenterLabel(DONG_LABEL)
        setNotice('위치가 브라우저에서 "차단"돼 있어요. 주소창 왼쪽 아이콘 → 위치 → "허용" 후 새로고침하세요. (지금은 신당동 인근)')
        return
      }
    } catch {
      /* Permissions API 미지원 브라우저는 아래에서 그냥 시도 */
    }

    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setCenterLabel('현재 위치')
        setLocating(false)
        setNotice('현재 위치로 이동했어요.')
      },
      (err) => {
        setLocating(false)
        setCenter(DONG_PRESET) // 실패해도 막다른 길이 되지 않게 데이터가 있는 신당동 인근으로
        setCenterLabel(DONG_LABEL)
        if (err.code === err.PERMISSION_DENIED) {
          setNotice('위치가 차단돼 있어요. 주소창 왼쪽 아이콘 → 위치 → "허용" 후 새로고침하세요. (지금은 신당동 인근)')
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setNotice('위치를 확인할 수 없어요. Windows "위치 서비스"가 켜져 있는지 확인하세요. (지금은 신당동 인근)')
        } else {
          setNotice('현재 위치 확인이 지연됐어요. 지도 클릭/위치 검색을 써주세요. (지금은 신당동 인근)')
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    )
  }

  // 장소/상호로 위치 지정 (카카오 키워드 장소검색). 현재 중심 인근을 우선해 "신당역" 같은 검색이 엉뚱한 데로 안 가게.
  const geocodeLocate = async (e) => {
    e?.preventDefault()
    const q = locQuery.trim()
    if (!q) return
    setLocating(true)
    try {
      const data = await kakaoSearchPlace(q, center)
      setCenter({ lat: data.lat, lng: data.lng, zoom: 16 })
      setCenterLabel(data.label || q)
      const where = data.address ? `${data.label} · ${data.address}` : data.label || q
      setNotice(`'${where}'(으)로 이동했어요.`)
    } catch (err) {
      const code = err instanceof KakaoError ? err.code : ''
      if (code === 'ZERO_RESULT') setNotice(`'${q}' 위치를 못 찾았어요. 더 구체적으로 입력해보세요.`)
      else if (code === 'NO_KEY') setNotice('카카오 키가 아직 없어요. frontend/.env 의 VITE_KAKAO_KEY 를 확인하세요.')
      else if (code === 'LOAD_FAIL') setNotice('카카오 지도 로딩 실패. 키의 도메인(localhost:5173) 등록을 확인하세요.')
      else setNotice('위치 검색에 실패했어요. 잠시 후 다시 시도해주세요.')
    } finally {
      setLocating(false)
    }
  }

  useEffect(() => {
    if (!notice) return
    const t = setTimeout(() => setNotice(''), 6000)
    return () => clearTimeout(t)
  }, [notice])

  const ranks = useMemo(() => {
    const m = new Map()
    rec?.recommendations?.forEach((r) => m.set(r.restaurantId, r.rank))
    return m
  }, [rec])

  // 추천 대기 중엔 1차 후보 마커를 지도에 뿌려 "찾는 중" 맥락을 주고(로딩 연출과 함께),
  // 추천이 나오면 top3(순위 핀) + '아쉽게 밀린 곳'(작은 점)으로 교체한다.
  const markerPlaces = useMemo(() => {
    if (rec) {
      const recs = rec.recommendations ?? []
      const held = (rec.onHold ?? []).filter((o) => o.lat != null && o.lng != null)
      return [...recs, ...held]
    }
    return (Array.isArray(places) ? places : []).slice(0, 40) // 대기 중 1차 후보
  }, [rec, places])

  // 입력창의 메뉴를 목록에 추가(중복 무시). 여러 메뉴를 모아 한 번에 검색한다.
  const addMenu = (m) => {
    const v = (m ?? menu).trim()
    if (!v) return
    setMenus((prev) => (prev.includes(v) ? prev : [...prev, v]))
    setMenu('')
  }
  const removeMenu = (m) => setMenus((prev) => prev.filter((x) => x !== m))

  // 확정 메뉴 목록으로 결과 화면으로 전환하며 검색을 실행한다.
  const runSearch = async (listArg) => {
    // 목록 + 입력창에 남은 초안을 합쳐 검색 대상 확정
    const draft = menu.trim()
    let list = (listArg ?? menus).map((s) => s.trim()).filter(Boolean)
    if (!listArg && draft && !list.includes(draft)) list = [...list, draft]
    if (list.length === 0) {
      setNotice('메뉴를 하나 이상 골라주세요.')
      return
    }
    if (searching) return

    setMenus(list)
    setMenu('')
    const label = list.join(', ')
    setQueryMenu(label)
    setStep('result')
    window.scrollTo(0, 0) // 시트 모드는 페이지 스크롤 없이 딱 맞아야 한다
    setSelectedId(null)
    setPlaces(null)
    setPlacesError('')
    setRec(null)
    setRecError('')
    setShare(null) // 새 검색 = 새 추천이므로 이전 투표 링크는 버린다
    setWinner(null)
    setSheetPos('half')

    const params = { menus: list, headcount, lat: center.lat, lng: center.lng, radius, address: locName }

    setSearching(true)
    try {
      const { data } = await api.get('/places', { params })
      setPlaces(Array.isArray(data) ? data : [])
    } catch {
      setPlacesError('주변 식당을 불러오지 못했어요. 백엔드 서버(:8080)가 켜져 있는지 확인해주세요.')
      setSearching(false)
      return
    }

    setRecLoading(true)
    try {
      // Mock AI는 즉시 끝나므로, '후기 읽는 중' 로딩 연출이 보이도록 최소 표시 시간을 함께 기다린다.
      const [{ data }] = await Promise.all([
        api.post('/recommendations', params),
        new Promise((resolve) => setTimeout(resolve, 1800)),
      ])
      // 팀 응답(recommendationId, menu[], createdAt)을 화면 모델(recId, menu 문자열)로 매핑
      setRec({
        ...data,
        recId: data.recommendationId,
        menu: Array.isArray(data.menu) ? data.menu.join(', ') : data.menu,
        generatedAt: data.createdAt,
      })
      // 질의 차감 후 잔액 동기화 — 헤더 포인트 즉시 갱신
      try {
        const { data: p } = await api.get('/point')
        if (p?.point != null) setPoints(p.point)
      } catch {
        /* 잔액 표시는 부가 정보 */
      }
    } catch (err) {
      const msg = err?.response?.data?.message || ''
      // 포인트 부족은 일반 오류와 다르게 — 제보로 충전하는 길을 안내한다
      setRecError(msg.includes('포인트') ? 'NO_POINT' : 'AI 추천을 생성하지 못했어요. 잠시 후 다시 시도해주세요.')
    } finally {
      setRecLoading(false)
      setSearching(false)
    }
  }

  const menuForScrap = rec?.menu || queryMenu

  // 지도 마커 탭 → 선택 + 시트를 peek로 내려 지도 중심으로 (구글맵 패턴)
  const selectFromMap = (id) => {
    setSelectedId(id)
    setSheetPos('peek')
  }

  // peek 요약 탭 → 시트 half로 올리고 해당 카드로 스크롤 (에어비앤비 싱크)
  // 페이지가 아닌 시트 내부만 스크롤 — scrollIntoView는 조상(body)까지 끌어내려 레이아웃을 흔든다
  const openSheetAt = (id) => {
    setSheetPos('half')
    if (id != null) {
      setTimeout(() => {
        const body = document.querySelector('.bsheet-body')
        const card = document.getElementById(`rec-card-${id}`)
        if (body && card) body.scrollTo({ top: card.offsetTop - body.offsetTop - 12, behavior: 'smooth' })
      }, 350) // 시트가 올라온 뒤 스크롤
    }
  }

  const selectedPlace = selectedId == null ? null
    : markerPlaces.find((p) => p.restaurantId === selectedId) || null

  // 투표 링크 만들기 — 추천 1건당 1개(서버가 기존 토큰 재사용)
  const makeShare = async () => {
    if (!rec?.recId || shareBusy) return
    setShareBusy(true)
    try {
      const { data } = await api.post(`/recommendations/${rec.recId}/share`)
      setShare(data)
    } catch {
      setNotice('투표 링크를 만들지 못했어요. 잠시 후 다시 시도해주세요.')
    } finally {
      setShareBusy(false)
    }
  }

  const shareUrl = share ? `${window.location.origin}/vote/${share.token}` : ''

  const copyShare = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setNotice('투표 링크를 복사했어요! 친구들에게 보내보세요 🗳️')
    } catch {
      setNotice(shareUrl) // 클립보드 권한이 없으면 링크를 그대로 보여준다
    }
  }

  const closeShare = async () => {
    if (!rec?.recId || shareBusy) return
    setShareBusy(true)
    try {
      const { data } = await api.post(`/recommendations/${rec.recId}/share/close`)
      setShare(data)
      setNotice('투표를 마감했어요. 결과가 고정됩니다!')
      loadWinner(data.token)
    } catch {
      setNotice('마감에 실패했어요.')
    } finally {
      setShareBusy(false)
    }
  }

  // 마감된 투표의 최다 득표 가게 — 추천 카드(주소 포함)와 매칭해 스크랩에 담을 수 있게
  const loadWinner = async (token) => {
    try {
      const res = await fetch(`/api/v1/shared/${token}`)
      const body = await res.json()
      const view = body.data ?? body
      const counts = view.votes || {}
      const best = view.places
        .map((p) => ({ id: p.restaurantId, count: counts[p.restaurantId] || 0, rank: p.rankNo }))
        .sort((a, b) => b.count - a.count || a.rank - b.rank)[0]
      if (!best || best.count === 0) return
      const place = rec?.recommendations?.find((r) => r.restaurantId === best.id)
      if (place) setWinner({ ...place, voteCount: best.count })
    } catch {
      /* 우승 표시는 부가 기능 — 실패해도 조용히 넘어간다 */
    }
  }

  const shareToKakao = async () => {
    try {
      await shareVoteToKakao(rec?.menu || queryMenu, shareUrl)
    } catch {
      copyShare() // SDK 실패 시 링크 복사로 폴백
    }
  }

  // ── 1단계: 위치 + 메뉴 고르기 ──────────────────────────────
  if (step === 'compose') {
    return (
      <div className="mp compose" key="compose">
        {notice && <div className="mp-toast" role="status">{notice}</div>}

        <section className="loc-card">
          <div className="loc-card-top">
            <span className="loc-here">
              <span className="loc-dot" aria-hidden="true" />
              <b>{locName}</b> 에서 찾는 중
            </span>
            <button type="button" className="loc-me" onClick={locate} disabled={locating}>
              {locating ? '찾는 중…' : '🎯 내 위치'}
            </button>
          </div>
          <form className="loc-search" onSubmit={geocodeLocate}>
            <input
              className="loc-input"
              type="text"
              value={locQuery}
              onChange={(e) => setLocQuery(e.target.value)}
              placeholder="위치 검색 — 신당역, 동대문역사문화공원…"
            />
            <button type="submit" className="loc-go" disabled={locating}>이동</button>
          </form>
          <div className="loc-mini">
            <MapView
              center={center}
              centerLabel={centerLabel}
              places={[]}
              selectedId={null}
              onPick={(lat, lng) => { setCenter({ lat, lng }); setCenterLabel('') }}
              baseMap={baseMap}
              vworldKey={VWORLD_KEY}
            />
            <span className="loc-mini-hint">지도를 눌러 위치 조정</span>
          </div>
        </section>

        <section className="pick">
          <h1 className="pick-title">다 같이, 뭐 먹지?</h1>
          <p className="pick-sub">메뉴를 여러 개 넣으면 AI가 <b>다 되는 집</b>을 골라줘요. 인원수도 정해보세요.</p>

          <form className="menu-field" onSubmit={(e) => { e.preventDefault(); addMenu() }}>
            <span className="menu-ic" aria-hidden="true">🔍</span>
            <input
              className="menu-box"
              type="text"
              value={menu}
              onChange={(e) => setMenu(e.target.value)}
              placeholder="메뉴 입력 후 Enter로 추가"
              autoComplete="off"
            />
            <button type="submit" className="menu-add" disabled={!menu.trim()}>+ 추가</button>
          </form>

          {menus.length > 0 && (
            <div className="menu-tags">
              {menus.map((m) => (
                <span key={m} className="menu-tag">
                  {m}
                  <button type="button" onClick={() => removeMenu(m)} aria-label={`${m} 삭제`}>✕</button>
                </span>
              ))}
            </div>
          )}

          <div className="party">
            <span className="party-label">👥 인원</span>
            <div className="stepper">
              <button
                type="button"
                className="step-btn"
                onClick={() => setHeadcount((h) => Math.max(1, h - 1))}
                disabled={headcount <= 1}
                aria-label="인원 줄이기"
              >−</button>
              <span className="party-n tnum">{headcount}</span>
              <button
                type="button"
                className="step-btn"
                onClick={() => setHeadcount((h) => h + 1)}
                aria-label="인원 늘리기"
              >+</button>
            </div>
            <span className="party-unit">명</span>
          </div>

          <button
            type="button"
            className="find-btn"
            onClick={() => runSearch()}
            disabled={menus.length === 0 && !menu.trim()}
          >
            맛집 찾기{menus.length > 0 ? ` · ${menus.length}개 메뉴` : ''}
          </button>
          <p className="cost-hint">AI 추천 1회 = 3P (같은 검색 재실행은 10분간 무료) · 리뷰 +1P · 신규 매장 +5P</p>

          <div className="pop">
            <span className="pop-label">인기 메뉴</span>
            <div className="pop-chips">
              {POPULAR.map((m) => (
                <button
                  key={m}
                  type="button"
                  className={menus.includes(m) ? 'pop-chip on' : 'pop-chip'}
                  onClick={() => addMenu(m)}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>
    )
  }

  // ── 2단계: 결과 ─────────────────────────────────────────────
  return (
    <div className="mp result sheetmode" key="result">
      {notice && <div className="mp-toast" role="status">{notice}</div>}

      <header className="res-head">
        <button type="button" className="res-back" onClick={() => setStep('compose')} aria-label="뒤로">←</button>
        <div className="res-title">
          <span className="res-menu">{queryMenu}</span>
          <span className="res-loc">📍 {locName} · 👥 {headcount}명</span>
        </div>
        <button type="button" className="res-again" onClick={() => runSearch(menus)} disabled={searching}>
          {searching ? '…' : '다시'}
        </button>
      </header>

      <div className="res-map full">
        <MapView
          center={center}
          centerLabel={centerLabel}
          places={markerPlaces}
          ranks={ranks}
          selectedId={selectedId}
          onSelectPlace={selectFromMap}
          onBlankTap={() => setSelectedId(null)}
          baseMap={baseMap}
          vworldKey={VWORLD_KEY}
        />
      </div>

      {/* 바텀시트 — peek(지도 중심) / half(리스트). 비모달이라 뒤의 지도는 계속 조작 가능.
          핸들·요약 줄을 잡고 끌면 손가락을 따라오고, 놓으면 가까운 스냅점에 붙는다 */}
      <div className={`bsheet ${sheetPos}`} ref={sheetRef} {...sheetDrag}>
        <button
          type="button"
          className="bsheet-grab"
          onClick={() => setSheetPos(sheetPos === 'half' ? 'peek' : 'half')}
          aria-label="목록 열기/접기"
        >
          <span />
        </button>

        {sheetPos === 'peek' ? (
          <button type="button" className="bsheet-peek" onClick={() => openSheetAt(selectedId)}>
            {selectedPlace ? (
              <>
                {ranks.get(selectedPlace.restaurantId) && (
                  <span className={`rec-rank rank-${ranks.get(selectedPlace.restaurantId)}`}>
                    {ranks.get(selectedPlace.restaurantId)}
                  </span>
                )}
                <span className="peek-text">
                  <span className="peek-name">{selectedPlace.name}</span>
                  <span className="peek-meta">
                    {selectedPlace.evidenceCount != null
                      ? `근거 ${selectedPlace.evidenceCount}건`
                      : selectedPlace.reason || '아쉽게 밀린 곳'}
                  </span>
                </span>
                <span className="peek-cta">자세히 ›</span>
              </>
            ) : recLoading ? (
              <span className="peek-name">🤖 AI가 후기를 읽는 중…</span>
            ) : (
              <>
                <span className="peek-name">🍜 AI 추천 {rec?.recommendations?.length ?? 0}곳</span>
                <span className="peek-cta">올려서 보기 ›</span>
              </>
            )}
          </button>
        ) : (
        <div className="bsheet-body">

      {/* 투표는 그룹 기능 — 3인 이상 검색일 때만 노출 */}
      {rec && !recLoading && headcount >= 3 && (
        <div className="share-bar">
          {!share ? (
            <button type="button" className="share-make" onClick={makeShare} disabled={shareBusy}>
              🗳️ 친구들과 투표로 정하기
            </button>
          ) : (
            <div className="share-box">
              <a className="share-url" href={`/vote/${share.token}`} target="_blank" rel="noopener noreferrer">
                {shareUrl}
              </a>
              <button type="button" className="share-kakao" onClick={shareToKakao}>카톡 공유</button>
              <button type="button" className="share-copy" onClick={copyShare}>복사</button>
              {share.closed ? (
                <span className="share-closed">마감됨</span>
              ) : (
                <button type="button" className="share-close" onClick={closeShare} disabled={shareBusy}>
                  마감
                </button>
              )}
            </div>
          )}
          {winner && (
            <div className="share-winner" role="status">
              🏆 투표 결과 <b>{winner.name}</b> ({winner.voteCount}표)로 결정!
              <button
                type="button"
                className="share-copy"
                onClick={() => scrap(winner, menuForScrap)}
                disabled={scrappedIds.has(winner.restaurantId)}
              >
                {scrappedIds.has(winner.restaurantId) ? '스크랩됨 ✓' : '스크랩에 담기'}
              </button>
            </div>
          )}
        </div>
      )}

        {placesError && <p className="banner err" role="alert">{placesError}</p>}

        {recLoading && <LoadingStages />}
        {recError === 'NO_POINT' ? (
          <p className="banner err" role="alert">
            포인트가 부족해요. <Link to="/contribute">신규 맛집을 제보하면 +5P</Link>, 스크랩북에 리뷰를 쓰면 +1P를 받을 수 있어요.
          </p>
        ) : (
          recError && <p className="banner err" role="alert">{recError}</p>
        )}
        {!recLoading && rec && (
          <RecommendationResult
            result={rec}
            onScrap={(item) => scrap(item, menuForScrap)}
            scrappedIds={scrappedIds}
            scrappingId={scrappingId}
            onHover={setSelectedId}
            selectedId={selectedId}
          />
        )}
        </div>
        )}
      </div>

      {toast && <div className="mp-toast" role="status">{toast}</div>}
    </div>
  )
}
