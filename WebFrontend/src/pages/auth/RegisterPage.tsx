// src/pages/RegisterPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  // 폼 입력을 위한 state
  const [id, setId] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 에러 메시지를 위한 state
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // 1. 클라이언트 측 비밀번호 확인
    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    try {
      // 2. NestJS 백엔드로 회원가입 요청
      const response = await fetch('http://localhost:3000/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // User Entity와 CreateUserDto에 맞춰 데이터를 전송합니다.
        body: JSON.stringify({ id, username, email, password }),
      });

      // 3. 응답 처리
      if (!response.ok) {
        // 아이디 중복 등 서버에서 보낸 에러 메시지를 표시합니다.
        const errorData = await response.json();
        throw new Error(errorData.message || '회원가입에 실패했습니다.');
      }

      // 4. 회원가입 성공
      alert('회원가입에 성공했습니다! 로그인 페이지로 이동합니다.');
      navigate('/login'); // 회원가입 성공 후 로그인 페이지로 이동

    } catch (err) {
      if (err instanceof Error) {
        console.error('Registration error:', err);
        setError(err.message);
      } else {
        setError('알 수 없는 에러가 발생했습니다.');
      }
    }
  };

  return (
    <div style={{ width: '300px', margin: '100px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h1>회원가입</h1>
      <form onSubmit={handleSubmit}>
        {/* 아이디 입력 */}
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="id" style={{ display: 'block', marginBottom: '5px' }}>아이디</label>
          <input
            type="text" id="id" value={id}
            onChange={(e) => setId(e.target.value)} required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>

        {/* 닉네임 입력 */}
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="username" style={{ display: 'block', marginBottom: '5px' }}>닉네임</label>
          <input
            type="text" id="username" value={username}
            onChange={(e) => setUsername(e.target.value)} required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>

        {/* 이메일 입력 */}
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="email" style={{ display: 'block', marginBottom: '5px' }}>이메일</label>
          <input
            type="email" id="email" value={email}
            onChange={(e) => setEmail(e.target.value)} required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>

        {/* 비밀번호 입력 */}
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="password" style={{ display: 'block', marginBottom: '5px' }}>비밀번호</label>
          <input
            type="password" id="password" value={password}
            onChange={(e) => setPassword(e.target.value)} required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>

        {/* 비밀번호 확인 입력 */}
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="confirmPassword" style={{ display: 'block', marginBottom: '5px' }}>비밀번호 확인</label>
          <input
            type="password" id="confirmPassword" value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)} required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>

        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          가입하기
        </button>
      </form>
      <div style={{ marginTop: '15px', textAlign: 'center' }}>
        <button 
          onClick={() => navigate('/login')} 
          style={{ backgroundColor: 'transparent', border: 'none', color: '#007bff', cursor: 'pointer', padding: 0 }}
        >
          로그인 페이지로 돌아가기
        </button>
      </div>
    </div>
  );
};

export default RegisterPage;
