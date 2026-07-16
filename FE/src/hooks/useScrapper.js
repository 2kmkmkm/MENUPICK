import { useCallback, useState } from 'react'
import api from '../api.js'

// 추천/후보 카드에서 '스크랩'을 처리하는 공용 훅.
// Search 화면과 History 상세에서 함께 재사용한다.
export function useScrapper() {
  const [scrappedIds, setScrappedIds] = useState(() => new Set())
  const [scrappingId, setScrappingId] = useState(null)
  const [toast, setToast] = useState('')

  const showToast = useCallback((message) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2200)
  }, [])

  const scrap = useCallback(
    async (item, menu) => {
      if (!item || item.restaurantId == null) return
      setScrappingId(item.restaurantId)
      try {
        await api.post(`/scraps/${item.restaurantId}`)
        setScrappedIds((prev) => {
          const next = new Set(prev)
          next.add(item.restaurantId)
          return next
        })
        showToast(`‘${item.name}’ 를 스크랩북에 담았어요.`)
      } catch {
        showToast('스크랩에 실패했어요. 잠시 후 다시 시도해주세요.')
      } finally {
        setScrappingId(null)
      }
    },
    [showToast],
  )

  return { scrappedIds, scrappingId, toast, scrap }
}
