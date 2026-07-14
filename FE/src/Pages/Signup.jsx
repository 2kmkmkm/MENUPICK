import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../Components/Button';
import api from '../api';

function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordCheck, setPasswordCheck] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignup = async () => {
    if (password !== passwordCheck) {
      setError('비밀번호가 일치하지 않습니다');
      return;
    }
    try {
      setError('');
      await api.post('/api/v1/auth/signup', { name, email, password });
      navigate('/login');
    } catch (err) {
      setError('회원가입에 실패했어요. 입력 내용을 확인해주세요');
    }
  };

  const inputStyle = {
    width: '100%',
    height: 42,
    background: '#FFFFFF',
    border: '1px solid #F0E4D8',
    borderRadius: 12,
    padding: '0 12px',
    fontSize: 13,
    boxSizing: 'border-box',
  };

  const labelStyle = { fontSize: 11, color: '#8A7E76', margin: '0 0 4px' };

  return (
    <div
      style={{
        background: '#FFF9F4',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '0 16px',
        gap: 12,
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 24 }}>🍜</span>
        <p style={{ fontSize: 17, fontWeight: 500, color: '#2B2320', margin: '6px 0 0' }}>
          회원가입
        </p>
      </div>

      <div>
        <p style={labelStyle}>이름</p>
        <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
      </div>

      <div>
        <p style={labelStyle}>이메일</p>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          style={inputStyle}
        />
      </div>

      <div>
        <p style={labelStyle}>비밀번호</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
        />
      </div>

      <div>
        <p style={labelStyle}>비밀번호 확인</p>
        <input
          type="password"
          value={passwordCheck}
          onChange={(e) => setPasswordCheck(e.target.value)}
          style={inputStyle}
        />
      </div>

      {error && (
        <p style={{ fontSize: 12, color: '#C0392B', margin: 0 }}>{error}</p>
      )}

      <div style={{ marginTop: 6 }}>
        <Button onClick={handleSignup}>가입하기</Button>
      </div>

      <p style={{ textAlign: 'center', fontSize: 12, color: '#8A7E76', margin: '4px 0 0' }}>
        이미 계정이 있나요?{' '}
        <span
          onClick={() => navigate('/login')}
          style={{ color: '#FF7A00', cursor: 'pointer' }}
        >
          로그인
        </span>
      </p>
    </div>
  );
}

export default Signup;