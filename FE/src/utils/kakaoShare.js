// 카카오톡 공유(JS SDK v2). 지도용 SDK(kakao.js의 maps)와는 별개 스크립트다.
// 같은 VITE_KAKAO_KEY(JavaScript 키)를 쓰고, 도메인 등록도 동일하게 적용된다.

const SDK_URL = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js'

let sdkPromise = null

function loadShareSdk() {
  if (window.Kakao?.Share) return Promise.resolve(window.Kakao)
  if (sdkPromise) return sdkPromise

  const key = import.meta.env.VITE_KAKAO_KEY
  if (!key) return Promise.reject(new Error('NO_KEY'))

  sdkPromise = new Promise((resolve, reject) => {
    const timer = setTimeout(() => { sdkPromise = null; reject(new Error('LOAD_FAIL')) }, 8000)
    const script = document.createElement('script')
    script.src = SDK_URL
    script.async = true
    script.onload = () => {
      clearTimeout(timer)
      if (!window.Kakao) { sdkPromise = null; return reject(new Error('LOAD_FAIL')) }
      if (!window.Kakao.isInitialized()) window.Kakao.init(key)
      resolve(window.Kakao)
    }
    script.onerror = () => { clearTimeout(timer); sdkPromise = null; reject(new Error('LOAD_FAIL')) }
    document.head.appendChild(script)
  })
  return sdkPromise
}

/** 투표 링크를 카카오톡으로 공유. 실패하면 throw — 호출부에서 링크 복사로 폴백한다. */
export async function shareVoteToKakao(menu, url) {
  const Kakao = await loadShareSdk()
  Kakao.Share.sendDefault({
    objectType: 'text',
    text: `🗳️ "${menu}" 어디로 갈까요?\nAI가 후기로 고른 top 3 — 투표로 정해요!`,
    link: { mobileWebUrl: url, webUrl: url },
    buttonTitle: '투표하러 가기',
  })
}
