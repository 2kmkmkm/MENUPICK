import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../Components/BottomNav';

const MOCK_SCRAPS = [
  { id: 1, name: '한방 통닭구이 신당', address: '중구 퇴계로 86길 15', menu: '치킨', memo: '', rating: 0 },
  { id: 2, name: '신라방마라탕', address: '중구 퇴계로 80길 31', menu: '마라탕', memo: '', rating: 0 },
];

function Scraps() {
  const [scraps, setScraps] = useState(MOCK_SCRAPS);
  const navigate = useNavigate();

  const updateMemo = (id, memo) => {
    setScraps(scraps.map((s) => (s.id === id ? { ...s, memo } : s)));
  };

  const updateRating = (id, rating) => {
    setScraps(scraps.map((s) => (s.id === id ? { ...s, rating } : s)));
  };

  const deleteScrap = (id) => {
    setScraps(scraps.filter((s) => s.id !== id));
  };

  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <div
      style={{
        background: '#FFF9F4',
        minHeight: '100vh',
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        boxSizing: 'border-box',
      }}
    >
      <p style={{ fontSize: 17, fontWeight: 500, color: '#2B2320', margin: '0 0 4px' }}>
        스크랩북
      </p>

      {scraps.map((s) => (
        <div
          key={s.id}
          style={{
            background: '#FFFFFF',
            border: '1px solid #F0E4D8',
            borderRadius: 14,
            padding: 12,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 500, color: '#2B2320', margin: 0 }}>{s.name}</p>
              <p style={{ fontSize: 11, color: '#8A7E76', margin: '2px 0 0' }}>{s.address}</p>
            </div>
            <span
              style={{
                fontSize: 11,
                background: '#FFF0E0',
                color: '#B35400',
                padding: '3px 8px',
                borderRadius: 8,
              }}
            >
              {s.menu}
            </span>
          </div>

          <input
            value={s.memo}
            onChange={(e) => updateMemo(s.id, e.target.value)}
            placeholder="방문 후 느낀 점을 적어두세요"
            style={{
              width: '100%',
              background: '#FFF9F4',
              border: '1px solid #F0E4D8',
              borderRadius: 10,
              padding: '8px 10px',
              fontSize: 12,
              color: '#2B2320',
              marginBottom: 8,
              boxSizing: 'border-box',
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 14, letterSpacing: 2 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <span
                  key={n}
                  onClick={() => updateRating(s.id, n)}
                  style={{ cursor: 'pointer', color: n <= s.rating ? '#FF7A00' : '#F0E4D8' }}
                >
                  ★
                </span>
              ))}
            </span>
            <span
              onClick={() => deleteScrap(s.id)}
              style={{
                fontSize: 11,
                color: '#8A7E76',
                cursor: 'pointer',
                borderBottom: '1px solid #F0E4D8',
              }}
            >
              삭제
            </span>
          </div>
        </div>
      ))}

      <div style={{ marginTop: 'auto' }} />
      <BottomNav onLogout={handleLogout} />
    </div>
  );
}

export default Scraps;