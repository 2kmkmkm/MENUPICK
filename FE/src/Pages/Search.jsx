import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../Components/Button';
import MenuChip from '../Components/MenuChip';
import PointBadge from '../Components/PointBadge';
import BottomNav from '../Components/BottomNav';
import Map from '../Map';

const POPULAR_MENUS = ['해장국', '김치찌개', '삼겹살', '돈까스', '국밥'];
const DEFAULT_LAT = 37.5651;
const DEFAULT_LNG = 127.0165;

function reverseGeocode(lat, lng, callback) {
  if (!window.kakao || !window.kakao.maps || !window.kakao.maps.services) {
    callback(null);
    return;
  }
  const geocoder = new window.kakao.maps.services.Geocoder();
  geocoder.coord2RegionCode(lng, lat, (result, status) => {
    if (status === window.kakao.maps.services.Status.OK) {
      const region = result.find((r) => r.region_type === 'H') || result[0];
      callback(region ? region.region_3depth_name : null);
    } else {
      callback(null);
    }
  });
}

function Search() {
  const [selectedMenus, setSelectedMenus] = useState([]);
  const [menuInput, setMenuInput] = useState('');
  const [headcount, setHeadcount] = useState(4);
  const [coords, setCoords] = useState({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });
  const [locating, setLocating] = useState(false);
  const [regionName, setRegionName] = useState('신당동');
  const navigate = useNavigate();

  useEffect(() => {
    reverseGeocode(coords.lat, coords.lng, (name) => {
      if (name) setRegionName(name);
    });
  }, [coords]);

  const addMenu = (menu) => {
    const trimmed = menu.trim();
    if (trimmed && !selectedMenus.includes(trimmed)) {
      setSelectedMenus([...selectedMenus, trimmed]);
    }
    setMenuInput('');
  };

  const removeMenu = (menu) => {
    setSelectedMenus(selectedMenus.filter((m) => m !== menu));
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing && menuInput.trim()) {
      addMenu(menuInput);
    }
  };

  const handleLocate = () => {
    if (!navigator.geolocation) {
      alert('이 브라우저는 위치 기능을 지원하지 않아요');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        alert('위치 정보를 가져올 수 없어요. 위치 권한을 확인해주세요');
        setLocating(false);
      },
    );
  };

  const handleSearch = () => {
    navigate('/loading', {
      state: {
        menus: selectedMenus,
        headcount,
        lat: coords.lat,
        lng: coords.lng,
        regionName,
      },
      replace: true,
    });
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, color: '#8A7E76' }}>{regionName} 인근에서 찾는 중</span>
        <PointBadge points={12} />
      </div>

      <span
        onClick={handleLocate}
        style={{ fontSize: 12, color: '#FF7A00', fontWeight: 500, cursor: 'pointer' }}
      >
        {locating ? '위치 찾는 중...' : '내 위치'}
      </span>

      <Map lat={coords.lat} lng={coords.lng} height={90} />

      <p style={{ fontSize: 16, fontWeight: 500, color: '#2B2320', margin: '4px 0 0' }}>
        지금, 뭐 땡겨요?
      </p>

      <div style={{ position: 'relative' }}>
        <input
          value={menuInput}
          onChange={(e) => setMenuInput(e.target.value)}
          onKeyDown={handleInputKeyDown}
          placeholder="메뉴 입력 후 Enter 로 추가"
          style={{
            width: '100%',
            height: 40,
            background: '#FFFFFF',
            border: '1px solid #F0E4D8',
            borderRadius: 12,
            padding: '0 36px 0 12px',
            fontSize: 13,
            boxSizing: 'border-box',
          }}
        />
        <span
          style={{
            position: 'absolute',
            right: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 14,
            color: '#8A7E76',
          }}
        >
          🔍
        </span>
      </div>

      {selectedMenus.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {selectedMenus.map((menu) => (
            <MenuChip
              key={menu}
              label={menu}
              selected
              removable
              onClick={() => removeMenu(menu)}
            />
          ))}
        </div>
      )}

      <div>
        <p style={{ fontSize: 13, fontWeight: 500, color: '#2B2320', margin: '0 0 6px' }}>인기 메뉴</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {POPULAR_MENUS.map((menu) => (
            <MenuChip key={menu} label={menu} onClick={() => addMenu(menu)} />
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, color: '#2B2320' }}>인원수</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span
            onClick={() => setHeadcount(Math.max(1, headcount - 1))}
            style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              border: '1px solid #F0E4D8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            −
          </span>
          <span style={{ fontSize: 14, fontWeight: 500 }}>{headcount}명</span>
          <span
            onClick={() => setHeadcount(headcount + 1)}
            style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: '#FF7A00',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            +
          </span>
        </div>
      </div>

      <div style={{ marginTop: 'auto' }}>
        <Button onClick={handleSearch}>AI 추천 받기</Button>
      </div>

      <BottomNav onLogout={handleLogout} />
    </div>
  );
}

export default Search;