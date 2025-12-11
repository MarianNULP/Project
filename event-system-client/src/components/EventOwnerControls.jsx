"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EventForm } from '@/components/EventForm'; // Імпортуємо сюди твою форму

export default function EventOwnerControls({ eventId, organizerId, eventName, price }) {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleDelete = async () => {
    if (!confirm('Ви впевнені, що хочете видалити цю подію?')) return;
    
    const jwt = localStorage.getItem('jwt');
    try {
      const res = await fetch(`http://192.168.50.254:1337/api/events/${eventId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${jwt}` }
      });

      if (res.ok) {
        router.push('/profile'); // Після видалення перекидаємо в профіль
      } else {
        alert('Помилка видалення');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 1. Якщо юзер не залогінений -> Просто форма реєстрації
  if (!user) {
    return <EventForm eventName={eventName} eventId={eventId} price={price} />;
  }

  // 2. Якщо це ВЛАСНИК події -> Кнопки керування (Форму реєстрації ховаємо, бо власник не купує свій квиток)
  if (user.id === organizerId) {
    return (
      <div style={{ padding: '20px', background: '#e8f8f5', border: '1px solid #1abc9c', borderRadius: '12px' }}>
        <h3 style={{ marginTop: 0, color: '#16a085' }}>👑 Ви організатор цієї події</h3>
        <p>Ви можете керувати нею:</p>
        <div style={{ display: 'flex', gap: '15px' }}>
          <Link 
            href={`/events/${eventId}/edit`} 
            style={{ 
              background: '#f39c12', color: 'white', padding: '10px 20px', 
              borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold' 
            }}
          >
            ✏️ Редагувати
          </Link>
          <button 
            onClick={handleDelete}
            style={{ 
              background: '#c0392b', color: 'white', padding: '10px 20px', 
              borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold' 
            }}
          >
            🗑 Видалити
          </button>
        </div>
      </div>
    );
  }

  // 3. Якщо це звичайний юзер -> Форма реєстрації
  return <EventForm eventName={eventName} eventId={eventId} price={price} />;
}