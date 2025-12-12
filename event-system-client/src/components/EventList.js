"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import styles from './EventList.module.css';

// --- Допоміжні функції ---
const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('uk-UA', {
    day: 'numeric', month: 'long' // "12 грудня"
  });
};

// --- Компонент Картки Події ---
function EventCard({ event }) {
  // Перевірка на наявність обкладинки
  const imageUrl = event.cover
    ? `${API_URL}${event.cover.url}`
    : 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=500&q=60'; // Дефолтне гарне фото

  return (
    <Link href={`/events/${event.documentId}`} className={styles.eventCard}>
      <img
        src={imageUrl}
        alt={event.title}
        className={styles.eventCardImage}
        loading="lazy"
      />
      <div className={styles.eventCardContent}>
        <h4 className={styles.eventCardTitle}>{event.title}</h4>
        <div className={styles.eventCardMeta}>
          <span>📍 {event.city || 'Онлайн'}</span>
          <span>📅 {formatDate(event.date)}</span>
        </div>
      </div>
    </Link>
  );
}

// --- ГОЛОВНИЙ КОМПОНЕНТ СПИСКУ ---
export default function EventList({ initialEvents }) {
  const [events, setEvents] = useState(initialEvents);
  const [loading, setLoading] = useState(false);
  const [allCategories, setAllCategories] = useState([]);

  // Стани для фільтрів
  const [title, setTitle] = useState('');
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');

  // Завантаження категорій та міста юзера
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${API_URL}/api/categories`);
        const data = await res.json();
        setAllCategories(data.data || []);
      } catch (err) { console.error("Err categories", err); }
    };
    fetchCategories();

    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (user.city) {
          setCity(user.city);
          handleSearch(user.city); // Авто-пошук по місту
        }
      } catch (e) { }
    }
  }, []);

  // Функція ПОШУКУ
  const handleSearch = async (forcedCity = null) => {
    setLoading(true);

    // Починаємо формувати запит
    let queryString = `/api/events?populate=*`;

    // Логіка міста: або те, що передали примусово (на старті), або те, що в інпуті
    const searchCity = forcedCity !== null ? forcedCity : city;

    // ⚠️ ВИПРАВЛЕНО: Прибрані дублікати фільтрів
    if (title) queryString += `&filters[title][$contains]=${title}`;
    if (searchCity) queryString += `&filters[city][$contains]=${searchCity}`;
    if (category) queryString += `&filters[categories][id][$eq]=${category}`;
    if (date) queryString += `&filters[date][$gte]=${date}`;

    try {
      const res = await fetch(`${API_URL}${queryString}`);
      const data = await res.json();
      setEvents(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setTitle('');
    setCity('');
    setCategory('');
    setDate('');
    setEvents(initialEvents);
  };

  return (
    <div className={styles.container}>

      {/* --- ЛІВА КОЛОНКА --- */}
      <div className={styles.resultsColumn}>



        {loading && (
          <div style={{ textAlign: 'center', padding: 40, color: 'white', fontSize: '1.2rem' }}>
            🌀 Оновлюємо список...
          </div>
        )}

        {!loading && events.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px', background: 'rgba(255,255,255,0.9)', borderRadius: 20 }}>
            <p style={{ fontSize: '1.2rem', color: '#64748b' }}>На жаль, за цими фільтрами нічого не знайдено 😔</p>
            <button onClick={resetFilters} className={styles.applyBtn} style={{ marginTop: 10 }}>
              Скинути фільтри
            </button>
          </div>
        )}

        <div className={styles.eventGrid}>
          {!loading && events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </div>

      {/* --- ПРАВА КОЛОНКА (ФІЛЬТРИ) --- */}
      <div className={styles.filtersColumn}>
        <div className={styles.filtersHeader}>
          <span>⚙️</span> Фільтри пошуку
        </div>

        <div className={styles.filterGroup}>

          <div>
            <label className={styles.filterLabel}>Пошук за назвою</label>
            <input
              type="text"
              placeholder="Концерт, вечірка..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className={styles.filterLabel}>Місто</label>
            <input
              type="text"
              placeholder="Введіть місто..."
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>

          <div>
            <label className={styles.filterLabel}>Дата (від)</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div>
            <label className={styles.filterLabel}>Категорія</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">-- Всі категорії --</option>
              {allCategories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <button onClick={() => handleSearch(null)} className={styles.applyBtn}>
            Застосувати
          </button>

          <button onClick={resetFilters} className={styles.resetButton}>
            Скинути
          </button>
        </div>
      </div>
    </div>
  );
}