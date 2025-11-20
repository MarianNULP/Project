"use client";

import { useState, useEffect } from 'react';

export function EventForm({ eventId, eventName }) { // Приймаємо eventId
  const [status, setStatus] = useState('idle');
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  // 🔥 НАША НОВА ФУНКЦІЯ ПЕРЕВІРКИ
  const checkExistingRegistration = async (userId, currentEventName) => {
    try {
      const jwt = localStorage.getItem('jwt');
      // Робимо запит, щоб отримати ВСІ реєстрації поточного юзера
      // Ми фільтруємо за ID користувача
      const res = await fetch(`http://localhost:1337/api/registrations?filters[user][id][$eq]=${userId}`, {
        headers: { 'Authorization': `Bearer ${jwt}` }
      });

      if (!res.ok) throw new Error('Не вдалося перевірити реєстрації');

      const data = await res.json();
      const registrations = data.data;

      // Перебираємо відповідь і шукаємо, чи є там наша подія
      const isAlreadyRegistered = registrations.some(
        (reg) => reg.event_name === currentEventName
      );

      if (isAlreadyRegistered) {
        setStatus('success'); // Ставимо статус "success", щоб показати "Ви вже зареєстровані"
      } else {
        setStatus('ready'); // Все чисто, показуємо кнопку
      }

    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  };

  useEffect(() => {
    // Дістаємо дані користувача з localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);

      // Запускаємо перевірку на дублікати
      checkExistingRegistration(parsedUser.id, eventName);
    } else {
      // Якщо юзер не залогінений, просто показуємо йому "Увійдіть"
      setStatus('guest');
    }
  }, [eventName]); // Залежимо від eventName

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('processing'); // Змінили 'loading' на 'processing'
    setError(null);

    const jwt = localStorage.getItem('jwt');
    if (!jwt || !user) return;

    const payload = {
      data: {
        event_name: eventName,
        participant_name: user.username,
        participant_email: user.email,
        approval_status: 'pending',
        user: user.id,
      }
    };

    try {
      const res = await fetch('http://localhost:1337/api/registrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error.message);

      setStatus('success'); // Успіх!
    } catch (err) {
      setStatus('error');
      setError(err.message);
    }
  }

  // 2. Якщо йде перевірка...
  if (status === 'loading') {
    return (
      <div style={{ border: '1px dashed grey', padding: '20px', marginTop: '30px' }}>
        <p>⏳ Перевіряємо ваш статус реєстрації...</p>
      </div>
    );
  }

  // 3. Якщо вже зареєстрований (або щойно зареєструвався)
  if (status === 'success') {
    return <p style={{ color: 'green', fontWeight: 'bold' }}>✅ Ви успішно зареєстровані на цю подію!</p>;
  }

  // 4. Якщо сталася помилка
  if (status === 'error') {
    return <p style={{ color: 'red' }}>Помилка: {error}</p>;
  }

  // 5. Якщо все добре і можна реєструватися
  if (status === 'ready' || status === 'processing') {
    return (
      <div style={{ border: '1px dashed blue', padding: '20px', marginTop: '30px' }}>
        <h3>Реєстрація на подію</h3>
        <p>Ви реєструєтесь як: **{user.username}** ({user.email})</p>

        <form onSubmit={handleSubmit}>
          <button type="submit" disabled={status === 'processing'} style={{ padding: '10px', background: 'blue', color: 'white' }}>
            {status === 'processing' ? 'Обробка...' : 'Підтвердити реєстрацію'}
          </button>
        </form>
      </div>
    );
  }

  // Заглушка на всяк випадок
  return null;
}