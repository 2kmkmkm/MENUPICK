import { useEffect, useState } from 'react'
import api from '../api.js'

function formatDate(iso) {
  try {
    const d = new Date(iso)
    return `${d.getMonth() + 1}.${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(
      d.getMinutes(),
    ).padStart(2, '0')}`
  } catch {
    return ''
  }
}

export default function Points() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    Promise.all([api.get('/point'), api.get('/point/list')])
      .then(([balanceRes, listRes]) => {
        if (!alive) return
        const history = (Array.isArray(listRes.data) ? listRes.data : []).map((tx) => ({
          id: tx.pointId,
          reason: tx.reason,
          delta: tx.delta,
          createdAt: tx.createdAt,
        }))
        setData({ balance: balanceRes.data?.point ?? 0, history })
      })
      .catch(() => {
        if (alive) setError('포인트 내역을 불러오지 못했어요.')
      })
    return () => {
      alive = false
    }
  }, [])

  if (error) return <div className="page"><p className="contribute-error">{error}</p></div>
  if (!data) return <div className="page"><p>불러오는 중…</p></div>

  return (
    <div className="page points">
      <div className="points-balance">
        <span className="points-label">보유 포인트</span>
        <strong className="points-value tnum">{data.balance}P</strong>
      </div>

      <h2 className="points-title">적립 내역</h2>
      {data.history.length === 0 ? (
        <p className="points-empty">아직 내역이 없어요. 맛집을 제보하면 포인트가 쌓여요.</p>
      ) : (
        <ul className="points-list">
          {data.history.map((tx) => (
            <li key={tx.id} className="points-row">
              <span className="points-reason">{tx.reason}</span>
              <span className="points-date tnum">{formatDate(tx.createdAt)}</span>
              <span className={tx.delta >= 0 ? 'points-delta plus tnum' : 'points-delta minus tnum'}>
                {tx.delta >= 0 ? `+${tx.delta}` : tx.delta}P
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
