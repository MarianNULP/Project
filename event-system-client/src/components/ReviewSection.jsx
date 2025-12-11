"use client";

import { useState, useEffect } from 'react';

export default function ReviewSection({ eventId }) {
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState('');
  const [rating, setRating] = useState(5); // 👈 Додали стан для рейтингу (за замовчуванням 5)
  const [user, setUser] = useState(null);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userDataStr = localStorage.getItem('user');
    let userData = null;
    if (userDataStr) {
      userData = JSON.parse(userDataStr);
      setUser(userData);
    }

    const fetchReviews = async () => {
      try {
        // Отримуємо відгуки
        const res = await fetch(`http://192.168.50.254:1337/api/reviews?filters[event][id][$eq]=${eventId}&populate[user][fields]=username&populate[user][fields]=id`);
        
        if (!res.ok) return;

        const data = await res.json();
        const loadedReviews = data.data || [];
        setReviews(loadedReviews);

        if (userData) {
          const alreadyReviewed = loadedReviews.some(r => r.user?.id === userData.id);
          setHasReviewed(alreadyReviewed);
        }

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [eventId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return alert('Увійдіть, щоб залишити відгук');
    if (!newReview.trim()) return alert('Напишіть текст відгуку');

    const jwt = localStorage.getItem('jwt');

    try {
      const payload = {
        data: {
          content: newReview, // 👈 ЯКЩО ПОМИЛКА, ЗМІНИ 'content' НА СВОЮ НАЗВУ ПОЛЯ (напр. 'description')
          rating: Number(rating), // 👈 Відправляємо рейтинг
          event: eventId,
          user: user.id, 
        }
      };

      const res = await fetch('http://192.168.50.254:1337/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        // Якщо знову помилка Invalid key, вона буде тут
        throw new Error(errorData.error?.message || 'Помилка сервера');
      }

      const createdReviewResponse = await res.json();
      
      const newReviewObj = {
        id: createdReviewResponse.data.id,
        content: newReview, // Тут теж змінити на свою назву
        rating: rating,     // Додаємо рейтинг для відображення
        user: { username: user.username, id: user.id }
      };

      setReviews(prev => [...prev, newReviewObj]);
      setNewReview('');
      setHasReviewed(true);
      alert('Відгук додано!');

    } catch (err) {
      alert(`Помилка: ${err.message}`);
    }
  };

  return (
    <div style={{ marginTop: '50px', maxWidth: '800px', margin: '50px auto', padding: '0 20px' }}>
      <h3 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
        💬 Відгуки ({reviews.length})
      </h3>
      
      <div style={{ marginBottom: '40px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {reviews.map(review => (
          <div key={review.id} style={{ padding: '15px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #eee' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong style={{ color: '#2c3e50' }}>{review.user?.username || 'Анонім'}</strong>
                <span style={{ color: '#f39c12' }}>{'★'.repeat(review.rating || 0)}</span> {/* Показуємо зірочки */}
             </div>
             {/* 👇 Перевір, чи тут правильна назва поля */}
             <p style={{ margin: '5px 0 0 0' }}>{review.content || review.text || review.description}</p>
          </div>
        ))}
      </div>

      {user && !hasReviewed && (
        <form onSubmit={handleSubmit} style={{ background: '#fff', border: '1px solid #ddd', padding: '20px', borderRadius: '10px' }}>
          <h4 style={{ marginTop: 0 }}>Ваш відгук</h4>
          
          {/* Вибір рейтингу */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ marginRight: '10px' }}>Оцінка:</label>
            <select 
              value={rating} 
              onChange={e => setRating(e.target.value)}
              style={{ padding: '5px', borderRadius: '4px' }}
            >
              <option value="5">⭐⭐⭐⭐⭐ (5)</option>
              <option value="4">⭐⭐⭐⭐ (4)</option>
              <option value="3">⭐⭐⭐ (3)</option>
              <option value="2">⭐⭐ (2)</option>
              <option value="1">⭐ (1)</option>
            </select>
          </div>

          <textarea 
            value={newReview} 
            onChange={e => setNewReview(e.target.value)}
            placeholder="Напишіть текст..."
            style={{ width: '100%', minHeight: '80px', marginBottom: '10px', resize: 'none' }}
          />
          <button type="submit" style={{ background: '#3498db', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer' }}>
            Надіслати
          </button>
        </form>
      )}
    </div>
  );
}