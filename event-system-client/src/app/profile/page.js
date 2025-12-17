"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import QRCode from "react-qr-code";
import styles from './page.module.css';
import { API_URL } from '@/utils/api';

export default function ProfilePage() {
    const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const [user, setUser] = useState(null);
    const [registrations, setRegistrations] = useState([]);
    const [myEvents, setMyEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    const [settingsForm, setSettingsForm] = useState({
        city: '',
        email: '',
        currentPassword: '',
        newPassword: ''
    });

    const [saveStatus, setSaveStatus] = useState('idle');
    const [selectedTicketForQR, setSelectedTicketForQR] = useState(null);
    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            const jwt = localStorage.getItem('jwt');
            const storedUser = localStorage.getItem('user');

            if (!jwt || !storedUser) {
                router.push('/login');
                return;
            }

            try {
                // Оновлюємо юзера
                const userRes = await fetch(`${API_URL}/api/users/me?populate=role`, {
                    headers: { Authorization: `Bearer ${jwt}` }
                });

                let currentUser = JSON.parse(storedUser);
                if (userRes.ok) {
                    currentUser = await userRes.json();
                    localStorage.setItem('user', JSON.stringify(currentUser));
                }

                setUser(currentUser);
                setSettingsForm(prev => ({
                    ...prev,
                    city: currentUser.city || '',
                    email: currentUser.email || ''
                }));

                // Завантажуємо квитки
                const regRes = await fetch(`${API_URL}/api/registrations?filters[user][id][$eq]=${currentUser.id}&populate=event`, {
                    headers: { 'Authorization': `Bearer ${jwt}` }
                });
                const regData = await regRes.json();
                setRegistrations(regData.data || []);

                // Якщо Організатор — завантажуємо події
                if (currentUser.role?.name === 'Organizer') {
                    const eventsRes = await fetch(
                        `${API_URL}/api/events?filters[organizer][id][$eq]=${currentUser.id}&populate=*`,
                        { headers: { 'Authorization': `Bearer ${jwt}` } }
                    );
                    const eventsData = await eventsRes.json();
                    setMyEvents(eventsData.data || []);
                }

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [router]);

    const handleSettingsChange = (e) => {
        const { name, value } = e.target;
        setSettingsForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveSettings = async () => {
        setSaveStatus('saving');
        const jwt = localStorage.getItem('jwt');

        try {
            // Оновлення профілю
            const updateRes = await fetch(`${API_URL}/api/users/${user.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwt}` },
                body: JSON.stringify({ city: settingsForm.city, email: settingsForm.email })
            });
            if (!updateRes.ok) throw new Error('Помилка оновлення');
            const updatedUser = await updateRes.json();

            // Зміна пароля
            if (settingsForm.currentPassword && settingsForm.newPassword) {
                const passRes = await fetch(`${API_URL}/api/auth/change-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwt}` },
                    body: JSON.stringify({
                        currentPassword: settingsForm.currentPassword,
                        password: settingsForm.newPassword,
                        passwordConfirmation: settingsForm.newPassword
                    })
                });
                if (!passRes.ok) throw new Error('Помилка зміни пароля');
                setSettingsForm(prev => ({ ...prev, currentPassword: '', newPassword: '' }));
            }

            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
            setSaveStatus('success');
            setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (err) {
            setSaveStatus('error');
            alert(err.message);
        }
    };

    const cancelRegistration = async (docId) => {
        if (!confirm('Скасувати реєстрацію?')) return;
        const jwt = localStorage.getItem('jwt');
        try {
            await fetch(`${API_URL}/api/registrations/${docId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${jwt}` }
            });
            setRegistrations(prev => prev.filter(reg => reg.documentId !== docId));
        } catch (err) { alert(err.message); }
    };

    const deleteEvent = async (docId) => {
        if (!confirm('Видалити подію назавжди?')) return;
        const jwt = localStorage.getItem('jwt');
        try {
            await fetch(`${API_URL}/api/events/${docId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${jwt}` }
            });
            setMyEvents(prev => prev.filter(evt => evt.documentId !== docId));
        } catch (err) { alert(err.message); }
    };

    if (loading) return <div style={{textAlign: 'center', marginTop: 100, color: 'white'}}>Завантаження профілю...</div>;
    if (!user) return null;

    const isOrganizer = user.role?.name === 'Organizer';

    // Розрахунок статистики
    const stats = myEvents.reduce((acc, event) => {
        const regs = event.registrations || [];
        const soldCount = regs.filter(r => r.approval_status === 'approved').length;
        acc.totalEvents += 1;
        acc.totalSold += soldCount;
        acc.totalRevenue += (event.price || 0) * soldCount;
        return acc;
    }, { totalEvents: 0, totalSold: 0, totalRevenue: 0 });

    return (
        <main className={styles.container}>
            <h1 className={styles.pageTitle}>
                {isOrganizer ? 'Кабінет організатора 🚀' : 'Мій профіль 👤'}
            </h1>

            {/* БЛОК АНАЛІТИКИ (Тільки Organizer) */}
            {isOrganizer && (
                <div className={styles.statsGrid}>
                    <div className={`${styles.statCard} ${styles.money}`}>
                        <div className={styles.statValue}>{stats.totalRevenue} ₴</div>
                        <p className={styles.statLabel}>Загальний дохід</p>
                    </div>
                    <div className={`${styles.statCard} ${styles.sold}`}>
                        <div className={styles.statValue}>{stats.totalSold}</div>
                        <p className={styles.statLabel}>Квитків продано</p>
                    </div>
                    <div className={`${styles.statCard} ${styles.count}`}>
                        <div className={styles.statValue}>{stats.totalEvents}</div>
                        <p className={styles.statLabel}>Активних подій</p>
                    </div>
                </div>
            )}

            {/* БАНЕР ДЛЯ ЗВИЧАЙНИХ ЮЗЕРІВ */}
            {!isOrganizer && (
                <div className={styles.glassCard} style={{ textAlign: 'center', marginBottom: 40, background: 'rgba(52, 152, 219, 0.1)', border: '1px solid #3498db' }}>
                    <h2 style={{color: '#fff', marginTop: 0}}>Бажаєте створювати власні події?</h2>
                    <p style={{color: '#ddd', marginBottom: 20}}>Отримайте можливості організатора та почніть продавати квитки.</p>
                    <Link href="/become-organizer" style={{ background: '#3498db', color: 'white', padding: '12px 30px', borderRadius: '30px', textDecoration: 'none', fontWeight: 'bold'}}>
                        🚀 Стати організатором
                    </Link>
                </div>
            )}

            <div className={`${styles.mainGrid} ${!isOrganizer ? styles.singleColumn : ''}`}>
                
                {/* ЛІВА КОЛОНКА: Квитки та Налаштування */}
                <div className={styles.column}>
                    
                    {/* МОЇ КВИТКИ */}
                    <div className={styles.glassCard}>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}>🎟 Мої квитки</h2>
                        </div>
                        
                        {registrations.length === 0 ? (
                            <p style={{color: '#666', textAlign: 'center', padding: 20}}>Квитків поки немає 😔</p>
                        ) : (
                            <div className={styles.ticketList}>
                                {registrations.map(reg => (
                                    <div key={reg.id} className={styles.ticketItem}>
                                        <div className={styles.ticketInfo}>
                                            {reg.event ? (
                                                <Link href={`/events/${reg.event.documentId}`} style={{textDecoration: 'none'}}>
                                                    <h4>{reg.event.title}</h4>
                                                </Link>
                                            ) : (
                                                <h4>Подія видалена</h4>
                                            )}
                                            <div className={styles.ticketMeta}>
                                                Статус: 
                                                <span className={`${styles.status} ${styles[reg.approval_status] || ''}`}>
                                                    {reg.approval_status === 'approved' ? 'Активний' : reg.approval_status}
                                                </span>
                                            </div>
                                        </div>
                                        <div className={styles.ticketActions}>
                                            <button onClick={() => setSelectedTicketForQR(reg)} className={`${styles.iconBtn} ${styles.qrBtn}`} title="Показати QR">
                                                📱
                                            </button>
                                            <button onClick={() => cancelRegistration(reg.documentId)} className={`${styles.iconBtn} ${styles.deleteBtn}`} title="Скасувати">
                                                ✖
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* НАЛАШТУВАННЯ */}
                    <div className={styles.glassCard}>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}>⚙️ Налаштування</h2>
                        </div>
                        
                        <div className={styles.settingsForm}>
                            <div className={styles.sectionTitle}>Особисті дані</div>
                            <label>Ваше місто</label>
                            <input className={styles.input} type="text" name="city" value={settingsForm.city} onChange={handleSettingsChange} placeholder="Київ" />
                            
                            <label>Email</label>
                            <input className={styles.input} type="email" name="email" value={settingsForm.email} onChange={handleSettingsChange} />

                            <div className={styles.sectionTitle}>Безпека</div>
                            <label>Поточний пароль</label>
                            <input className={styles.input} type="password" name="currentPassword" value={settingsForm.currentPassword} onChange={handleSettingsChange}/>
                            
                            <label>Новий пароль</label>
                            <input className={styles.input} type="password" name="newPassword" value={settingsForm.newPassword} onChange={handleSettingsChange}/>

                            <button onClick={handleSaveSettings} disabled={saveStatus === 'saving'} className={styles.saveBtn}>
                                {saveStatus === 'saving' ? 'Збереження...' : saveStatus === 'success' ? '✅ Збережено!' : 'Зберегти зміни'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* ПРАВА КОЛОНКА: Події (тільки для Організатора) */}
                {isOrganizer && (
                    <div className={styles.column}>
                        <div className={styles.glassCard}>
                            <div className={styles.cardHeader}>
                                <h2 className={styles.cardTitle}>📢 Мої події</h2>
                                <Link href="/dashboard/create-event" style={{background: '#e0f2fe', color: '#0284c7', padding: '8px 16px', borderRadius: '20px', textDecoration: 'none', fontWeight: '700', fontSize: '0.9rem'}}>
                                    + Створити
                                </Link>
                            </div>

                            {myEvents.length === 0 ? (
                                <p style={{textAlign: 'center', color: '#666', padding: 20}}>Ви ще не створили подій.</p>
                            ) : (
                                <div className={styles.ticketList}>
                                    {myEvents.map(evt => (
                                        <div key={evt.id} className={styles.ticketItem}>
                                            <div className={styles.ticketInfo}>
                                                <h4>{evt.title}</h4>
                                                <div className={styles.ticketMeta}>ID: {evt.id}</div>
                                            </div>
                                            <div className={styles.ticketActions}>
                                                <Link href={`/events/${evt.documentId}/edit`} className={`${styles.iconBtn} ${styles.editBtn}`} title="Редагувати">
                                                    ✏️
                                                </Link>
                                                <button onClick={() => deleteEvent(evt.documentId)} className={`${styles.iconBtn} ${styles.deleteBtn}`} title="Видалити">
                                                    🗑
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

            </div>

            {/* МОДАЛКА QR */}
            {selectedTicketForQR && (
                <div className={styles.modalOverlay} onClick={() => setSelectedTicketForQR(null)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <h3 style={{color: '#333', marginTop: 0}}>Ваш квиток 🎫</h3>
                        <div style={{background: 'white', padding: 10, display: 'inline-block', borderRadius: 10}}>
                            <QRCode
                                value={`${siteUrl}/verify/${selectedTicketForQR.documentId}`}
                                size={200}
                            />
                        </div>
                        <p style={{color: '#666', fontSize: '0.9rem', marginTop: 15}}>Покажіть на вході</p>
                        <button onClick={() => setSelectedTicketForQR(null)} style={{marginTop: 10, background: '#333', color: 'white', border: 'none', padding: '10px 30px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold'}}>
                            Закрити
                        </button>
                    </div>
                </div>
            )}
        </main>
    );
}