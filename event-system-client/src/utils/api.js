// src/utils/api.js

// Якщо ми на Vercel (production), беремо адресу з налаштувань.
// Якщо на комп'ютері (development) - беремо локальну.
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:1337';

// Функція для отримання повного шляху до картинки
export const getStrapiMedia = (url) => {
  if (url == null) {
    return null;
  }
  // Якщо посилання вже повне (починається з http), повертаємо як є
  if (url.startsWith('http') || url.startsWith('//')) {
    return url;
  }
  // Інакше доклеюємо наш домен
  return `${API_URL}${url}`;
};