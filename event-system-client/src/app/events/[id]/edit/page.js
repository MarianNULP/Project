"use client";

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css'; // Імпорт нових стилів

// 👇 Ваші ключі
const GOOGLE_API_KEY = "AIzaSyBuQa5eBHemCQQAlidEflw_qcfMsBrVjSE";
const UNSPLASH_ACCESS_KEY = "TRlCBMLYF8YpxEkMKEdcmdkyhNU6hcl17yPY-dP6UZc";

export default function EditEventPage({ params }) {
  const { id } = use(params);

  // --- States ---
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [city, setCity] = useState('');
  const [type, setType] = useState('offline');
  const [locationDetails, setLocationDetails] = useState('');
  const [price, setPrice] = useState(0);
  const [maxCapacity, setMaxCapacity] = useState(0);

  const [currentImage, setCurrentImage] = useState(null);
  const [newFile, setNewFile] = useState(null);

  const [allCategories, setAllCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [imgLoading, setImgLoading] = useState(false);

  const router = useRouter();

  // --- Fetch Data ---
  useEffect(() => {
    const fetchData = async () => {
      const jwt = localStorage.getItem('jwt');
      const user = JSON.parse(localStorage.getItem('user'));

      if (!jwt || !user) { router.push('/login'); return; }

      try {
        // Завантажуємо категорії
        const catRes = await fetch('http://192.168.50.254:1337/api/categories');
        const catData = await catRes.json();
        setAllCategories(catData.data || []);

        // Завантажуємо подію
        const res = await fetch(`http://192.168.50.254:1337/api/events/${id}?populate=*`);
        if (!res.ok) throw new Error('Помилка завантаження');
        
        const json = await res.json();
        const event = json.data;

        // Перевірка прав
        if (event.organizer && event.organizer.id !== user.id) {
          alert('Ви не можете редагувати чужу подію!');
          router.push('/profile');
          return;
        }

        // Заповнюємо поля
        setTitle(event.title);
        try { setDescription(event.description[0].children[0].text); } catch(e) { setDescription(''); }
        
        if (event.date) {
           const d = new Date(event.date);
           d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
           setDate(d.toISOString().slice(0, 16));
        }

        setCity(event.city || '');
        setType(event.type || 'offline');
        setLocationDetails(event.location_details || '');
        setPrice(event.price || 0);
        setMaxCapacity(event.max_capacity || 0);

        if (event.categories) {
          const ids = event.categories.map(c => c.id);
          setSelectedCategories(ids);
        }

        if (event.cover) {
          setCurrentImage(`http://192.168.50.254:1337${event.cover.url}`);
        }
        setLoading(false);
      } catch (err) {
        alert(err.message); 
        router.push('/profile');
      }
    };
    fetchData();
  }, [id, router]);

  // --- Handlers ---
  const handleCategoryChange = (categoryId) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId) 
        : [...prev, categoryId]
    );
  };

  const findImage = async () => {
    if (!title) { alert("Введіть назву події!"); return; }
    setImgLoading(true);
    try {
      const searchRes = await fetch(`https://api.unsplash.com/search/photos?query=${title} ${city}&per_page=1&client_id=${UNSPLASH_ACCESS_KEY}`);
      const searchData = await searchRes.json();
      if (searchData.results?.length > 0) {
        const imageUrl = searchData.results[0].urls.regular;
        const imgResponse = await fetch(imageUrl);
        const blob = await imgResponse.blob();
        setNewFile(new File([blob], "unsplash-image.jpg", { type: "image/jpeg" }));
      } else { alert("Фото не знайдено :("); }
    } catch (err) { console.error(err); alert("Помилка пошуку"); } 
    finally { setImgLoading(false); }
  };

  const generateDescription = async () => {
    if (!title) { alert("Введіть назву!"); return; }
    setAiLoading(true);
    const prompt = `Напиши привабливий опис для події "${title}" у місті ${city || 'Україна'}. Українською, 2-3 абзаци. Без markdown.`;
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      const data = await response.json();
      if (data.candidates?.[0]?.content) { 
        setDescription(data.candidates[0].content.parts[0].text); 
      }
    } catch (error) { alert("AI помилка"); } 
    finally { setAiLoading(false); }
  };

  const uploadFile = async (jwt) => {
    const formData = new FormData(); 
    formData.append('files', newFile); 
    try {
      const res = await fetch('http://192.168.50.254:1337/api/upload', {
        method: 'POST', headers: { 'Authorization': `Bearer ${jwt}` }, body: formData,
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      return data[0].id;
    } catch (err) { console.error(err); return null; }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const jwt = localStorage.getItem('jwt');
    try {
      let fileId = null;
      if (newFile) { fileId = await uploadFile(jwt); }

      const payload = {
        data: {
          title, 
          description: [{ type: 'paragraph', children: [{ type: 'text', text: description }] }], 
          date, city, type,
          location_details: locationDetails, 
          price: Number(price), 
          max_capacity: Number(maxCapacity),
          categories: selectedCategories, 
          ...(fileId && { cover: fileId }) 
        }
      };

      const res = await fetch(`http://192.168.50.254:1337/api/events/${id}`, {
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwt}` }, 
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Не вдалося оновити');
      router.push('/profile');
    } catch (err) { alert(err.message); }
  };

  if (loading) return <div style={{textAlign: 'center', marginTop: 100, color: '#666'}}>Завантаження даних...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>✏️ Редагування події</h1>
        <p className={styles.subtitle}>Змініть деталі вашої події нижче</p>
      </header>
      
      <form onSubmit={handleUpdate} className={styles.form}>
        
        {/* Назва */}
        <div className={styles.section}>
          <label className={styles.label}>Назва події</label>
          <input 
            className={styles.input} 
            type="text" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            required 
          />
        </div>

        {/* Місто */}
        <div className={styles.section}>
          <label className={styles.label}>Місто</label>
          <input 
            className={styles.input} 
            type="text" 
            value={city} 
            onChange={(e) => setCity(e.target.value)} 
            required 
          />
        </div>

        {/* Опис + AI */}
        <div className={styles.section}>
          <div className={styles.label}>
            <span>Опис</span>
            <button 
              type="button" 
              onClick={generateDescription} 
              disabled={aiLoading || !title} 
              className={styles.helperBtn}
            >
              {aiLoading ? '✨ Пишу...' : '✨ Покращити AI'}
            </button>
          </div>
          <textarea 
            className={styles.textarea} 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
            required 
            rows={6} 
          />
        </div>

        {/* Дата */}
        <div className={styles.section}>
          <label className={styles.label}>Дата проведення</label>
          <input 
            className={styles.input} 
            type="datetime-local" 
            value={date} 
            onChange={(e) => setDate(e.target.value)} 
            required 
          />
        </div>

        {/* Грід: Тип та Локація */}
        <div className={styles.grid2}>
           <div className={styles.section}>
             <label className={styles.label}>Тип</label>
             <select className={styles.select} value={type} onChange={(e) => setType(e.target.value)}>
                <option value="offline">🏛️ Офлайн</option>
                <option value="online">🌐 Онлайн</option>
             </select>
           </div>
           <div className={styles.section}>
             <label className={styles.label}>{type === 'online' ? 'Лінк' : 'Адреса'}</label>
             <input className={styles.input} type="text" value={locationDetails} onChange={(e) => setLocationDetails(e.target.value)} />
           </div>
        </div>

        {/* Грід: Ціна та Місця */}
        <div className={styles.grid2}>
           <div className={styles.section}>
             <label className={styles.label}>Ціна (грн)</label>
             <input className={styles.input} type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
           </div>
           <div className={styles.section}>
             <label className={styles.label}>Кількість місць</label>
             <input className={styles.input} type="number" value={maxCapacity} onChange={(e) => setMaxCapacity(e.target.value)} />
           </div>
        </div>

        {/* Блок із зображеннями (Покращений) */}
        <div className={styles.section}>
           <div className={styles.label}>
             <span>Обкладинка</span>
             <button type="button" onClick={findImage} disabled={imgLoading} className={styles.helperBtn}>
               {imgLoading ? '🔍 Шукаю...' : '📸 Знайти нове'}
             </button>
           </div>
           
           <div className={styles.imageUploadArea}>
              <div className={styles.imagePreviewRow}>
                 {/* Поточне фото (якщо є) */}
                 {currentImage && !newFile && (
                   <div className={styles.imgBox}>
                     <span className={styles.imgLabel}>Поточне</span>
                     <img src={currentImage} alt="Current" className={styles.previewImg} />
                   </div>
                 )}
                 {/* Нове фото (якщо вибрали) */}
                 {newFile && (
                   <div className={styles.imgBox}>
                     <span className={styles.imgLabel} style={{color: '#22c55e'}}>Нове</span>
                     <img src={URL.createObjectURL(newFile)} alt="New" className={`${styles.previewImg} ${styles.newPreview}`} />
                   </div>
                 )}
              </div>
              
              <input 
                 type="file" 
                 onChange={(e) => setNewFile(e.target.files[0])} 
                 accept="image/*"
                 style={{marginTop: 10}}
              />
           </div>
        </div>

        {/* Категорії */}
        <div className={styles.section}>
          <label className={styles.label}>Категорії</label>
          <div className={styles.categoriesBox}>
             {allCategories.map(cat => (
                <label 
                  key={cat.id} 
                  className={`${styles.categoryTag} ${selectedCategories.includes(cat.id) ? styles.active : ''}`}
                >
                  <input 
                    type="checkbox" 
                    checked={selectedCategories.includes(cat.id)} 
                    onChange={() => handleCategoryChange(cat.id)} 
                  />
                  {cat.name}
                </label>
             ))}
          </div>
        </div>

        {/* Кнопки */}
        <div className={styles.buttonRow}>
          <button type="button" onClick={() => router.back()} className={styles.cancelBtn}>
             Скасувати
          </button>
          <button type="submit" className={styles.submitBtn}>
             Зберегти зміни
          </button>
        </div>

      </form>
    </div>
  );
}