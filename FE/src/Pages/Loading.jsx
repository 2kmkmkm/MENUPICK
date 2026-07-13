import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const STEPS = [
  '주변 후보 식당 정리',
  '최근 후기 읽는 중',
  '근거 모으는 중',
  '상위 3곳 고르는 중',
];

function Loading() {
  const [stepIndex, setStepIndex] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = location.state || {};

  useEffect(() => {
    // TODO: 여기서 실제 axios.post('/api/v1/recommendations', searchParams) 호출
    // 응답 오면 결과 데이터를 state로 실어서 /result로 navigate

    const stepTimer = setInterval(() => {
      setStepIndex((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 700);

    const doneTimer = setTimeout(() => {
      navigate('/result', { state: searchParams });
    }, STEPS.length * 700 + 400);

    return () => {
      clearInterval(stepTimer);
      clearTimeout(doneTimer);
    };
  }, [navigate]);

  return (
    <div
      style={{
        background: '#FFF9F4',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 18,
        padding: '0 16px',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          border: '3px solid #FFF0E0',
          borderTopColor: '#FF7A00',
          animation: 'spin 1s linear infinite',
        }}
      />
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      <span
        style={{
          fontSize: 13,
          background: '#FFF0E0',
          color: '#B35400',
          padding: '4px 10px',
          borderRadius: 999,
        }}
      >
        AI가 후기를 읽는 중
      </span>

      <div style={{ width: '100%', maxWidth: 280, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {STEPS.map((label, i) => {
          const done = i < stepIndex;
          const active = i === stepIndex;
          return (
            <div key={label} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ color: done || active ? '#FF7A00' : '#8A7E76', fontSize: 14 }}>
                {done ? '✓' : active ? '●' : '○'}
              </span>
              <span
                style={{
                  fontSize: 12,
                  color: active ? '#2B2320' : '#8A7E76',
                  fontWeight: active ? 500 : 400,
                }}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Loading;