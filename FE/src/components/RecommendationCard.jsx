import { formatDistance } from '../utils/format.js'

export default function RecommendationCard({ item, onScrap, scrapped, busy, onHover, selected }) {
  const {
    rank,
    name,
    category,
    distanceM,
    reason,
    quote,
    evidenceCount,
    verdict,
    groupOk,
    naverUrl,
    topTags,
  } = item

  const dist = formatDistance(distanceM)
  // 팀 응답의 quote 는 문장 배열 — 화면에는 한 줄로 합쳐 보여준다
  const quoteText = Array.isArray(quote) ? quote.filter(Boolean).join(' · ') : quote
  // 저장형 XSS 이중 방어 — href 는 http(s)만 렌더한다(서버도 저장 시 검증함)
  const rawUrl = naverUrl || item.placeUrl
  const safeUrl = rawUrl && /^https?:\/\//i.test(rawUrl) ? rawUrl : null

  return (
    <article
      id={`rec-card-${item.restaurantId}`}
      className={selected ? 'rec-card sel' : 'rec-card'}
      onMouseEnter={() => onHover?.(item.restaurantId)}
    >
      <div className={`rec-rank rank-${rank}`} aria-label={`추천 순위 ${rank}위`}>{rank}</div>

      <div className="rec-body">
        <div className="rec-head">
          <h3 className="rec-name">{name}</h3>
          {category && <span className="rec-cat">{category}</span>}
          {groupOk && <span className="rec-group">👥 단체 가능</span>}
          {dist && <span className="rec-dist tnum">{dist}</span>}
        </div>

        {verdict && <div className="rec-verdict">{verdict}</div>}
        {reason && <p className="rec-reason">{reason}</p>}
        {quoteText && <blockquote className="rec-quote">“{quoteText}”</blockquote>}

        {/* 방문자 태그 집계 — 스크랩 리뷰가 모여 만든 실방문 데이터 */}
        {topTags?.length > 0 && (
          <div className="rec-tags">
            {topTags.map((t) => (
              <span key={t} className="rec-tag">🏷️ {t}</span>
            ))}
          </div>
        )}

        <div className="rec-foot">
          {evidenceCount != null && (
            <span className="rec-evidence tnum">근거 {evidenceCount}건</span>
          )}
          {safeUrl && (
            <a
              className="rec-link"
              href={safeUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              원문 보기 ↗
            </a>
          )}
          <button
            type="button"
            className={scrapped ? 'btn-scrap scrapped' : 'btn-scrap'}
            onClick={() => onScrap?.(item)}
            disabled={scrapped || busy}
          >
            {scrapped ? '스크랩됨 ✓' : busy ? '담는 중…' : '스크랩'}
          </button>
        </div>
      </div>
    </article>
  )
}
