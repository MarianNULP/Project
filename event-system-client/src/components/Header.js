"use client"; 

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link'; // Краще використовувати Link замість a href для швидкості

export default function Header() {
    const [user, setUser] = useState(null);
    const pathname = usePathname();

    useEffect(() => {
        const fetchLatestUserData = async () => {
            const jwt = localStorage.getItem('jwt');
            const storedUser = localStorage.getItem('user');
            
            if (jwt && storedUser) {
                try {
                    const res = await fetch('http://127.0.0.1:1337/api/users/me?populate=role', {
                        headers: { Authorization: `Bearer ${jwt}` }
                    });
                    
                    if (res.ok) {
                        const freshData = await res.json();
                        setUser(freshData);
                        localStorage.setItem('user', JSON.stringify(freshData));
                    } else {
                        setUser(JSON.parse(storedUser));
                    }
                } catch (error) {
                    console.error("Помилка оновлення даних юзера:", error);
                    setUser(JSON.parse(storedUser));
                }
            }
        };

        fetchLatestUserData();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('jwt');
        localStorage.removeItem('user');
        setUser(null);
        window.location.href = '/'; 
    };

    return (
        <header style={{
            /* 🔥 GLASSMORPHISM (ПРОЗОРИЙ ФОН) */
            background: 'rgba(255, 255, 255, 0.1)', 
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
            
            padding: '20px 40px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0' /* Прибираємо відступ, бо в EventList він є */
        }}>
            {/* ТЕКСТ ТЕПЕР БІЛИЙ */}
            <Link href="/" style={{
                fontWeight: '800', 
                fontSize: '1.5rem', 
                color: 'white', 
                textDecoration: 'none',
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px',
                textShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}>
                🗓️ Портал майбутніх подій
            </Link>

            <nav style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                {user ? (
                    <>
                        <span style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
                            Вітаємо, <strong>{user.username}</strong>!
                        </span>

                        {pathname !== '/profile' && (
                            <Link href="/profile" style={{ 
                                color: 'white', 
                                textDecoration: 'none', 
                                fontWeight: '600',
                                padding: '8px 16px',
                                background: 'rgba(255,255,255,0.2)',
                                borderRadius: '8px'
                            }}>
                                Мій Профіль
                            </Link>
                        )}

                        <button onClick={handleLogout} style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            background: 'rgba(255, 255, 255, 0.9)', // Біла кнопка
                            border: 'none',
                            color: '#e74c3c', // Червоний текст
                            padding: '8px 16px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            transition: 'transform 0.2s'
                        }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                <polyline points="16 17 21 12 16 7"></polyline>
                                <line x1="21" y1="12" x2="9" y2="12"></line>
                            </svg>
                            Вийти
                        </button>
                    </>
                ) : (
                    <>
                        <Link href="/login" style={{ color: 'white', textDecoration: 'none', fontWeight: 600 }}>Увійти</Link>
                        <Link href="/register" style={{
                            background: 'white', color: '#333', padding: '10px 20px',
                            borderRadius: '30px', textDecoration: 'none', fontWeight: 'bold'
                        }}>
                            Реєстрація
                        </Link>
                    </>
                )}
                
                {user && user.username === 'Marian' && (
                    <a href="http://192.168.50.254:1337/admin" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', fontSize: '24px' }} title="Адмін-панель">
                        🛡️
                    </a>
                )}
            </nav>
        </header>
    );
}