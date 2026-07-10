import { useEffect, useRef } from 'react';

function Map() {
  const mapRef = useRef(null);

  useEffect(() => {
    window.kakao.maps.load(() => {
      const container = mapRef.current;
      const options = {
        center: new window.kakao.maps.LatLng(37.5665, 126.9780), // 서울시청 좌표
        level: 3,
      };
      new window.kakao.maps.Map(container, options);
    });
  }, []);

  return <div ref={mapRef} style={{ width: '100%', height: '400px' }} />;
}

export default Map;