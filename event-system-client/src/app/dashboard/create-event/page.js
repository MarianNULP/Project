"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css'; // Імпортуємо нові стилі

// 👇 Твої ключі
const GOOGLE_API_KEY = "AIzaSyBuQa5eBHemCQQAlidEflw_qcfMsBrVjSE";
const UNSPLASH_ACCESS_KEY = "TRlCBMLYF8YpxEkMKEdcmdkyhNU6hcl17yPY-dP6UZc";

export default function CreateEventPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [type, setType] = useState('offline');
  const [locationDetails, setLocationDetails] = useState('');
  const [price, setPrice] = useState('');
  const [maxCapacity, setMaxCapacity] = useState('');
  const [date, setDate] = useState('');
  const [file, setFile] = useState(null);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('idle');

  const [aiLoading, setAiLoading] = useState(false);
  const [imgLoading, setImgLoading] = useState(false);
  const [allCategories, setAllCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);

  const router = useRouter();

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
      // ⚠️ Переконайся, що IP правильний. Якщо працюєш локально, краще 127.0.0.1 або localhost
      const res = await fetch('${API_URL}/api/categories');
      const data = await res.json();
      setAllCategories(data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCategoryChange = (categoryId) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId) 
        : [...prev, categoryId]
    );
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
        setFile(new File([blob], "unsplash-image.jpg", { type: "image/jpeg" }));
      } else { alert("Фото не знайдено :("); }
    } catch (err) { console.error(err); alert("Помилка пошуку фото"); } 
    finally { setImgLoading(false); }
  };

  const uploadFile = async (jwt) => {
    const formData = new FormData();
    formData.append('files', file);
    try {
      const res = await fetch('${API_URL}/api/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${jwt}` },
        body: formData
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      return data[0].id;
    } catch (err) { return null; }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    if (!user) return;
    
    const jwt = localStorage.getItem('jwt');
    let fileId = null;

    if (file) {
      fileId = await uploadFile(jwt);
      if (!fileId) { setStatus('idle'); return; }
    }

    const payload = {
      data: {
        title,
        description: [{ type: 'paragraph', children: [{ type: 'text', text: description }] }],
        date,
        city,
        type,
        location_details: locationDetails,
        price: Number(price),
        max_capacity: Number(maxCapacity),
        organizer: user.id,
        categories: { connect: selectedCategories },
        ...(fileId && { cover: fileId })
      }
    };

    try {
      const res = await fetch('${API_URL}/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwt}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      
      setStatus('success');
      router.push('/profile');
    } catch (err) {
      setError(err.message);
      setStatus('idle');
    }
  };

  if (!user) return <div style={{textAlign: 'center', marginTop: 100}}>Завантаження...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Створити нову подію 🚀</h1>
        <p style={{color: '#7f8c8d'}}>Заповніть деталі, щоб розповісти світу про ваш івент</p>
      </header>

      <form onSubmit={handleSubmit} className={styles.form}>
        
        {/* Назва */}
        <div className={styles.section}>
          <label className={styles.label}>Назва події</label>
          <input 
            className={styles.input} 
            type="text" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            placeholder="Наприклад: Вечір джазу..." 
            required 
          />
        </div>

        {/* Місто */}
        <div className={styles.section}>
          <label className={styles.label}>Місто проведення</label>
          <input 
            className={styles.input} 
            type="text" 
            value={city} 
            onChange={(e) => setCity(e.target.value)} 
            placeholder="Київ, Львів..." 
            required 
          />
        </div>

        {/* Опис + AI Кнопка */}
        <div className={styles.section}>
          <div className={styles.label}>
            <span>Опис події</span>
            <button 
              type="button" 
              onClick={generateDescription} 
              disabled={aiLoading || !title} 
              className={styles.helperBtn}
              title="Штучний інтелект напише опис за вас"
            >
              {aiLoading ? '✨ Пишу...' : '✨ Auto-Write with AI'}
            </button>
          </div>
          <textarea 
            className={styles.textarea} 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
            required 
            placeholder="Детальний опис вашої події..." 
          />
        </div>

        {/* Дата */}
        <div className={styles.section}>
          <label className={styles.label}>Дата та час</label>
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
            <label className={styles.label}>Тип події</label>
            <select 
              className={styles.select} 
              value={type} 
              onChange={(e) => setType(e.target.value)}
            >
              <option value="offline">🏛️ Офлайн</option>
              <option value="online">🌐 Онлайн</option>
            </select>
          </div>
          <div className={styles.section}>
            <label className={styles.label}>
              {type === 'online' ? 'Посилання' : 'Адреса'}
            </label>
            <input 
              className={styles.input} 
              type="text" 
              value={locationDetails} 
              onChange={(e) => setLocationDetails(e.target.value)} 
              placeholder={type === 'online' ? 'Zoom/Meet link...' : 'вул. Хрещатик, 1'} 
            />
          </div>
        </div>

        {/* Грід: Ціна та Місця */}
        <div className={styles.grid2}>
          <div className={styles.section}>
            <label className={styles.label}>Ціна (UAH)</label>
            <input 
              className={styles.input} 
              type="number" 
              min="0" 
              value={price} 
              onChange={(e) => setPrice(e.target.value)} 
              placeholder="0 = Безкоштовно" 
            />
          </div>
          <div className={styles.section}>
            <label className={styles.label}>Кількість місць</label>
            <input 
              className={styles.input} 
              type="number" 
              min="0" 
              value={maxCapacity} 
              onChange={(e) => setMaxCapacity(e.target.value)} 
              placeholder="0 = Безліміт" 
            />
          </div>
        </div>

        {/* Завантаження фото */}
        <div className={styles.section}>
          <div className={styles.label}>
            <span>Обкладинка</span>
            <button 
              type="button" 
              onClick={findImage} 
              disabled={imgLoading || !title} 
              className={styles.helperBtn}
            >
              {imgLoading ? '🔍 Шукаю...' : '📸 Знайти в Unsplash'}
            </button>
          </div>
          
          <div className={styles.imageUploadArea}>
            {file && (
              <img 
                src={URL.createObjectURL(file)} 
                alt="Preview" 
                className={styles.previewImg} 
              />
            )}
            <div className={styles.fileInputWrapper}>
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => setFile(e.target.files[0])} 
              />
            </div>
          </div>
        </div>

        {/* Категорії */}
        <div className={styles.section}>
          <label className={styles.label}>Оберіть категорії</label>
          <div className={styles.categoriesBox}>
            {allCategories.length === 0 && <span style={{color:'#999'}}>Завантаження...</span>}
            
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
                {selectedCategories.includes(cat.id) ? '✓ ' : ''}
                {cat.name}
              </label>
            ))}
          </div>
        </div>

        {error && <div className={styles.error}>⚠️ {error}</div>}

        <button 
          type="submit" 
          disabled={status === 'loading'} 
          className={styles.submitBtn}
        >
          {status === 'loading' ? 'Публікуємо...' : 'Опублікувати подію 🎉'}
        </button>

      </form>
    </div>
  );
}