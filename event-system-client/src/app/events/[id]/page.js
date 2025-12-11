import Link from 'next/link';
import EventOwnerControls from '@/components/EventOwnerControls'; 
import ReviewSection from '@/components/ReviewSection';

async function getEvent(id) {
  // Додаємо populate для organizer.id, щоб порівняти його з поточним юзером
  const query = `?populate[cover][fields]=url&populate[organizer][fields]=username&populate[organizer][fields]=id&populate[registrations][fields]=id`;
  
  const res = await fetch(`http://192.168.50.254:1337/api/events/${id}${query}`, {
    cache: 'no-store'
  });
  
  if (!res.ok) throw new Error('Подію не знайдено');
  const data = await res.json();
  return data.data; // Якщо Strapi v4, тут повертається об'єкт з id та attributes. Якщо v5 - одразу об'єкт.
}

function getSimpleTextFromRich(description) {
  try { return description[0].children[0].text; } catch (e) { return 'Опис відсутній'; }
}

export default async function EventPage({ params }) {
  const { id } = await params; 
  const event = await getEvent(id);

  // Отримуємо ID організатора
  // Увага: перевір в Strapi відповідь. Це може бути event.organizer.id або event.attributes.organizer.data.id
  const organizerId = event.organizer?.id; 

  const imageUrl = event.cover ? `http://192.168.50.254:1337${event.cover.url}` : null;
  const isOnline = event.type === 'online';
  const priceLabel = event.price && event.price > 0 ? `${event.price} UAH` : 'Безкоштовно';

  return (
    <main>
      <Link href="/" style={{ display: 'inline-block', marginBottom: '20px', color: '#3498db', textDecoration: 'none', fontWeight: 'bold' }}>
        ← Назад до всіх подій
      </Link>

      <div className="event-card" style={{ maxWidth: '800px', margin: '0 auto', padding: '0', overflow: 'hidden' }}>
        
        {imageUrl && (
          <img 
            src={imageUrl} 
            alt={event.title} 
            style={{ width: '100%', maxHeight: '400px', objectFit: 'cover' }} 
          />
        )}

        <div style={{ padding: '30px' }}>
          <h1 style={{ margin: '0 0 10px 0' }}>{event.title}</h1>
          
          <div style={{ color: '#7f8c8d', marginBottom: '20px' }}>
            📅 {new Date(event.date).toLocaleString('uk-UA', {
                year: 'numeric', month: 'long', day: 'numeric', 
                hour: '2-digit', minute: '2-digit'
            })}
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '20px',
            background: '#f8f9fa',
            padding: '20px',
            borderRadius: '12px',
            marginBottom: '30px',
            border: '1px solid #eee'
          }}>
            <div>
              <strong style={{ display: 'block', color: '#666', fontSize: '0.9rem' }}>ВАРТІСТЬ:</strong>
              <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#27ae60' }}>{priceLabel}</span>
            </div>
            <div>
              <strong style={{ display: 'block', color: '#666', fontSize: '0.9rem' }}>
                {isOnline ? '🌐 ОНЛАЙН' : `📍 МІСТО: ${event.city || 'Не вказано'}`}
              </strong>
              <span style={{ fontSize: '1.1rem' }}>
                {event.location_details ? (
                  isOnline ? <a href={event.location_details} target="_blank" style={{ color: '#3498db' }}>Посилання</a> : event.location_details
                ) : 'Деталі уточнюються'}
              </span>
            </div>
            {event.max_capacity > 0 && (
              <div>
                <strong style={{ display: 'block', color: '#666', fontSize: '0.9rem' }}>КІЛЬКІСТЬ МІСЦЬ:</strong>
                <span style={{ fontSize: '1.1rem' }}>Ліміт: {event.max_capacity}</span>
              </div>
            )}
          </div>

          <hr style={{ margin: '25px 0', border: '0', borderTop: '1px solid #eee' }} />

          <div style={{ fontSize: '18px', lineHeight: '1.8', color: '#444' }}>
            {getSimpleTextFromRich(event.description)}
          </div>

          <hr style={{ margin: '40px 0', border: '0', borderTop: '1px solid #eee' }} />

          {/* 👇 ЗАМІНИЛИ EventForm НА EventOwnerControls 👇 */}
          <EventOwnerControls 
             eventName={event.title} 
             eventId={event.documentId || event.id} // Перевір, що приймає Strapi API (ID чи documentId)
             organizerId={organizerId}
             price={event.price || 0} 
          />
        
        </div>
      </div>
      
      <ReviewSection eventId={event.id} />
    </main>
  );
}