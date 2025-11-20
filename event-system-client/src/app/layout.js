import './globals.css';
import Header from '../components/Header'; // 👈 1. ІМПОРТУЄМО

export const metadata = {
  title: 'EventPort - Портал подій',
  description: 'Знайдіть найкращі події у вашому місті',
};

export default function RootLayout({ children }) {
  return (
    <html lang="uk">
      <body>
        <Header /> {/* 👈 2. ВСТАВЛЯЄМО ШАПКУ */}
        {children} {/* Тут будуть ваші сторінки */}
      </body>
    </html>
  );
}