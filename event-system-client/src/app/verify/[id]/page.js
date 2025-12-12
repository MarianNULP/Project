"use client";

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import { API_URL } from '@/utils/api';

export default function VerifyTicketPage({ params }) {
  const { id } = use(params);
  
  const [status, setStatus] = useState('loading'); // loading | valid | invalid | pending | error | unauthorized
  const [ticketData, setTicketData] = useState(null);

  useEffect(() => {
    const checkTicket = async () => {
      // 👇 1. ПЕРЕВІРКА АВТОРИЗАЦІЇ
      const jwt = localStorage.getItem('jwt');
      if (!jwt) {
        setStatus('unauthorized'); // Якщо не залогінений - стоп
        return;
      }

      try {
        // 👇 2. ЗАПИТ З ТОКЕНОМ (Тепер це безпечно)
        const res = await fetch(`${API_URL}/api/registrations/${id}?populate=event&populate=user`, {
            headers: {
                'Authorization': `Bearer ${jwt}` // Додаємо токен сканувальника
            }
        });
        
        if (!res.ok) {
          // Якщо 403 або 401 - токен протух або немає прав
          if (res.status === 401 || res.status === 403) {
             setStatus('unauthorized');
             return;
          }
          setStatus('invalid');
          return;
        }

        const json = await res.json();
        const reg = json.data;

        if (reg.approval_status === 'approved') {
          setTicketData(reg);
          setStatus('valid');
        } else {
          setTicketData(reg);
          setStatus('pending');
        }

      } catch (err) {
        console.error(err);
        setStatus('error');
      }
    };

    if (id) checkTicket();
  }, [id]);

  const getContainerClass = () => {
    switch(status) {
      case 'valid': return `${styles.container} ${styles.bgValid}`;
      case 'invalid': return `${styles.container} ${styles.bgInvalid}`;
      case 'pending': return `${styles.container} ${styles.bgPending}`;
      default: return styles.container; // Для loading та unauthorized
    }
  };

  return (
    <main className={getContainerClass()}>
      
      {status === 'loading' && (
        <div className={styles.card}>
          <div className={`${styles.icon} ${styles.loadingIcon}`}>⏳</div>
          <h2 style={{color: '#64748b'}}>Перевірка квитка...</h2>
        </div>
      )}

      {/* 🔒 БЛОК: ВИМАГАЄ ВХОДУ */}
      {status === 'unauthorized' && (
        <div className={styles.card}>
          <div className={styles.icon} style={{animation: 'none', fontSize: '4rem'}}>👮‍♂️</div>
          <h1 className={styles.title} style={{color: '#2c3e50'}}>Доступ заборонено</h1>
          <p className={styles.subtitle}>
            Щоб перевіряти квитки, ви повинні увійти в систему як Організатор або Адмін.
          </p>
          <Link href="/login" style={{
              display: 'inline-block', 
              background: '#3498db', 
              color: 'white', 
              padding: '12px 25px', 
              borderRadius: '10px', 
              textDecoration: 'none', 
              fontWeight: 'bold'
          }}>
            Увійти в акаунт
          </Link>
        </div>
      )}

{/* ✅ ВАЛІДНИЙ КВИТОК */}
      {status === 'valid' && ticketData && (
        <div className={`${styles.card} ${styles.cardValid}`}>
          
          <div className={styles.icon} style={{animation: 'none'}}>✅</div>
          <h1 className={`${styles.title} ${styles.textValid}`}>КВИТОК ДІЙСНИЙ</h1>
          
          <hr style={{margin: '20px 0', border: 'none', borderTop: '1px dashed #bbf7d0'}} />

          {/* 👇 РОБИМО АКЦЕНТ НА ПОДІЮ 👇 */}
          <div style={{marginBottom: '20px'}}>
             <span style={{fontSize: '0.8rem', textTransform: 'uppercase', color: '#666', fontWeight: 'bold'}}>Подія:</span>
             <h2 style={{
                 margin: '5px 0', 
                 fontSize: '1.8rem', // Дуже великий шрифт
                 color: '#1e293b', 
                 lineHeight: '1.2',
                 border: '2px solid #22c55e', // Рамка, щоб виділити назву
                 padding: '10px',
                 borderRadius: '10px',
                 background: 'rgba(255,255,255,0.5)'
             }}>
                {ticketData.event?.title}
             </h2>
          </div>

          <div className={styles.infoBox}>
            <span className={styles.label}>Гість</span>
            <span className={styles.value} style={{fontSize: '1.5rem'}}>{ticketData.user?.username}</span>
            
            <span className={styles.label}>Тип квитка</span>
            <span className={styles.value}>Стандарт</span>
          </div>

          <Link href="/" className={styles.homeLink}>← На головну</Link>
        </div>
      )}

      {/* ❌ НЕВАЛІДНИЙ */}
      {(status === 'invalid' || status === 'error') && (
        <div className={`${styles.card} ${styles.cardInvalid}`}>
          <div className={styles.icon} style={{animation: 'none'}}>🚫</div>
          <h1 className={`${styles.title} ${styles.textInvalid}`}>Не знайдено</h1>
          <p className={styles.subtitle} style={{color: '#ef4444'}}>Квиток підроблений або помилка.</p>
          <Link href="/" className={styles.homeLink}>← На головну</Link>
        </div>
      )}

       {/* ⚠️ ОЧІКУЄ */}
       {status === 'pending' && (
        <div className={`${styles.card} ${styles.cardPending}`}>
          <div className={styles.icon} style={{animation: 'none'}}>✋</div>
          <h1 className={`${styles.title} ${styles.textPending}`}>Не оплачено</h1>
          <div className={styles.infoBox}>
            <span className={styles.label}>Гість</span>
            <span className={styles.value}>{ticketData?.user?.username}</span>
          </div>
          <Link href="/" className={styles.homeLink}>← На головну</Link>
        </div>
      )}

    </main>
  );
}