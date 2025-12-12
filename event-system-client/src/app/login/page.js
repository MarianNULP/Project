"use client";

import { useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import { API_URL } from '@/utils/api';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/local`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }), 
      });

      const data = await res.json();

      if (data.error) {
        throw new Error("Невірний логін або пароль"); // Спрощуємо повідомлення для користувача
      }

      // Зберігаємо дані
      localStorage.setItem('jwt', data.jwt);
      localStorage.setItem('user', JSON.stringify(data.user));

      // ⚠️ Використовуємо window.location для повного перезавантаження,
      // щоб Header гарантовано побачив, що користувач увійшов
      window.location.href = '/'; 

    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div>
        <Link href="/" className={styles.backHome}>← На головну</Link>
        
        <div className={styles.card}>
          <div className={styles.header}>
            <h1 className={styles.title}>З поверненням! 👋</h1>
            <p className={styles.subtitle}>Введіть свої дані, щоб увійти в акаунт</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            
            <div className={styles.inputGroup}>
              <label className={styles.label}>Email або Логін</label>
              <input
                className={styles.input}
                type="text"
                placeholder="user@example.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>
            
            <div className={styles.inputGroup}>
              <label className={styles.label}>Пароль</label>
              <input
                className={styles.input}
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && <div className={styles.error}>⚠️ {error}</div>}
            
            <button 
              type="submit" 
              className={styles.submitBtn} 
              disabled={loading}
            >
              {loading ? 'Перевіряємо...' : 'Увійти в акаунт'}
            </button>
            
          </form>

          <p className={styles.footer}>
            Немає акаунту? 
            <Link href="/register" className={styles.link}>
              Зареєструватися
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}