import { useEffect, useState } from 'react'

// AI 추천 단계에서 보여줄 '의도된' 로딩 애니메이션.
// 단계별 메시지가 순차적으로 진행되며 마지막 단계에서 멈춰 대기한다.
const STAGES = [
  '주변 후보 식당을 정리하는 중…',
  '가게별 최근 후기를 읽는 중…',
  '메뉴와 맞는 근거를 모으는 중…',
  'AI가 상위 3곳을 고르는 중…',
]

export default function LoadingStages() {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => {
      setStep((s) => (s < STAGES.length - 1 ? s + 1 : s))
    }, 1300)
    return () => window.clearInterval(id)
  }, [])

  return (
    <div className="loading-stages" role="status" aria-live="polite">
      <div className="loading-head">
        <span className="spinner" aria-hidden="true" />
        <span className="loading-title">AI가 맛집을 고르고 있어요</span>
      </div>
      <ul className="stage-list">
        {STAGES.map((msg, i) => {
          const state = i < step ? 'done' : i === step ? 'active' : ''
          return (
            <li key={msg} className={`stage ${state}`}>
              <span className="stage-mark" aria-hidden="true">
                {i < step ? '✓' : i === step ? '●' : '○'}
              </span>
              <span className="stage-text">{msg}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
