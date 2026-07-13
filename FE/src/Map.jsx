import { useEffect, useRef, useState } from 'react';

const KAKAO_KEY = import.meta.env.VITE_KAKAO_MAP_KEY;

function loadKakaoScript() {
  return new Promise((resolve, reject) => {
    if (window.kakao && window.kakao.maps) {
      resolve();
      return;
    }
    const existing = document.querySelector('script[data-kakao-sdk]');
    if (existing) {
      existing.addEventListener('load', () => window.kakao.maps.load(resolve));
      return;
    }
    const script = document.createElement('script');
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_KEY}&autoload=false`;
    script.dataset.kakaoSdk = 'true';
    script.onload = () => window.kakao.maps.load(resolve);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function Map({ lat = 37.5651, lng = 127.0165, height = 90 }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerInstance = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadKakaoScript().then(() => {
      if (!mapRef.current) return;
      const options = {
        center: new window.kakao.maps.LatLng(lat, lng),
        level: 4,
      };
      mapInstance.current = new window.kakao.maps.Map(mapRef.current, options);
      markerInstance.current = new window.kakao.maps.Marker({
        position: new window.kakao.maps.LatLng(lat, lng),
        map: mapInstance.current,
      });
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (ready && mapInstance.current && markerInstance.current) {
      const pos = new window.kakao.maps.LatLng(lat, lng);
      mapInstance.current.setCenter(pos);
      markerInstance.current.setPosition(pos);
    }
  }, [lat, lng, ready]);

  return (
    <div
      ref={mapRef}
      style={{
        width: '100%',
        height,
        borderRadius: 14,
        border: '1px solid #F0E4D8',
        overflow: 'hidden',
        background: '#F0E4D8',
      }}
    />
  );
}

export default Map;