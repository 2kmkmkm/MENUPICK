import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../Components/BottomNav';

const MOCK_SCRAPS = [
  { id: 1, name: '한방 통닭구이 신당', address: '중구 퇴계로 86길 15', menu: '치킨', savedMemo: '', savedRating: 0, draftMemo: '', draftRating: 0 },
  { id: 2, name: '신라방마라탕', address: '중구 퇴계로 80길 31', menu: '마라탕', savedMemo: '', savedRating: 0, draftMemo: '', draftRating: 0 },
];

function Scraps() {
  const [scraps, setScraps] = useState(MOCK_SCRAPS);
  const navigate = useNavigate();

  const updateDraftMemo = (id, memo) => {
    setScraps(scraps.map((s) => (s.id === id ? { ...s, draftMemo: memo } : s)));
  };

  const updateDraftRating = (id, rating) => {
    setScraps(scraps.map((s) => (s.id === id ? { ...s, draftRating: rating } : s)));
  };

  const submitReview = (id) => {
    const target = scraps.find((s) => s.id === id);
    const isFirstSubmit = !target.savedMemo && target.savedRating === 0;

    // TODO: 실제 연동
    // isFirstSubmit이면 POST /api/v1/scraps/review
    // 아니면 PATCH /api/v1/scraps/review

    setScraps(
      scraps.map((s) =>
        s.id === id ? { ...s, savedMemo: s.draftMemo, savedRating: s.draftRating } : s,
      ),
    );
  };

  const deleteScrap = (id) => {
    setScraps(scraps.filter((s) => s.id !== id));
    // TODO: DELETE /api/v1/scraps
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

      {scraps.map((s) => {
        const isDirty = s.draftMemo !== s.savedMemo || s.draftRating !== s.savedRating;
        return (
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
              value={s.draftMemo}
              onChange={(e) => updateDraftMemo(s.id, e.target.value)}
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

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isDirty ? 8 : 0 }}>
              <span style={{ fontSize: 14, letterSpacing: 2 }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <span
                    key={n}
                    onClick={() => updateDraftRating(s.id, n)}
                    style={{ cursor: 'pointer', color: n <= s.draftRating ? '#FF7A00' : '#F0E4D8' }}
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

            {isDirty && (
              <div
                onClick={() => submitReview(s.id)}
                style={{
                  background: '#FF7A00',
                  color: '#fff',
                  textAlign: 'center',
                  fontSize: 12,
                  fontWeight: 500,
                  padding: '8px',
                  borderRadius: 10,
                  cursor: 'pointer',
                }}
              >
                {s.savedMemo || s.savedRating > 0 ? '수정 완료' : '리뷰 등록'}
              </div>
            )}
          </div>
        );
      })}

      <div style={{ marginTop: 'auto' }} />
      <BottomNav onLogout={handleLogout} />
    </div>
  );
}

export default Scraps;