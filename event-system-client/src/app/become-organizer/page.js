"use client";
import { API_URL } from '@/utils/api';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css'; 

export default function BecomeOrganizerPage() {
  const [formData, setFormData] = useState({
    companyName: '',
    description: '',
    contact_email: '',
  });
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const jwt = localStorage.getItem('jwt');

    if (!userData || !jwt) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(userData));
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const jwt = localStorage.getItem('jwt');

    try {
      const res = await fetch(`${API_URL}/api/organizer-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`
        },
        body: JSON.stringify({
          data: {
            companyName: formData.companyName,
            description: formData.description,
            contact_email: formData.contact_email,
            request_status: 'pending',
            user: user.id
          }
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || 'Помилка при створенні заявки');
      }

      alert("Заявку надіслано успішно! Ми надішлемо відповідь на email.");
      router.push('/');
    } catch (error) {
      console.error(error);
      alert("Помилка: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>🤝 Стати партнером-організатором</h2>
      <p className={styles.subtitle}>Заповніть форму, і ми надамо вам доступ до створення подій.</p>

      <form onSubmit={handleSubmit} className={styles.form}>
        
        <div className={styles.formGroup}>
          <label className={styles.label}>🏢 Назва організації / Гурту</label>
          <input
            className={styles.input}
            type="text"
            required
            placeholder="Super Events LLC"
            value={formData.companyName}
            onChange={(e) => setFormData({...formData, companyName: e.target.value})}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>✉️ Контактний Email</label>
          <input
            className={styles.input}
            type="email"
            required
            placeholder="manager@example.com"
            value={formData.contact_email}
            onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Опис діяльності</label>
          <textarea
            className={styles.textarea}
            required
            rows="4"
            placeholder="Ми організовуємо благодійні концерти..."
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />
        </div>

        <button 
          type="submit" 
          className={styles.button}
          disabled={loading}
        >
          {loading ? 'Відправка...' : 'Надіслати заявку'}
        </button>

      </form>
    </div>
  );
}