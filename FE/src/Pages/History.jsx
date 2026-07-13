import { useNavigate } from 'react-router-dom';
import BottomNav from '../Components/BottomNav';

const MOCK_HISTORY = [
  { id: 1, menus: '치킨, 마라탕', headcount: 4, date: '7/9' },
  { id: 2, menus: '김밥, 돈까스', headcount: 2, date: '7/8' },
  { id: 3, menus: '떡볶이, 순대, 튀김', headcount: 10, date: '7/7' },
];

function History() {
  const navigate = useNavigate();

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
        gap: 8,
        boxSizing: 'border-box',
      }}
    >
      <p style={{ fontSize: 17, fontWeight: 500, color: '#2B2320', margin: '0 0 4px' }}>
        검색 기록
      </p>

      {MOCK_HISTORY.map((h) => (
        <div
          key={h.id}
          style={{
            background: '#FFFFFF',
            border: '1px solid #F0E4D8',
            borderRadius: 12,
            padding: 12,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, color: '#2B2320', margin: 0 }}>{h.menus}</p>
            <p style={{ fontSize: 11, color: '#8A7E76', margin: '2px 0 0' }}>
              {h.headcount}명 · 신당동 인근
            </p>
          </div>
          <span style={{ fontSize: 11, color: '#8A7E76' }}>{h.date}</span>
        </div>
      ))}

      <div style={{ marginTop: 'auto' }} />
      <BottomNav onLogout={handleLogout} />
    </div>
  );
}

export default History;