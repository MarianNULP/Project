"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateEventPage() {
  // Нові стани
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState(''); // 👈 Нове поле
  const [type, setType] = useState('offline'); // offline за замовчуванням
  const [locationDetails, setLocationDetails] = useState('');
  const [price, setPrice] = useState(0);
  const [maxCapacity, setMaxCapacity] = useState(0);
  const [date, setDate] = useState('');
  const [file, setFile] = useState(null); // 👈 Стан для файлу
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | loading | success
  
  const [allCategories, setAllCategories] = useState([]); // Список всіх категорій
  const [selectedCategories, setSelectedCategories] = useState([]); // ID обраних
  
  const router = useRouter();

  // Перевірка, чи залогінений користувач
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
    } else {
      setUser(JSON.parse(userData));
      fetchCategories();
    }
  }, [router]);

  const fetchCategories = async () => {
    try {
      const res = await fetch('http://localhost:1337/api/categories');
      const data = await res.json();
      setAllCategories(data.data || []);
    } catch (err) {
      console.error("Не вдалося завантажити категорії", err);
    }
  };

  // Обробник для чекбоксів
  const handleCategoryChange = (categoryId) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId) // зняти галочку
        : [...prev, categoryId] // поставити галочку
    );
  };

  // Функція для завантаження файлу (Етап 1)
  const uploadFile = async (jwt) => {
    const formData = new FormData();
    formData.append('files', file); // 'files' - це ключ, який очікує Strapi

    try {
      const res = await fetch('http://localhost:1337/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${jwt}`
          // 'Content-Type': 'multipart/form-data' НЕ ПОТРІБЕН,
          // браузер сам його встановить з потрібним 'boundary'
        },
        body: formData,
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      
      return data[0].id; // Повертаємо ID завантаженого файлу
    } catch (err) {
      setError(`Помилка завантаження файлу: ${err.message}`);
      return null;
    }
  };

  // Головна функція відправки (Етапи 2 + 3)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setStatus('loading');

    if (!user) return;
    const jwt = localStorage.getItem('jwt');

    let fileId = null;

    // --- ЕТАП 1: Завантажуємо файл, якщо він є ---
    if (file) {
      fileId = await uploadFile(jwt);
      if (!fileId) {
        setStatus('idle');
        return; // Зупиняємо, якщо файл не завантажився
      }
    }

    // --- ЕТАП 2: Створюємо подію ---
    const payload = {
      data: {
        title: title,
        description: [{ type: 'paragraph', children: [{ type: 'text', text: description }] }],
        date: date,
        city: city,
        type: type, 
        location_details: locationDetails,
        price: Number(price), // Перетворюємо на число!
        max_capacity: Number(maxCapacity),
        organizer: user.id,
        categories: selectedCategories,
        ...(fileId && { cover: fileId })
      }
    };

    try {
      const res = await fetch('http://localhost:1337/api/events', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error.message);

      setStatus('success');
      router.push('/profile'); // Успіх!

    } catch (err) {
      setError(`Помилка створення події: ${err.message}`);
      setStatus('idle');
    }
  };

  if (!user) {
    return <main><p>Перевірка доступу...</p></main>;
  }

  return (
    <main>
      <form onSubmit={handleSubmit} className="event-card" style={{ maxWidth: '700px', margin: '40px auto' }}>
        <h1 style={{ textAlign: 'center', marginTop: 0 }}>Створення нової події</h1>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <label>Назва події:</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
          
          <label>Опис:</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={5} style={{ padding: '10px', fontFamily: 'inherit', fontSize: '16px' }} />
          
          <label>Дата та час:</label>
          <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} required placeholder="Наприклад: Львів" />

            <label>Місто:</label>
            <input type="text" value={city} onChange={(e) => setCity(e.target.value)} required />
          
            {/* 👇 НОВИЙ БЛОК ПАРАМЕТРІВ 👇 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            
            <div>
              <label>Тип події:</label>
              <select 
                value={type} 
                onChange={(e) => setType(e.target.value)}
                style={{ width: '100%', padding: '10px', marginTop: '5px' }}
              >
                <option value="offline">Офлайн (Жива зустріч)</option>
                <option value="online">Онлайн</option>
              </select>
            </div>

            <div>
              <label>Деталі місця / Посилання:</label>
              <input 
                type="text" 
                placeholder={type === 'online' ? 'Посилання на Zoom/Meet' : 'Вул. Шевченка 10'}
                value={locationDetails} 
                onChange={(e) => setLocationDetails(e.target.value)}
              />
            </div>

            <div>
              <label>Ціна (UAH):</label>
              <input 
                type="number" 
                min="0"
                value={price} 
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0 = Безкоштовно"
              />
            </div>

            <div>
              <label>Кількість місць:</label>
              <input 
                type="number" 
                min="0"
                value={maxCapacity} 
                onChange={(e) => setMaxCapacity(e.target.value)}
                placeholder="0 = Безліміт"
              />
            </div>
          </div>
          {/* 👆 КІНЕЦЬ НОВОГО БЛОКУ 👆 */}
          
          {/* 👇 НАШЕ НОВЕ ПОЛЕ ДЛЯ ФАЙЛУ 👇 */}
          <label>Обкладинка (постер):</label>
          <input 
            type="file" 
            accept="image/png, image/jpeg"
            onChange={(e) => setFile(e.target.files[0])} // Зберігаємо файл у стан
          />

            {/* 👇 НОВИЙ БЛОК: КАТЕГОРІЇ 👇 */}
          <label>Категорії:</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', padding: '10px', border: '1px solid #eee', borderRadius: '8px' }}>
            {allCategories.length === 0 && <p>Завантаження категорій...</p>}
            {allCategories.map(category => (
              <label key={category.id} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  value={category.id}
                  checked={selectedCategories.includes(category.id)}
                  onChange={() => handleCategoryChange(category.id)}
                />
                {category.name}
              </label>
            ))}
          </div>
          
          <button type="submit" style={{ marginTop: '10px', background: '#27ae60' }} disabled={status === 'loading'}>
            {status === 'loading' ? 'Завантаження...' : 'Опублікувати подію'}
          </button>
          
          {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
        </div>
      </form>
    </main>
  );
}