import EventList from '../components/EventList';

// Функція отримання даних з сервера
async function getEvents() {
  // ?populate=* потрібен для завантаження картинок
  // cache: 'no-store' гарантує, що ми завжди бачимо свіжі дані
  const res = await fetch('http://localhost:1337/api/events?populate=*', { 
    cache: 'no-store' 
  });
  
  if (!res.ok) {
    throw new Error('Не вдалося завантажити події');
  }
  
  const eventsData = await res.json();
  return eventsData.data; 
}

export default async function HomePage() {
  const events = await getEvents();

  return (
    <main>
      <h1>📅 Портал майбутніх подій</h1>
      
      {/* Ми прибрали AsyncManager, тепер тут тільки список для користувачів */}
      <EventList initialEvents={events} />
    </main>
  );
}