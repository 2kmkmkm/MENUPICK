import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const STEPS = [
  { label: '주변 후보 식당 정리', done: true },
  { label: '최근 후기 읽는 중', done: true },
  { label: '근거 모으는 중', active: true },
  { label: '상위 3곳 고르는 중', done: false },
];

function Loading() {
  const navigate = useNavigate();

  useEffect(() => {
    // TODO: 백엔드 /api/v1/recommendations 응답 오면 결과 화면으로 이동
    const timer = setTimeout(() => {
      navigate('/result');
    }, 1800);
    return () => clearTimeout(timer);
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
        {STEPS.map((step, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ color: step.done || step.active ? '#FF7A00' : '#8A7E76', fontSize: 14 }}>
              {step.done ? '✓' : step.active ? '●' : '○'}
            </span>
            <span
              style={{
                fontSize: 12,
                color: step.active ? '#2B2320' : '#8A7E76',
                fontWeight: step.active ? 500 : 400,
              }}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Loading;