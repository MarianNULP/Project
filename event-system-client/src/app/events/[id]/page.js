import { API_URL } from '@/utils/api';
import Link from 'next/link';
import EventOwnerControls from '@/components/EventOwnerControls'; 
import ReviewSection from '@/components/ReviewSection';
import styles from './page.module.css';

async function getEvent(id) {
  // Додаємо populate для organizer.id, щоб порівняти його з поточним юзером
  const query = `?populate[cover][fields]=url&populate[organizer][fields]=username&populate[organizer][fields]=id&populate[registrations][fields]=id`;
  
  const res = await fetch(`${API_URL}/api/events/${id}${query}`, {
    cache: 'no-store'
  });
  
  if (!res.ok) throw new Error('Подію не знайдено');
  const data = await res.json();
  return data.data;
}

function getSimpleTextFromRich(description) {
  try { return description[0].children[0].text; } catch (e) { return 'Опис відсутній'; }
}

export default async function EventPage({ params }) {
  const { id } = await params; 
  const event = await getEvent(id);

  const organizerId = event.organizer?.id; 
  const imageUrl = event.cover ? `${API_URL}${event.cover.url}` : null;
  const isOnline = event.type === 'online';
  const priceLabel = event.price && event.price > 0 ? `${event.price} UAH` : 'Безкоштовно';

  // Форматуємо дату гарно
  const formattedDate = new Date(event.date).toLocaleString('uk-UA', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', 
    hour: '2-digit', minute: '2-digit'
  });

  return (
    <main className={styles.mainWrapper}>
      
      {/* Кнопка Назад */}
      <div style={{width: '100%', maxWidth: '900px'}}>
        <Link href="/" className={styles.backLink}>
            ← Назад до подій
        </Link>
      </div>

      <div className={styles.card}>
        
        {/* Обкладинка */}
        {imageUrl ? (
          <img src={imageUrl} alt={event.title} className={styles.coverImage} />
        ) : (
          <div className={styles.noImage}>Зображення відсутнє</div>
        )}

        <div className={styles.content}>
          
          <h1 className={styles.title}>{event.title}</h1>
          
          <div className={styles.dateBadge}>
            📅 {formattedDate}
          </div>

          {/* Інфо-панель (Грід) */}
          <div className={styles.infoGrid}>
            <div className={styles.infoBox}>
              <span className={styles.infoLabel}>Вартість</span>
              <span className={`${styles.infoValue} ${styles.priceValue}`}>{priceLabel}</span>
            </div>

            <div className={styles.infoBox}>
              <span className={styles.infoLabel}>{isOnline ? 'Платформа' : 'Локація'}</span>
              <span className={styles.infoValue}>
                {isOnline ? '🌐 Онлайн' : `📍 ${event.city || 'Місто не вказано'}`}
              </span>
              <span style={{fontSize: '0.9rem', color: '#666'}}>
                 {event.location_details ? (
                    isOnline ? <a href={event.location_details} target="_blank" className={styles.linkValue}>Посилання на подію</a> : event.location_details
                 ) : 'Деталі уточнюються'}
              </span>
            </div>

            {event.max_capacity > 0 && (
              <div className={styles.infoBox}>
                <span className={styles.infoLabel}>Вільні місця</span>
                <span className={styles.infoValue}>Ліміт: {event.max_capacity}</span>
              </div>
            )}
          </div>

          <hr className={styles.divider} />

          <div className={styles.description}>
            {getSimpleTextFromRich(event.description)}
          </div>

          <hr className={styles.divider} />

          {/* Блок реєстрації / керування */}
          <EventOwnerControls 
             eventName={event.title} 
             eventId={event.documentId || event.id} 
             organizerId={organizerId}
             price={event.price || 0} 
          />
        
        </div>
      </div>
      
      {/* Секція відгуків (за межами картки, щоб не перевантажувати) */}
      <ReviewSection eventId={event.id} />

    </main>
  );
}