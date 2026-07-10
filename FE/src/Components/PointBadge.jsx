import { useNavigate } from 'react-router-dom';

function PointBadge({ points }) {
  const navigate = useNavigate();

  return (
    <span
      onClick={() => navigate('/points')}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 3,
        background: '#FFF0E0',
        color: '#B35400',
        fontSize: 11,
        fontWeight: 500,
        padding: '5px 9px',
        borderRadius: 999,
        cursor: 'pointer',
      }}
    >
      🪙 {points.toLocaleString()}P
    </span>
  );
}

export default PointBadge;