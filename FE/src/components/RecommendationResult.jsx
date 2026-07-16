import RecommendationCard from './RecommendationCard.jsx'
import { formatDateTime } from '../utils/format.js'

// POST /recommendations 또는 GET /recommendations/{id} 결과를 렌더링한다.
export default function RecommendationResult({ result, onScrap, scrappedIds, scrappingId, onHover, selectedId }) {
  if (!result) return null

  const recommendations = Array.isArray(result.recommendations) ? result.recommendations : []
  const onHold = Array.isArray(result.onHold) ? result.onHold : []

  return (
    <section className="rec-result">
      <div className="rec-result-head">
        <h2 className="section-title">
          AI 추천 <span className="rec-menu-tag">{result.menu}</span>
        </h2>
        {result.generatedAt && (
          <span className="muted tnum">{formatDateTime(result.generatedAt)} 생성</span>
        )}
      </div>

      {recommendations.length === 0 ? (
        <p className="empty">추천할 만한 곳을 찾지 못했어요. 반경을 넓혀 다시 시도해보세요.</p>
      ) : (
        <div className="rec-list">
          {recommendations.map((r) => (
            <RecommendationCard
              key={r.restaurantId ?? `${r.rank}-${r.name}`}
              item={r}
              onScrap={onScrap}
              scrapped={scrappedIds?.has(r.restaurantId)}
              busy={scrappingId === r.restaurantId}
              onHover={onHover}
              selected={selectedId === r.restaurantId}
            />
          ))}
        </div>
      )}

      {onHold.length > 0 && (
        <div className="onhold">
          <h3 className="onhold-title">아쉽게 밀린 곳</h3>
          <p className="muted onhold-desc">top 3는 아니지만 ‘{result.menu}’ 후기가 많은 대안이에요.</p>
          <div className="onhold-list">
            {onHold.map((o) => (
              <div
                className={selectedId === o.restaurantId ? 'onhold-card sel' : 'onhold-card'}
                key={o.restaurantId ?? o.name}
                id={`rec-card-${o.restaurantId}`}
                onClick={() => onHover?.(o.restaurantId)}
                role="button"
                tabIndex={0}
              >
                <strong className="onhold-name">{o.name}</strong>
                <p className="muted">{o.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
