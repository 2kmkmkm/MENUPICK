import { useNavigate } from 'react-router-dom';
import PointHistoryItem from '../Components/PointHistoryItem';
import BottomNav from '../Components/BottomNav';

const MOCK_HISTORY = [
  { reason: '리뷰 적립 · 신라방마라탕', date: '', delta: 1 },
  { reason: 'AI 추천 사용', date: '', delta: -3 },
  { reason: '떡볶이-단골매장 등록', date: '', delta: 5 },
];

function PointHistory({ points = 12 }) {
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
        gap: 10,
        boxSizing: 'border-box',
      }}
    >
      <p style={{ fontSize: 17, fontWeight: 500, color: '#2B2320', margin: 0 }}>
        포인트 적립 내역
      </p>

      <div style={{ marginTop: 4 }}>
        {MOCK_HISTORY.map((item, i) => (
          <PointHistoryItem key={i} reason={item.reason} date={item.date} delta={item.delta} />
        ))}
      </div>

      <div style={{ marginTop: 'auto' }} />
      <BottomNav onLogout={handleLogout} />
    </div>
  );
}

export default PointHistory;