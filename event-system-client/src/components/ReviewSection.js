"use client";
import { useState, useEffect } from 'react';

export default function ReviewSection({ eventId }) {
  const [reviews, setReviews] = useState([]);
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(5);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));
    fetchReviews();
  }, [eventId]);

  const fetchReviews = async () => {
    // Завантажуємо відгуки для цієї події + дані авторів
    const res = await fetch(`http://localhost:1337/api/reviews?filters[event][id][$eq]=${eventId}&populate[user]=*`);
    const data = await res.json();
    setReviews(data.data || []);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return alert('Увійдіть, щоб залишити відгук');
    
    const jwt = localStorage.getItem('jwt');
    try {
      await fetch('http://localhost:1337/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwt}` },
        body: JSON.stringify({ data: { content, rating, event: eventId, user: user.id } })
      });
      setContent('');
      fetchReviews(); // Оновити список
    } catch (err) { console.error(err); }
  };

  return (
    <div style={{ marginTop: '40px' }}>
      <h3>💬 Відгуки ({reviews.length})</h3>
      
      {/* Список відгуків */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px' }}>
        {reviews.map(review => (
          <div key={review.id} style={{ background: '#f9f9f9', padding: '15px', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>{review.user?.username || 'Анонім'}</strong>
              <span style={{ color: '#f39c12' }}>{'★'.repeat(review.rating)}</span>
            </div>
            <p style={{ margin: '5px 0' }}>{review.content}</p>
          </div>
        ))}
      </div>

      {/* Форма */}
      {user && (
        <form onSubmit={handleSubmit} className="event-card">
          <h4>Залишити відгук</h4>
          <div style={{ marginBottom: '10px' }}>
            <label>Оцінка: </label>
            <select value={rating} onChange={e => setRating(Number(e.target.value))}>
              <option value="5">5 - Відмінно</option>
              <option value="4">4 - Добре</option>
              <option value="3">3 - Нормально</option>
              <option value="2">2 - Погано</option>
              <option value="1">1 - Жахливо</option>
            </select>
          </div>
          <textarea 
            value={content} 
            onChange={e => setContent(e.target.value)} 
            placeholder="Ваші враження..." 
            required 
            style={{ width: '100%', padding: '10px', minHeight: '80px' }}
          />
          <button type="submit" style={{ marginTop: '10px', background: '#27ae60' }}>Надіслати</button>
        </form>
      )}
    </div>
  );
}