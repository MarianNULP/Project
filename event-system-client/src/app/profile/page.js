"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; // Імпорт Link для кнопок

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [myEvents, setMyEvents] = useState([]); // 👈 Новий стан для моїх подій
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  // 👇 НОВІ СТАНИ
  const [myCity, setMyCity] = useState(''); // Стан для поля вводу
  const [saveStatus, setSaveStatus] = useState('idle'); // idle | saving | success

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const jwt = localStorage.getItem('jwt');

    if (!userData || !jwt) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    setMyCity(parsedUser.city || '');

    const fetchData = async () => {
      try {
        // 1. Завантажуємо реєстрації (як було раніше)
        const regRes = await fetch(`http://localhost:1337/api/registrations?filters[user][id][$eq]=${parsedUser.id}`, {
          headers: { 'Authorization': `Bearer ${jwt}` }
        });
        const regData = await regRes.json();
        setRegistrations(regData.data || []);

        // 2. 👇 ЗАВАНТАЖУЄМО ПОДІЇ, СТВОРЕНІ КОРИСТУВАЧЕМ
        // Фільтр: organizer.id == мій id

        console.log(`🔍 Шукаю події для User ID: ${parsedUser.id}`);
        const eventsRes = await fetch(`http://localhost:1337/api/events?filters[organizer][id][$eq]=${parsedUser.id}&populate[cover]=*&populate[registrations]=*`, {
            headers: { 'Authorization': `Bearer ${jwt}` }
        });
        const eventsData = await eventsRes.json();
        setMyEvents(eventsData.data || []);

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  // Функція скасування реєстрації
  const cancelRegistration = async (docId) => {
    if (!confirm('Скасувати реєстрацію?')) return;
    const jwt = localStorage.getItem('jwt');
    try {
      await fetch(`http://localhost:1337/api/registrations/${docId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${jwt}` }
      });
      setRegistrations(prev => prev.filter(reg => reg.documentId !== docId));
    } catch (err) { alert(err.message); }
  };

  // 👇 НОВА ФУНКЦІЯ: Видалення власної події
  const deleteEvent = async (docId) => {
    if (!confirm('Ви впевнені? Це видалить подію назавжди!')) return;
    const jwt = localStorage.getItem('jwt');
    try {
      const res = await fetch(`http://localhost:1337/api/events/${docId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${jwt}` }
      });
      if (!res.ok) throw new Error('Помилка видалення');

      // Прибираємо зі списку
      setMyEvents(prev => prev.filter(evt => evt.documentId !== docId));
    } catch (err) { alert(err.message); }
  };

  // 👇 НОВА ФУНКЦІЯ: Збереження міста
  const handleSaveCity = async () => {
    if (!user) return;
    setSaveStatus('saving');

    const jwt = localStorage.getItem('jwt');

    try {
      const res = await fetch(`http://localhost:1337/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`
        },
        body: JSON.stringify({
          city: myCity // Оновлюємо тільки поле "city"
        })
      });

      if (!res.ok) throw new Error('Не вдалося зберегти');

      const updatedUser = await res.json();

      // Оновлюємо дані юзера в localStorage!
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser); // Оновлюємо локальний стан
      setSaveStatus('success');

    } catch (err) {
      console.error(err);
      setSaveStatus('error');
    }
  };

  const getStatusColor = (status) => {
    if (status === 'approved') return '#2ecc71';
    if (status === 'rejected') return '#e74c3c';
    return '#95a5a6';
  };

  if (loading) return <main><p style={{ textAlign: 'center' }}>Завантаження...</p></main>;
  if (!user) return null;

  // 👇 ОБЧИСЛЕННЯ АНАЛІТИКИ
  const stats = myEvents.reduce((acc, event) => {
    // Беремо всі реєстрації на цю подію
    const regs = event.registrations || [];
    
    // Рахуємо тільки схвалені (продані)
    const soldCount = regs.filter(r => r.approval_status === 'approved').length;
    
    // Додаємо до загальних сум
    acc.totalEvents += 1;
    acc.totalRegistrations += regs.length; // Всього заявок
    acc.totalSold += soldCount; // Продано/Схвалено
    acc.totalRevenue += (event.price || 0) * soldCount; // Гроші
    
    return acc;
  }, { totalEvents: 0, totalRegistrations: 0, totalSold: 0, totalRevenue: 0 });

  return (
    <main>
      <h1 style={{ textAlign: 'center' }}>Мій кабінет</h1>

      {/* 👇 БЛОК АНАЛІТИКИ 👇 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', maxWidth: '1000px', margin: '20px auto' }}>
        
        <div className="event-card" style={{ textAlign: 'center', background: '#e8f6f3' }}>
          <h3 style={{ margin: 0, fontSize: '2rem', color: '#16a085' }}>{stats.totalRevenue} ₴</h3>
          <p style={{ margin: 0, color: '#7f8c8d' }}>Загальний дохід</p>
        </div>

        <div className="event-card" style={{ textAlign: 'center', background: '#fef9e7' }}>
          <h3 style={{ margin: 0, fontSize: '2rem', color: '#f39c12' }}>{stats.totalSold}</h3>
          <p style={{ margin: 0, color: '#7f8c8d' }}>Квитків продано</p>
        </div>

        <div className="event-card" style={{ textAlign: 'center', background: '#ebf5fb' }}>
          <h3 style={{ margin: 0, fontSize: '2rem', color: '#2980b9' }}>{stats.totalRegistrations}</h3>
          <p style={{ margin: 0, color: '#7f8c8d' }}>Всього заявок</p>
        </div>
        
        <div className="event-card" style={{ textAlign: 'center' }}>
           <h3 style={{ margin: 0, fontSize: '2rem' }}>{stats.totalEvents}</h3>
           <p style={{ margin: 0, color: '#7f8c8d' }}>Активних подій</p>
        </div>
      </div>
      {/* 👆 КІНЕЦЬ БЛОКУ АНАЛІТИКИ 👆 */}

      {/* 👇 НОВА ФОРМА: Налаштування профілю */}
      <div className="event-card" style={{ maxWidth: '800px', margin: '30px auto', background: '#f8f9fa' }}>
        <h2 style={{ marginTop: 0 }}>⚙️ Налаштування</h2>
        <label>Ваше місто:</label>
        <input
          type="text"
          placeholder="Наприклад: Львів"
          value={myCity}
          onChange={(e) => setMyCity(e.target.value)}
          style={{ width: '100%', marginTop: '5px', marginBottom: '10px' }}
        />
        <button onClick={handleSaveCity} disabled={saveStatus === 'saving'}>
          {saveStatus === 'saving' ? 'Збереження...' : 'Зберегти місто'}
        </button>
        {saveStatus === 'success' && <p style={{ color: 'green', margin: '5px 0 0 0' }}>Збережено!</p>}
      </div>

      <p style={{ textAlign: 'center', fontSize: '18px', marginBottom: '40px' }}>Вітаємо, **{user.username}**!</p>

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-start' }}>

        {/* ЛІВА КОЛОНКА: Мої реєстрації */}
        <div className="event-card" style={{ flex: 1, minWidth: '300px' }}>
          <h2 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px' }}>🎟 Мої квитки</h2>
          {registrations.length === 0 && <p style={{ color: 'grey' }}>Ви ще не зареєстровані ніде.</p>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {registrations.map((reg) => (
              <div key={reg.id} style={{ padding: '10px', border: '1px solid #eee', borderRadius: '8px' }}>
                <strong>{reg.event_name}</strong>
                <span style={{ display: 'block', color: getStatusColor(reg.approval_status), fontSize: '0.9rem' }}>
                  Статус: {reg.approval_status}
                </span>
                <button onClick={() => cancelRegistration(reg.documentId)} style={{ marginTop: '5px', background: '#e74c3c', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Скасувати</button>
              </div>
            ))}
          </div>
        </div>

        {/* ПРАВА КОЛОНКА: Мої створені події */}
        <div className="event-card" style={{ flex: 1, minWidth: '300px' }}>
          <h2 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px' }}>📢 Я - Організатор</h2>
          {myEvents.length === 0 && <p style={{ color: 'grey' }}>Ви ще не створили жодної події.</p>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {myEvents.map((evt) => (
              <div key={evt.id} style={{ padding: '10px', border: '1px solid #eee', borderRadius: '8px', background: '#f9f9f9' }}>
                <strong style={{ fontSize: '1.1rem' }}>{evt.title}</strong>
                <p style={{ margin: '5px 0', fontSize: '0.9rem', color: '#666' }}>{new Date(evt.date).toLocaleDateString()}</p>

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  {/* Кнопка РЕДАГУВАТИ */}
                  <Link href={`/events/${evt.documentId}/edit`} style={{ background: '#f39c12', color: 'white', padding: '5px 10px', borderRadius: '4px', textDecoration: 'none', fontSize: '0.9rem' }}>
                    ✏️ Редагувати
                  </Link>

                  {/* Кнопка ВИДАЛИТИ */}
                  <button onClick={() => deleteEvent(evt.documentId)} style={{ background: '#c0392b', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem' }}>
                    🗑 Видалити
                  </button>
                </div>

                <Link href={`/events/${evt.documentId}`} style={{ display: 'block', marginTop: '10px', fontSize: '0.8rem', color: '#3498db' }}>Переглянути сторінку події →</Link>
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}