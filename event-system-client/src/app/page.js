import EventList from '../components/EventList';

// Функція отримання даних з сервера
async function getEvents() {
  const res = await fetch('http://192.168.50.254:1337/api/events?populate=*', { 
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
      {/* ❌ Прибрав зайвий H1, бо заголовок вже є в Header та EventList */}
      
      <EventList initialEvents={events} />
    </main>
  );
}