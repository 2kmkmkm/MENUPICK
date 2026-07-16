// 카카오 지도 SDK(services) 로더 + 장소검색 유틸.
// FE-10에서 배운 services.Places 키워드 검색을 그대로 쓴다 —
// "인하대 후문"·"백소정" 같은 생활 POI를 정확한 지점으로 돌려준다(버스정류장 오배치 없음).

const SDK_URL = 'https://dapi.kakao.com/v2/maps/sdk.js'

let sdkPromise = null

// SDK 스크립트를 한 번만 주입하고, kakao.maps.load 까지 끝나면 resolve.
// autoload=false + kakao.maps.load(): 키가 .env(VITE_KAKAO_KEY)에 있으므로 index.html에 하드코딩하지 않는다.
export function loadKakao() {
  if (typeof window !== 'undefined' && window.kakao?.maps?.services) {
    return Promise.resolve(window.kakao)
  }
  if (sdkPromise) return sdkPromise

  const key = import.meta.env.VITE_KAKAO_KEY
  if (!key) return Promise.reject(new KakaoError('NO_KEY'))

  sdkPromise = new Promise((resolve, reject) => {
    const fail = () => {
      sdkPromise = null // 실패는 캐시하지 않아 다음 시도가 다시 붙게
      reject(new KakaoError('LOAD_FAIL'))
    }
    // 도메인 미등록 시 스크립트가 200으로 오지만 window.kakao를 안 만들거나
    // load 콜백이 영영 안 불릴 수 있어, 타임아웃으로 매달림을 끊는다.
    const timer = setTimeout(fail, 8000)
    const settleFail = () => {
      clearTimeout(timer)
      fail()
    }

    const script = document.createElement('script')
    script.src = `${SDK_URL}?appkey=${key}&libraries=services&autoload=false`
    script.async = true
    script.onload = () => {
      // 도메인 미등록·잘못된 키면 onload는 떠도 window.kakao가 없다 → 조용히 매달리지 말고 실패 처리
      if (!window.kakao || !window.kakao.maps) return settleFail()
      window.kakao.maps.load(() => {
        clearTimeout(timer)
        resolve(window.kakao)
      })
    }
    script.onerror = settleFail
    document.head.appendChild(script)
  })
  return sdkPromise
}

// 키워드로 장소 1건을 찾아 좌표+이름표로 반환. near가 있으면 그 지점 인근을 우선.
export async function kakaoSearchPlace(query, near) {
  const kakao = await loadKakao()
  return new Promise((resolve, reject) => {
    const places = new kakao.maps.services.Places()
    const options = {}
    if (near) {
      // 위치는 인근으로 편향하되 정렬은 '정확도'로 — 거리순을 강제하면
      // "인하대 정문" 같은 랜드마크 질의가 토큰만 걸린 근처 식당으로 잡힌다.
      options.location = new kakao.maps.LatLng(near.lat, near.lng)
      options.radius = 20000 // 20km 내 우선 (카카오 허용 최대)
      options.sort = kakao.maps.services.SortBy.ACCURACY
    }
    places.keywordSearch(
      query,
      (data, status) => {
        if (status === kakao.maps.services.Status.OK && data.length > 0) {
          const d = data[0]
          resolve({
            lat: parseFloat(d.y), // 카카오는 문자열 좌표 → parseFloat (FE-10에서 배운 그 처리)
            lng: parseFloat(d.x),
            label: d.place_name,
            address: d.road_address_name || d.address_name || '',
            category: d.category_group_name || '',
          })
        } else if (status === kakao.maps.services.Status.ZERO_RESULT) {
          reject(new KakaoError('ZERO_RESULT'))
        } else {
          reject(new KakaoError('SEARCH_FAIL'))
        }
      },
      options,
    )
  })
}

// 키워드로 실존 가게 여러 건을 찾아 반환 — 제보 화면의 "실제 있는 가게" 검증용.
// 음식점(FD6)·카페(CE7)만 남긴다(약국·패션 등 오등록 방지 — 크롤 때 겪은 그 문제).
export async function kakaoSearchPlacesMulti(query, near, limit = 5) {
  const kakao = await loadKakao()
  return new Promise((resolve, reject) => {
    const places = new kakao.maps.services.Places()
    const options = {}
    if (near) {
      options.location = new kakao.maps.LatLng(near.lat, near.lng)
      options.radius = 20000
      options.sort = kakao.maps.services.SortBy.ACCURACY
    }
    places.keywordSearch(
      query,
      (data, status) => {
        if (status === kakao.maps.services.Status.OK && data.length > 0) {
          const foods = data
            .filter((d) => d.category_group_code === 'FD6' || d.category_group_code === 'CE7')
            .slice(0, limit)
            .map((d) => ({
              kakaoId: d.id,
              name: d.place_name,
              category: d.category_name?.split('>').pop()?.trim() || d.category_group_name || '',
              address: d.road_address_name || d.address_name || '',
              lat: parseFloat(d.y),
              lng: parseFloat(d.x),
              placeUrl: d.place_url || '',
            }))
          resolve(foods)
        } else if (status === kakao.maps.services.Status.ZERO_RESULT) {
          resolve([])
        } else {
          reject(new KakaoError('SEARCH_FAIL'))
        }
      },
      options,
    )
  })
}

// 원인 코드를 실어 호출부가 상황별 안내를 띄울 수 있게 하는 에러 타입
export class KakaoError extends Error {
  constructor(code) {
    super(code)
    this.name = 'KakaoError'
    this.code = code
  }
}
