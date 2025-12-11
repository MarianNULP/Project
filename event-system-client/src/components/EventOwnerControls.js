"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EventForm } from '@/components/EventForm'; 
import styles from './EventOwnerControls.module.css'; // Імпорт стилів

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
    if (!confirm('⚠️ Ви впевнені, що хочете видалити цю подію назавжди?')) return;
    
    const jwt = localStorage.getItem('jwt');
    try {
      const res = await fetch(`${API_URL}/api/events/${eventId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${jwt}` }
      });

      if (res.ok) {
        router.push('/profile'); 
      } else {
        alert('Помилка видалення');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 1. Якщо юзер не залогінений -> Показуємо форму (вона сама попросить увійти)
  if (!user) {
    return <EventForm eventName={eventName} eventId={eventId} price={price} />;
  }

  // 2. Якщо це ВЛАСНИК події -> Показуємо панель керування
  if (user.id === organizerId) {
    return (
      <div className={styles.ownerCard}>
        <h3 className={styles.title}>👑 Ви організатор</h3>
        <p className={styles.description}>
            Це ваша подія. Ви не можете купити квиток, але можете керувати нею.
        </p>
        
        <div className={styles.actions}>
          <Link href={`/events/${eventId}/edit`} className={`${styles.btn} ${styles.editBtn}`}>
            ✏️ Редагувати
          </Link>
          
          <button onClick={handleDelete} className={`${styles.btn} ${styles.deleteBtn}`}>
            🗑 Видалити
          </button>
        </div>
      </div>
    );
  }

  // 3. Якщо це звичайний юзер -> Форма купівлі
  return <EventForm eventName={eventName} eventId={eventId} price={price} />;
}