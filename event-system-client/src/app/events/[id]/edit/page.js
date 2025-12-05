"use client";

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

export default function EditEventPage({ params }) {
  const { id } = use(params);

  // Стани для полів
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [city, setCity] = useState(''); // 👈 Нове
  const [type, setType] = useState('offline'); // 👈 Нове
  const [locationDetails, setLocationDetails] = useState(''); // 👈 Нове
  const [price, setPrice] = useState(0); // 👈 Нове
  const [maxCapacity, setMaxCapacity] = useState(0); // 👈 Нове

  const [currentImage, setCurrentImage] = useState(null);
  const [newFile, setNewFile] = useState(null);

  // Стани для категорій
  const [allCategories, setAllCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const jwt = localStorage.getItem('jwt');
      const user = JSON.parse(localStorage.getItem('user'));

      if (!jwt || !user) {
        router.push('/login');
        return;
      }

      try {
        // 1. Завантажуємо список усіх можливих категорій
        const catRes = await fetch('http://localhost:1337/api/categories');
        const catData = await catRes.json();
        setAllCategories(catData.data || []);

        // 2. Завантажуємо саму подію
        const res = await fetch(`http://localhost:1337/api/events/${id}?populate=*`);
        if (!res.ok) throw new Error('Помилка завантаження');
        
        const json = await res.json();
        const event = json.data;

        console.log('🔍 СПРАВЖНІ ДАНІ ПОДІЇ:', event);

        // Перевірка власника
        if (event.organizer && event.organizer.id !== user.id) {
          alert('Ви не можете редагувати чужу подію!');
          router.push('/profile');
          return;
        }

        // 3. ЗАПОВНЮЄМО ФОРМУ СТАРИМИ ДАНИМИ
        setTitle(event.title);
        try { setDescription(event.description[0].children[0].text); } catch(e) { setDescription(''); }
        
        // Дата
        if (event.date) {
           const d = new Date(event.date);
           d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
           setDate(d.toISOString().slice(0, 16));
        }

        // Нові поля
        setCity(event.city || '');
        setType(event.type || 'offline');
        setLocationDetails(event.location_details || '');
        setPrice(event.price || 0);
        setMaxCapacity(event.max_capacity || 0);

        // Категорії: Strapi повертає масив об'єктів, нам треба масив ID
        if (event.categories) {
          const ids = event.categories.map(c => c.id);
          setSelectedCategories(ids);
        }

        if (event.cover) {
          setCurrentImage(`http://localhost:1337${event.cover.url}`);
        }

        setLoading(false);

      } catch (err) {
        alert(err.message);
        router.push('/profile');
      }
    };

    fetchData();
  }, [id, router]);

  // Обробка чекбоксів категорій
  const handleCategoryChange = (categoryId) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

const uploadFile = async (jwt) => {
    const formData = new FormData();
    formData.append('files', file); // або newFile

    try {
      const res = await fetch('http://localhost:1337/api/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${jwt}` },
        body: formData,
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      
      // 👇 ВАША ПОМИЛКА ТУТ 👇
      // Неправильно: return data[0]; 
      // ПРАВИЛЬНО:
      return data[0].id;  // <--- МИ МАЄМО ПОВЕРНУТИ ТІЛЬКИ ЧИСЛО!
      
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    // setLoading(true); // Можна розкоментувати, але іноді краще залишити кнопку активною
    const jwt = localStorage.getItem('jwt');

    try {
      let fileId = null;
      if (newFile) {
        fileId = await uploadFile(jwt);
      }

      const payload = {
        data: {
          title,
          description: [{ type: 'paragraph', children: [{ type: 'text', text: description }] }],
          date,
          // 👇 Відправляємо нові поля
          city,
          type,
          location_details: locationDetails,
          price: Number(price),
          max_capacity: Number(maxCapacity),
          categories: selectedCategories,
          ...(fileId && { cover: fileId }) 
        }
      };

      const res = await fetch(`http://localhost:1337/api/events/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Не вдалося оновити');

      router.push('/profile');

    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <p style={{textAlign: 'center', marginTop: '50px'}}>Завантаження даних...</p>;

  return (
    <main>
      <form onSubmit={handleUpdate} className="event-card" style={{ maxWidth: '700px', margin: '40px auto' }}>
        <h1>✏️ Редагування події</h1>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <label>Назва:</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
          
          <label>Опис:</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={5} style={{ padding: '10px', fontSize: '16px' }} />
          
          <label>Дата:</label>
          <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} required />

          {/* 👇 НОВІ ПОЛЯ 👇 */}
          <label>Місто:</label>
          <input type="text" value={city} onChange={(e) => setCity(e.target.value)} required />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label>Тип:</label>
              <select value={type} onChange={(e) => setType(e.target.value)} style={{ width: '100%', padding: '10px' }}>
                <option value="offline">Офлайн</option>
                <option value="online">Онлайн</option>
              </select>
            </div>
            <div>
              <label>Деталі / Посилання:</label>
              <input type="text" value={locationDetails} onChange={(e) => setLocationDetails(e.target.value)} />
            </div>
            <div>
              <label>Ціна (UAH):</label>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <div>
              <label>Місць:</label>
              <input type="number" value={maxCapacity} onChange={(e) => setMaxCapacity(e.target.value)} />
            </div>
          </div>

          <label>Категорії:</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', padding: '10px', border: '1px solid #eee', borderRadius: '8px' }}>
            {allCategories.map(cat => (
              <label key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  value={cat.id}
                  checked={selectedCategories.includes(cat.id)}
                  onChange={() => handleCategoryChange(cat.id)}
                />
                {cat.name}
              </label>
            ))}
          </div>
          {/* 👆 КІНЕЦЬ НОВИХ ПОЛІВ 👆 */}

          <label>Картинка:</label>
          {currentImage && !newFile && (
            <div style={{ marginBottom: '10px' }}>
              <img src={currentImage} alt="Current" style={{ height: '100px', borderRadius: '5px' }} />
            </div>
          )}
          <input type="file" onChange={(e) => setNewFile(e.target.files[0])} />

          <button type="submit" style={{ background: '#f39c12', marginTop: '10px' }}>Зберегти зміни</button>
          <button type="button" onClick={() => router.back()} style={{ background: 'grey', marginTop: '0' }}>Скасувати</button>
        </div>
      </form>
    </main>
  );
}