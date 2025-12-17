"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './EventForm.module.css'; // Імпорт стилів
import { API_URL } from '@/utils/api';


export function EventForm({ eventName, eventId, price }) {
  const [user, setUser] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleRegisterOrBuy = async () => {
    if (!user) {
      // Можна просто перенаправити, а можна показати alert
      if (confirm('Для реєстрації потрібно увійти. Перейти на сторінку входу?')) {
        router.push('/login');
      }
      return;
    }

    const jwt = localStorage.getItem('jwt');
    
    // Імітація оплати
    if (price > 0) {
      const confirmBuy = confirm(`Вартість квитка: ${price} UAH.\n\nСимулювати оплату карткою? 💳`);
      if (!confirmBuy) return;
      
      setIsProcessing(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
    } else {
        setIsProcessing(true); // Для безкоштовних теж покажемо спіннер на секунду
    }

    try {
      const payload = {
        data: {
          event: eventId,
          user: user.id,
          publishedAt: new Date(),
          approval_status: 'approved' 
        }
      };

      const res = await fetch(`${API_URL}/api/registrations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message || 'Помилка реєстрації');
      }

      setIsProcessing(false);
      setIsSuccess(true);
      
      setTimeout(() => {
        router.push('/profile');
      }, 2500);

    } catch (err) {
      setIsProcessing(false);
      alert(err.message);
    }
  };

  // 1. Стан УСПІХУ
  if (isSuccess) {
    return (
      <div className={styles.successCard}>
        <span className={styles.successIcon}>🎉</span>
        <h2 className={styles.successTitle}>Вітаємо!</h2>
        <p className={styles.successText}>
            {price > 0 ? 'Квиток успішно оплачено.' : 'Ви зареєстровані!'}
        </p>
        <div className={styles.redirectText}>
           Перенаправлення у квитки... ⏳
        </div>
      </div>
    );
  }

  // 2. Основна КАРТКА
  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Реєстрація на подію</h3>
      
      <div className={styles.userInfo}>
        Ви реєструєтесь як:<br/>
        {user ? (
            <span className={styles.userHighlight}>{user.username} ({user.email})</span>
        ) : (
            <span style={{color: '#999'}}>Гість (необхідний вхід)</span>
        )}
      </div>

      <button 
        onClick={handleRegisterOrBuy} 
        disabled={isProcessing}
        className={`
            ${styles.buyButton} 
            ${isProcessing ? styles.processing : (price > 0 ? styles.paid : styles.free)}
        `}
      >
        {isProcessing 
          ? '⏳ Обробка...' 
          : (price > 0 ? `💳 Купити квиток • ${price} ₴` : '✅ Взяти участь безкоштовно')
        }
      </button>

      {!user && (
        <div className={styles.loginWarning}>
          🔒 Увійдіть в акаунт, щоб продовжити
        </div>
      )}
    </div>
  );
}