"use client";

import { useState, useEffect } from 'react';
import styles from './ReviewSection.module.css'; // Імпорт стилів
import { API_URL } from '@/utils/api';

export default function ReviewSection({ eventId }) {
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState('');
  const [rating, setRating] = useState(5);
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
        const res = await fetch(`${API_URL}/api/reviews?filters[event][id][$eq]=${eventId}&populate[user][fields]=username&populate[user][fields]=id&sort=createdAt:desc`);
        
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
          content: newReview,
          rating: Number(rating),
          event: eventId,
          user: user.id, 
        }
      };

      const res = await fetch(`${API_URL}/api/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || 'Помилка сервера');
      }

      const createdReviewResponse = await res.json();
      
      const newReviewObj = {
        id: createdReviewResponse.data.id,
        content: newReview,
        rating: rating,
        user: { username: user.username, id: user.id }
      };

      setReviews(prev => [newReviewObj, ...prev]); // Додаємо новий на початок
      setNewReview('');
      setHasReviewed(true);

    } catch (err) {
      alert(`Помилка: ${err.message}`);
    }
  };

  // Допоміжна функція для зірочок
  const renderStars = (count) => '★'.repeat(count) + '☆'.repeat(5 - count);

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>
        💬 Відгуки <span className={styles.countBadge}>{reviews.length}</span>
      </h3>
      
      <div className={styles.reviewsList}>
        {loading && <p style={{color: '#999'}}>Завантаження відгуків...</p>}
        
        {!loading && reviews.length === 0 && (
          <div className={styles.emptyState}>
             Поки немає відгуків. Будьте першим!
          </div>
        )}

        {reviews.map(review => {
            const userName = review.user?.username || 'Анонім';
            const initial = userName.charAt(0).toUpperCase();
            
            return (
              <div key={review.id} className={styles.reviewCard}>
                 <div className={styles.reviewHeader}>
                    <div className={styles.userInfo}>
                        <div className={styles.avatar}>{initial}</div>
                        <div>
                            <div className={styles.username}>{userName}</div>
                            {/* Якщо є дата, можна вивести тут */}
                        </div>
                    </div>
                    <div className={styles.stars}>{renderStars(review.rating || 0)}</div>
                 </div>
                 <p className={styles.reviewText}>
                    {review.content || review.text || review.description}
                 </p>
              </div>
            );
        })}
      </div>

      {user && !hasReviewed && (
        <form onSubmit={handleSubmit} className={styles.formCard}>
          <h4 className={styles.formTitle}>✍️ Залишити відгук</h4>
          
          <div className={styles.ratingRow}>
            <label className={styles.label}>Ваша оцінка</label>
            <select 
              value={rating} 
              onChange={e => setRating(e.target.value)}
              className={styles.select}
            >
              <option value="5">⭐⭐⭐⭐⭐ Чудово (5)</option>
              <option value="4">⭐⭐⭐⭐ Добре (4)</option>
              <option value="3">⭐⭐⭐ Нормально (3)</option>
              <option value="2">⭐⭐ Погано (2)</option>
              <option value="1">⭐ Жахливо (1)</option>
            </select>
          </div>

          <textarea 
            className={styles.textarea}
            value={newReview} 
            onChange={e => setNewReview(e.target.value)}
            placeholder="Розкажіть про свої враження..."
          />
          
          <button type="submit" className={styles.submitBtn}>
            Опублікувати відгук
          </button>
        </form>
      )}
    </div>
  );
}