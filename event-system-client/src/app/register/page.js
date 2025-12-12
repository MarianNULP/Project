"use client";

import { useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css'; // Імпортуємо стилі
import { API_URL } from '@/utils/api';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false); // Додали стан завантаження

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/local/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error.message);
      }
      
      setSuccess(true);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.successBox}>
            <span className={styles.successIcon}>🎉</span>
            <h1 className={styles.successTitle}>Акаунт створено!</h1>
            <p className={styles.subtitle}>
              Ви успішно зареєструвалися. Тепер увійдіть, щоб продовжити.
            </p>
            <Link href="/login" className={styles.loginBtn}>
              Увійти в акаунт →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div>
        <Link href="/" className={styles.backHome}>← На головну</Link>
        
        <div className={styles.card}>
          <div className={styles.header}>
            <h1 className={styles.title}>Створення акаунту</h1>
            <p className={styles.subtitle}>Приєднуйтесь до нас, щоб відвідувати найкращі події</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            
            <div className={styles.inputGroup}>
              <label className={styles.label}>Ім'я користувача</label>
              <input
                className={styles.input}
                type="text"
                placeholder="AlexUser"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            
            <div className={styles.inputGroup}>
              <label className={styles.label}>Email адреса</label>
              <input
                className={styles.input}
                type="email"
                placeholder="alex@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                minLength={6}
              />
            </div>
            
            {error && <div className={styles.error}>⚠️ {error}</div>}
            
            <button 
              type="submit" 
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? 'Створюємо...' : 'Зареєструватися'}
            </button>
            
          </form>

          <p className={styles.footer}>
            Вже є акаунт? 
            <Link href="/login" className={styles.link}>
              Увійти тут
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}