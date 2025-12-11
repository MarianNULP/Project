"use client"; 

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import styles from './Header.module.css'; 

export default function Header() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isVisible, setIsVisible] = useState(true);
    const pathname = usePathname();

    useEffect(() => {
        const fetchLatestUserData = async () => {
            const jwt = localStorage.getItem('jwt');
            const storedUser = localStorage.getItem('user');
            
            if (jwt && storedUser) {
                // Спочатку показуємо те, що є в пам'яті (щоб було миттєво)
                setUser(JSON.parse(storedUser)); 
                
                try {
                    // Фоново оновлюємо дані
                    const res = await fetch('http://127.0.0.1:1337/api/users/me?populate=role', {
                        headers: { Authorization: `Bearer ${jwt}` }
                    });
                    
                    if (res.ok) {
                        const freshData = await res.json();
                        setUser(freshData);
                        localStorage.setItem('user', JSON.stringify(freshData));
                    }
                } catch (error) {
                    console.error("Помилка оновлення даних юзера:", error);
                }
            }
            setLoading(false); // 👈 2. Кажемо, що перевірка завершена
        };

        fetchLatestUserData();


        let lastScrollY = window.scrollY;

        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            
            // Якщо прокрутили більше 50px (щоб не реагувати на дрібні рухи)
            if (currentScrollY > 50) {
                if (currentScrollY > lastScrollY) {
                    // Скролимо ВНИЗ -> Ховаємо
                    setIsVisible(false);
                } else {
                    // Скролимо ВВЕРХ -> Показуємо
                    setIsVisible(true);
                }
            } else {
                // Якщо ми на самому верху -> Завжди показуємо
                setIsVisible(true);
            }

            lastScrollY = currentScrollY;
        };

        window.addEventListener('scroll', handleScroll);
        
        // Прибираємо слухач при виході зі сторінки
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('jwt');
        localStorage.removeItem('user');
        setUser(null);
        window.location.href = '/'; 
    };

    return (
        <header className={`${styles.header} ${!isVisible ? styles.hidden : ''}`}>
            
            <Link href="/" className={styles.logo}>
                🗓️ <span>Портал майбутніх подій</span>
            </Link>

            <nav className={styles.nav}>
                
                {/* 👇 3. ПОКИ ЗАВАНТАЖУЄТЬСЯ - НІЧОГО НЕ ПОКАЗУЄМО (або можна скелетон) */}
                {loading ? (
                    <div style={{width: '100px', height: '40px'}}></div> // Пусте місце, щоб не стрибало
                ) : (
                    <>
                        {user ? (
                            <>
                                <span className={styles.welcomeText}>
                                    Вітаємо, <strong className={styles.username}>{user.username}</strong>!
                                </span>

                                {pathname !== '/profile' && (
                                    <Link href="/profile" className={styles.profileBtn}>
                                        Мій Профіль
                                    </Link>
                                )}

                                <button onClick={handleLogout} className={styles.logoutBtn}>
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
                                <Link href="/login" className={styles.navLink}>
                                    Увійти
                                </Link>
                                <Link href="/register" className={styles.registerBtn}>
                                    Реєстрація
                                </Link>
                            </>
                        )}
                        
                        {user && user.username === 'Marian' && (
                            <a href=`${API_URL}/admin` target="_blank" rel="noopener noreferrer" className={styles.adminLink} title="Адмін-панель">
                                🛡️
                            </a>
                        )}
                    </>
                )}
            </nav>
        </header>
    );
}