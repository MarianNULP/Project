"use client"; // Обов'язково! localStorage працює тільки в браузері.

import { useState, useEffect } from 'react';

export default function Header() {
    const [user, setUser] = useState(null); // Стан для зберігання даних користувача

    useEffect(() => {
        // Цей код виконається, коли компонент завантажиться в браузері
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData)); // Якщо юзер є в пам'яті - записуємо його в стан
        }
    }, []); // Пустий масив означає "виконати 1 раз при завантаженні"

    const handleLogout = () => {
        // Очищуємо пам'ять
        localStorage.removeItem('jwt');
        localStorage.removeItem('user');
        setUser(null);
        window.location.href = '/'; // Повертаємо на головну
    };

    return (
        <header style={{
            background: 'white',
            padding: '20px 40px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '30px'
        }}>
            {/* Логотип, який веде на головну */}
            <a href="/" style={{
                fontWeight: 'bold',
                fontSize: '24px',
                color: '#2c3e50',
                textDecoration: 'none'
            }}>
                EventPort
            </a>

            {/* Навігація */}
            <nav style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                {user ? (
                    // Стан, ЯКЩО КОРИСТУВАЧ ЗАЛОГІНЕНИЙ
                    <>
                        <span>Вітаємо, **{user.username}**!</span>

                        {/* Ось нове посилання, яке ми додаємо: */}
                        <a href="/create-event" style={{
                            color: '#27ae60',
                            fontWeight: 'bold',
                            textDecoration: 'none'
                        }}>
                            + Створити подію
                        </a>

                        <a href="/profile" style={{ color: '#3498db', textDecoration: 'none' }}>
                            Мій Профіль
                        </a>

                        {/* Ваша кнопка "Вийти" (скопіюйте її з вашого старого коду) */}
                        <button onClick={handleLogout} style={{
                            background: 'none',
                            border: '1px solid #e74c3c',
                            color: '#e74c3c',
                            padding: '8px 12px',
                            borderRadius: '6px'
                        }}>
                            Вийти
                        </button>
                    </>
                ) : (
                    // Стан, ЯКЩО КОРИСТУВАЧ - ГІСТЬ
                    <>
                        <a href="/login" style={{ color: '#3498db', textDecoration: 'none' }}>
                            Увійти
                        </a>
                        <a href="/register" style={{
                            background: '#3498db',
                            color: 'white',
                            padding: '8px 15px',
                            borderRadius: '6px',
                            textDecoration: 'none'
                        }}>
                            Реєстрація
                        </a>
                    </>
                )}
                {/* Показуємо іконку адмінки, тільки якщо це користувач 'Marian' */}
                {user && user.username === 'Marian' && (
                    <a href="/admin" style={{ color: '#7f8c8d', textDecoration: 'none' }}>
                        🛡️
                    </a>
                )}


            </nav>
        </header>
    );
}