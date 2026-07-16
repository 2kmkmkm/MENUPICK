import { useRef, useCallback } from 'react'

// 바텀시트 드래그 제스처 (구글맵·에어비앤비 패턴)
// 손가락을 따라 시트 높이가 실시간으로 움직이고, 놓으면 플릭 속도/현재 위치 기준으로
// peek·half 중 한 스냅점에 붙는다. 탭(6px 미만 이동)은 드래그로 취급하지 않아
// 기존 onClick 토글과 공존한다.
const PEEK_H = 96 // .bsheet.peek 높이와 일치해야 한다
const HALF_RATIO = 0.64 // .bsheet.half 높이와 일치해야 한다
const TAP_SLOP = 6 // 이만큼 움직이기 전엔 탭으로 본다
const SWAP_GAP = 60 // 이 경계를 넘으면 드래그 중에 내용물(요약↔리스트)을 미리 교체
const FLICK_V = 0.35 // px/ms — 이보다 빠른 튕김은 위치와 무관하게 그 방향으로 스냅

export default function useSheetDrag(sheetRef, setSheetPos) {
  const drag = useRef(null)
  const clickGuard = useRef(false)

  const onPointerDown = useCallback(
    (e) => {
      // 시트 본문 스크롤과 충돌하지 않게 그랩 핸들·peek 요약 줄에서만 드래그 시작
      if (!e.target.closest('.bsheet-grab, .bsheet-peek')) return
      const el = sheetRef.current
      if (!el) return
      drag.current = {
        id: e.pointerId,
        startY: e.clientY,
        startH: el.getBoundingClientRect().height,
        boxH: el.parentElement.clientHeight,
        lastY: e.clientY,
        lastT: e.timeStamp,
        v: 0,
        moved: false,
      }
    },
    [sheetRef],
  )

  const onPointerMove = useCallback(
    (e) => {
      const d = drag.current
      const el = sheetRef.current
      if (!d || !el || e.pointerId !== d.id) return
      const dy = d.startY - e.clientY // 위로 끌면 양수
      if (!d.moved) {
        if (Math.abs(dy) < TAP_SLOP) return
        d.moved = true
        el.style.transition = 'none' // 드래그 중엔 스냅 애니메이션 없이 손가락에 밀착
        try {
          // 커서가 시트 밖으로 나가도 이벤트를 계속 받도록 (마우스용 — 터치는 암묵 캡처)
          e.currentTarget.setPointerCapture(d.id)
        } catch {
          /* 합성 이벤트 등 캡처 불가 환경은 버블링만으로 동작 */
        }
      }
      const halfH = d.boxH * HALF_RATIO
      const h = Math.min(halfH, Math.max(PEEK_H, d.startH + dy))
      el.style.height = `${h}px`
      const dt = e.timeStamp - d.lastT
      if (dt > 0) d.v = (e.clientY - d.lastY) / dt
      d.lastY = e.clientY
      d.lastT = e.timeStamp
      // 경계를 넘으면 내용물을 미리 바꿔 놓는 순간 '팍' 바뀌는 위화감을 줄인다
      setSheetPos(h > PEEK_H + SWAP_GAP ? 'half' : 'peek')
    },
    [sheetRef, setSheetPos],
  )

  const onPointerUp = useCallback(
    (e) => {
      const d = drag.current
      const el = sheetRef.current
      if (!d || e.pointerId !== d.id) return
      drag.current = null
      if (!el || !d.moved) return // 탭 — 기존 onClick이 처리
      const halfH = d.boxH * HALF_RATIO
      const h = el.getBoundingClientRect().height
      // 플릭이면 그 방향으로, 아니면 중간점 기준 가까운 쪽으로
      const target =
        d.v < -FLICK_V ? 'half' : d.v > FLICK_V ? 'peek' : h > (PEEK_H + halfH) / 2 ? 'half' : 'peek'
      setSheetPos(target)
      // 드래그 직후 따라오는 click 무시 — 단, click은 pointerup 직후 동기적으로 오므로
      // 타이머로 곧장 해제해 click이 아예 안 오는 경우(캡처 드래그)에 다음 탭을 삼키지 않게 한다
      clickGuard.current = true
      setTimeout(() => {
        clickGuard.current = false
      }, 0)
      requestAnimationFrame(() => {
        // transition을 되살린 뒤 인라인 높이를 지워 클래스 높이로 부드럽게 스냅
        el.style.transition = ''
        el.style.height = ''
      })
    },
    [sheetRef, setSheetPos],
  )

  const onClickCapture = useCallback((e) => {
    if (!clickGuard.current) return
    clickGuard.current = false
    e.preventDefault()
    e.stopPropagation()
  }, [])

  return { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp, onClickCapture }
}
