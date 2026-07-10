import { useNavigate, useLocation } from 'react-router-dom';

const TABS = [
  { label: '검색', path: '/search' },
  { label: '스크랩북', path: '/scraps' },
  { label: '기록', path: '/history' },
];

function BottomNav({ onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-around',
        paddingTop: 8,
        marginTop: 'auto',
        borderTop: '1px solid #F0E4D8',
      }}
    >
      {TABS.map((tab) => (
        <span
          key={tab.path}
          onClick={() => navigate(tab.path)}
          style={{
            fontSize: 10,
            cursor: 'pointer',
            color: location.pathname === tab.path ? '#FF7A00' : '#8A7E76',
          }}
        >
          {tab.label}
        </span>
      ))}
      <span
        onClick={onLogout}
        style={{ fontSize: 10, cursor: 'pointer', color: '#8A7E76' }}
      >
        로그아웃
      </span>
    </div>
  );
}

export default BottomNav;