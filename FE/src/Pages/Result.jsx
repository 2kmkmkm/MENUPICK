import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import RestaurantCard from '../Components/RestaurantCard';
import Map from '../Map';
import BottomNav from '../Components/BottomNav';

const MOCK_RESULTS = [
  {
    id: 1,
    rank: 1,
    name: '신당동 떡볶이',
    matchedMenus: ['치킨', '마라탕'],
    groupOk: true,
    reason: '치킨·마라탕 후기 모두 반복 언급됨, 두 메뉴 다 평이 좋음',
    quote: '매콤한 마라탕이 진하다',
    evidenceCount: 12,
  },
  {
    id: 2,
    rank: 2,
    name: '한방 통닭구이 신당',
    matchedMenus: ['치킨'],
    groupOk: true,
    reason: '치킨 후기 다수, 바삭한 튀김옷 언급 많음',
    quote: '겉바속촉 치킨',
    evidenceCount: 8,
  },
];

const ON_HOLD = [{ id: 3, name: '동대문 마라궁' }];

function Result() {
  const [scrapedIds, setScrapedIds] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = location.state || {};

  const toggleScrap = (id) => {
    setScrapedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
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
      <p style={{ fontSize: 17, fontWeight: 500, color: '#2B2320', margin: '0 0 2px' }}>
        검색 결과
      </p>
      {searchParams.regionName && (
        <p style={{ fontSize: 11, color: '#8A7E76', margin: '0 0 2px' }}>
          {searchParams.regionName} · {searchParams.headcount}명 ·{' '}
          {(searchParams.menus || []).join(', ')}
        </p>
      )}

      <Map lat={searchParams.lat} lng={searchParams.lng} height={90} />

      {MOCK_RESULTS.map((r) => (
        <RestaurantCard
          key={r.id}
          rank={r.rank}
          name={r.name}
          matchedMenus={r.matchedMenus}
          groupOk={r.groupOk}
          reason={r.reason}
          quote={r.quote}
          evidenceCount={r.evidenceCount}
          scraped={scrapedIds.includes(r.id)}
          onScrapToggle={() => toggleScrap(r.id)}
        />
      ))}

      {ON_HOLD.length > 0 && (
        <p style={{ fontSize: 11, color: '#8A7E76', margin: '2px 0 0' }}>
          아쉽게 밀린 곳 {ON_HOLD.length}곳 보기 ›
        </p>
      )}

      <div style={{ marginTop: 'auto' }} />
      <BottomNav onLogout={handleLogout} />
    </div>
  );
}

export default Result;