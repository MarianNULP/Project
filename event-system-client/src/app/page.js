import EventList from '../components/EventList';

// Функція отримання даних з сервера
async function getEvents() {
  const res = await fetch(`${API_URL}/api/events?populate=*`, { 
    cache: 'no-store' 
  });
  
  if (!res.ok) {
    throw new Error('Не вдалося завантажити події');
  }
  
  const eventsData = await res.json();
  return eventsData.data; 
}

export const metadata = {
  title: 'Головна | EventPort',
  description: 'Знайдіть найкращі події у вашому місті.',
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