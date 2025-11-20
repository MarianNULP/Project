"use client";

import { useState } from 'react';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch('http://localhost:1337/api/auth/local/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error.message);
      }
      
      // Успішна реєстрація!
      setSuccess(true);

    } catch (err) {
      setError(err.message);
    }
  };

  if (success) {
    return (
      <main>
        <div style={{ padding: '20px', background: 'white', borderRadius: '12px', textAlign: 'center' }}>
          <h1>✅ Реєстрація успішна!</h1>
          <p>Тепер ви можете увійти в акаунт.</p>
          <a href="/login" style={{ color: '#3498db', textDecoration: 'underline' }}>Перейти до Логіну</a>
        </div>
      </main>
    );
  }

return (
    <main>
      <form onSubmit={handleSubmit} className="event-card" style={{ maxWidth: '500px', margin: '40px auto' }}>
        <h1 style={{ textAlign: 'center', marginTop: 0 }}>Створення акаунту</h1>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <label>Ім'я користувача (для входу):</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          
          <label>Пароль:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          
          <button type="submit" style={{ marginTop: '10px' }}>Зареєструватися</button>
          
          {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}

          {/* 👇 ОСЬ ЦЕЙ БЛОК МИ ДОДАЛИ 👇 */}
          <p style={{ textAlign: 'center', marginTop: '15px' }}>
            Вже є акаунт? <a href="/login" style={{ color: '#3498db' }}>Увійти</a>
          </p>
          {/* --------------------------- */}

        </div>
      </form>
    </main>
  );
}