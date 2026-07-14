import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../Components/Button';
import api from '../api';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      setError('');
      const res = await api.post('/api/v1/auth/login', { email, password });
      const token = res.data?.data?.accessToken;
      if (token) {
        localStorage.setItem('accessToken', token);
      }
      navigate('/search');
    } catch (err) {
      setError('로그인에 실패했어요. 이메일/비밀번호를 확인해주세요');
    }
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