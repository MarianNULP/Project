"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Додамо переадресацію після покупки

export function EventForm({ eventName, eventId, price }) {
  const [user, setUser] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false); // Стан "Оплата в процесі"
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
      alert('Увійдіть, щоб продовжити');
      router.push('/login');
      return;
    }

    const jwt = localStorage.getItem('jwt');
    
    // Імітація процесу оплати (якщо ціна > 0)
    if (price > 0) {
      const confirmBuy = confirm(`Вартість квитка: ${price} UAH.\n\nСимулювати оплату карткою? 💳`);
      if (!confirmBuy) return;
      
      setIsProcessing(true);
      // Чекаємо 1.5 секунди для краси (ніби банк обробляє)
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    try {
      // Формуємо дані
      const payload = {
        data: {
          event: eventId,
          user: user.id,
          publishedAt: new Date(), // Одразу публікуємо
          // 👇 ГОЛОВНИЙ ФОКУС:
          // Якщо платно — ставимо approved (бо гроші "зайшли").
          // Якщо безкоштовно — теж approved (бо вільний вхід).
          // Якщо хочеш ручну модерацію безкоштовних, зміни на 'pending'.
          approval_status: 'approved' 
        }
      };

      const res = await fetch('http://192.168.50.254:1337/api/registrations', {
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
      
      // Через 2 секунди після успіху перекидаємо в профіль
      setTimeout(() => {
        router.push('/profile');
      }, 2000);

    } catch (err) {
      setIsProcessing(false);
      alert(err.message);
    }
  };

  // 1. Якщо вже успішно купили
  if (isSuccess) {
    return (
      <div style={{ padding: '30px', background: '#e8f8f5', border: '1px solid #2ecc71', borderRadius: '12px', textAlign: 'center' }}>
        <h2 style={{ color: '#27ae60', margin: 0 }}>🎉 Вітаємо!</h2>
        <p style={{ fontSize: '1.2rem' }}>
            {price > 0 ? 'Оплата успішна. Квиток придбано.' : 'Ви успішно зареєстровані.'}
        </p>
        <p style={{ color: '#7f8c8d' }}>Зараз вас перенаправить у квитки...</p>
      </div>
    );
  }

  // 2. Основна картка покупки
  return (
    <div style={{ 
      background: 'white', 
      border: '2px dashed #3498db', 
      padding: '30px', 
      borderRadius: '12px', 
      textAlign: 'center',
      marginTop: '20px'
    }}>
      <h3 style={{ marginTop: 0 }}>Реєстрація на подію</h3>
      <p style={{ marginBottom: '20px', fontSize: '1.1rem' }}>
        Ви реєструєтесь як: <strong>{user ? user.username : 'Гість'}</strong>
        {user && <span style={{ display: 'block', fontSize: '0.9rem', color: '#7f8c8d' }}>({user.email})</span>}
      </p>

      {/* КНОПКА ПОКУПКИ */}
      <button 
        onClick={handleRegisterOrBuy} 
        disabled={isProcessing}
        style={{ 
          background: isProcessing ? '#95a5a6' : (price > 0 ? '#27ae60' : '#3498db'), 
          color: 'white', 
          border: 'none', 
          padding: '15px 40px', 
          borderRadius: '8px', 
          fontSize: '1.2rem', 
          fontWeight: 'bold', 
          cursor: isProcessing ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
        }}
      >
        {isProcessing 
          ? '⏳ Обробка платежу...' 
          : (price > 0 ? `💳 Купити квиток за ${price} UAH` : '✅ Зареєструватись безкоштовно')
        }
      </button>

      {!user && (
        <p style={{ marginTop: '15px', color: '#e74c3c' }}>
          * Увійдіть в акаунт, щоб придбати квиток.
        </p>
      )}
    </div>
  );
}