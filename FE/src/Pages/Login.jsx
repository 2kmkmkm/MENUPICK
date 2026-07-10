import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../Components/Button';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = () => {
    // TODO: 백엔드 로그인 API 연동 (지금은 Mock으로 바로 검색화면 이동)
    navigate('/search');
  };

  return (
    <div
      style={{
        background: '#FFF9F4',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '0 16px',
        gap: 14,
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 26 }}>🍜</span>
        <p style={{ fontSize: 19, fontWeight: 500, color: '#2B2320', margin: '6px 0 4px' }}>
          메뉴픽
        </p>
        <p style={{ fontSize: 12, color: '#8A7E76', margin: 0 }}>
          먹고 싶은 메뉴만 고르면<br />AI가 골라드려요
        </p>
      </div>

      <div>
        <p style={{ fontSize: 11, color: '#8A7E76', margin: '0 0 4px' }}>이메일</p>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          style={{
            width: '100%',
            height: 44,
            background: '#FFFFFF',
            border: '1px solid #F0E4D8',
            borderRadius: 12,
            padding: '0 12px',
            fontSize: 13,
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div>
        <p style={{ fontSize: 11, color: '#8A7E76', margin: '0 0 4px' }}>비밀번호</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: '100%',
            height: 44,
            background: '#FFFFFF',
            border: '1px solid #F0E4D8',
            borderRadius: 12,
            padding: '0 12px',
            fontSize: 13,
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div style={{ marginTop: 6 }}>
        <Button onClick={handleLogin}>로그인</Button>
      </div>

      <p style={{ textAlign: 'center', fontSize: 12, color: '#8A7E76', margin: '4px 0 0' }}>
        아직 계정이 없나요?{' '}
        <span
          onClick={() => navigate('/signup')}
          style={{ color: '#FF7A00', cursor: 'pointer' }}
        >
          회원가입
        </span>
      </p>
    </div>
  );
}

export default Login;