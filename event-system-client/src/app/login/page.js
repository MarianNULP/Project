"use client";

import { useState } from 'react';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState(''); // Це може бути username або email
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const res = await fetch('http://192.168.50.254:1337/api/auth/local', { // Ендпоінт для логіну
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }), // Надсилаємо логін/пароль
      });

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error.message); // Помилка, якщо невірний логін/пароль
      }

      // 🔥 УСПІХ! Ми отримали токен
      console.log('Отримано токен:', data.jwt);
      console.log('Дані користувача:', data.user);

      // Зберігаємо токен і дані користувача в localStorage
      // Це дозволить нам "пам'ятати" користувача
      localStorage.setItem('jwt', data.jwt);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Перенаправляємо користувача на головну сторінку
      window.location.href = '/'; 

    } catch (err) {
      setError("Невірне ім'я користувача або пароль");
    }
  };

  return (
    <main>
      <form onSubmit={handleSubmit} className="event-card" style={{ maxWidth: '500px', margin: '40px auto' }}>
        <h1 style={{ textAlign: 'center', marginTop: 0 }}>Вхід в акаунт</h1>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <label>Ім'я користувача або Email:</label>
          <input
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
          />
          
          <label>Пароль:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          
          <button type="submit" style={{ marginTop: '10px' }}>Увійти</button>
          
          {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
          
          <p style={{ textAlign: 'center', marginTop: '15px' }}>
            Немає акаунту? <a href="/register" style={{ color: '#3498db' }}>Зареєструватися</a>
          </p>
        </div>
      </form>
    </main>
  );
}