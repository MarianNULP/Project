"use client";

import { useState, useEffect, use } from 'react'; // Додали use для params

export default function VerifyTicketPage({ params }) {
  // Розпаковуємо params через use() (для нових версій Next.js)
  const { id } = use(params);
  
  const [status, setStatus] = useState('loading'); // loading | valid | invalid | error
  const [ticketData, setTicketData] = useState(null);

  useEffect(() => {
    const checkTicket = async () => {
      try {
        // Запит до Strapi: шукаємо реєстрацію за documentId (або id)
        // Важливо: ми populate подію та юзера, щоб показати імена
        const res = await fetch(`http://192.168.50.254:1337/api/registrations/${id}?populate=event&populate=user`);
        
        if (!res.ok) {
          setStatus('invalid');
          return;
        }

        const json = await res.json();
        const reg = json.data;

        // Додаткова перевірка: чи статус approved?
        if (reg.approval_status === 'approved') {
          setTicketData(reg);
          setStatus('valid');
        } else {
          setStatus('pending'); // Якщо квиток є, але не оплачений/не підтверджений
        }

      } catch (err) {
        console.error(err);
        setStatus('error');
      }
    };

    if (id) checkTicket();
  }, [id]);

  return (
    <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px', textAlign: 'center', background: '#f4f6f7' }}>
      
      {status === 'loading' && <h2>⏳ Перевірка квитка...</h2>}

      {status === 'valid' && ticketData && (
        <div style={{ background: 'white', padding: '40px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(46, 204, 113, 0.3)', border: '2px solid #2ecc71' }}>
          <div style={{ fontSize: '80px', marginBottom: '20px' }}>✅</div>
          <h1 style={{ color: '#27ae60', margin: 0 }}>КВИТОК ДІЙСНИЙ</h1>
          <p style={{ color: '#7f8c8d', fontSize: '1.2rem' }}>ID: {ticketData.documentId}</p>
          
          <hr style={{ margin: '20px 0', border: '0', borderTop: '1px solid #eee' }} />
          
          <div style={{ textAlign: 'left' }}>
            <p>👤 <strong>Гість:</strong> {ticketData.user?.username}</p>
            <p>📅 <strong>Подія:</strong> {ticketData.event?.title}</p>
          </div>
        </div>
      )}

      {status === 'invalid' && (
        <div style={{ background: 'white', padding: '40px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(231, 76, 60, 0.3)', border: '2px solid #e74c3c' }}>
          <div style={{ fontSize: '80px', marginBottom: '20px' }}>❌</div>
          <h1 style={{ color: '#c0392b', margin: 0 }}>НЕ ЗНАЙДЕНО</h1>
          <p>Цей квиток не існує в базі даних.</p>
        </div>
      )}

      {status === 'pending' && (
        <div style={{ background: 'white', padding: '40px', borderRadius: '20px', border: '2px solid #f39c12' }}>
          <div style={{ fontSize: '80px', marginBottom: '20px' }}>⚠️</div>
          <h1 style={{ color: '#f39c12', margin: 0 }}>ОЧІКУЄ ПІДТВЕРДЖЕННЯ</h1>
          <p>Реєстрація є, але статус не "Approved".</p>
        </div>
      )}

    </main>
  );
}