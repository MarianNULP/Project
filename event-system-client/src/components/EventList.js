"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import styles from './EventList.module.css';

// --- Допоміжні функції ---
function getSimpleTextFromRich(description) {
  try { return description[0].children[0].text; } catch (e) { return ''; }
}
const formatDate = (date) => new Date(date).toLocaleDateString('uk-UA', {
  day: 'numeric', month: 'short'
});

// --- Компонент Картки Події (Компактний) ---
function EventCard({ event }) {
  const imageUrl = event.cover ? `http://localhost:1337${event.cover.url}` : null;
  
  return (
    <Link 
      href={`/events/${event.documentId}`} 
      className={styles.eventCard}
    >
      <img 
        src={imageUrl || 'https://via.placeholder.com/280x200?text=No+Image'} 
        alt={event.title} 
        className={styles.eventCardImage} 
      />
      <div className={styles.eventCardContent}>
        <h4 className={styles.eventCardTitle}>
          {event.title}
        </h4>
        <div className={styles.eventCardMeta}>
          <span>{event.city || 'Онлайн'}</span> 
          <span>{formatDate(event.date)}</span>
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

  // Завантажуємо категорії
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('http://localhost:1337/api/categories');
        const data = await res.json();
        setAllCategories(data.data || []);
      } catch (err) { console.error("Не вдалося завантажити категорії", err); }
    };
    fetchCategories();

    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      if (user.city) {
        setCity(user.city); // Встановлюємо місто у фільтр
        // Викликаємо пошук з містом користувача
        handleSearch(user.city); 
      }
    }
  }, []);

  // Функція ПОШУКУ
  const handleSearch = async (forcedCity = null) => {
    setLoading(true);
    let queryString = '/api/events?populate=*';

    const searchCity = forcedCity || city;

    // Збираємо рядок запиту з усіх фільтрів
    if (title) queryString += `&filters[title][$contains]=${title}`;
    if (searchCity) queryString += `&filters[city][$contains]=${searchCity}`;
    if (title) queryString += `&filters[title][$contains]=${title}`;
    if (city) queryString += `&filters[city][$contains]=${city}`;
    if (category) queryString += `&filters[categories][id][$eq]=${category}`;
    if (date) queryString += `&filters[date][$gte]=${date}`;

    try {
      const res = await fetch(`http://localhost:1337${queryString}`);
      const data = await res.json();
      setEvents(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Скидання фільтрів
  const resetFilters = () => {
    setTitle('');
    setCity('');
    setCategory('');
    setDate('');
    setEvents(initialEvents);
  };

  return (
    // Головний Flex-контейнер
    <div className={styles.container}>
      
      {/* ЛІВА КОЛОНКА: Тільки Результати */}
      <div className={styles.resultsColumn}>
        
        {loading && <p>Завантаження результатів...</p>}
        {!loading && events.length === 0 && (
          <p style={{ textAlign: 'center', color: 'grey' }}>Нічого не знайдено 😔</p>
        )}

        {/* ЩІЛЬНА СІТКА */}
        <div className={styles.eventGrid}>
          {!loading && events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </div>

      {/* ПРАВА КОЛОНКА: Панель фільтрів (з усіма полями) */}
      <div className={styles.filtersColumn}>
        
        {/* 👇 ПОШУК ЗА НАЗВОЮ (ПЕРЕНЕСЛИ СЮДИ) 👇 */}
        <div className={styles.searchBox}>
          <label htmlFor="titleSearch" className={styles.filterLabel}>Пошук за назвою</label>
          <input
            id="titleSearch"
            type="text"
            placeholder="Введіть назву..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <h3 className={styles.filtersHeader}>⚙️ Фільтри</h3>
        
        <div className={styles.filterGroup}>
          
          <label className={styles.filterLabel}>Місто:</label>
          <input type="text" placeholder="Введіть місто..." value={city} onChange={(e) => setCity(e.target.value)} />
          
          <label className={styles.filterLabel}>Дата (після):</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          
          <label className={styles.filterLabel}>Категорія:</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">-- Всі категорії --</option>
            {allCategories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          
          <button onClick={() => handleSearch(null)} style={{ background: '#3498db', marginTop: '10px' }}>Застосувати</button>
          <button onClick={resetFilters} className={styles.resetButton}>Скинути</button>
        </div>
      </div>
    </div>
  );
}