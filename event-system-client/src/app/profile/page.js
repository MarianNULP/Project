"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import QRCode from "react-qr-code";

// 👇 ВАША IP АДРЕСА (Для доступу з телефону)
const API_URL = 'http://192.168.50.254:1337'; 
const SITE_URL = 'http://192.168.50.254:3000';

export default function ProfilePage() {
    // 1. ВСІ ХУКИ (useState) МАЮТЬ БУТИ ТУТ
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
    const [hoveredTooltip, setHoveredTooltip] = useState(null);
    const [selectedTicketForQR, setSelectedTicketForQR] = useState(null);

    const router = useRouter();

    // 2. ЕФЕКТ: Завантаження даних
    useEffect(() => {
        const fetchData = async () => {
            const jwt = localStorage.getItem('jwt');
            const storedUser = localStorage.getItem('user');

            if (!jwt || !storedUser) {
                router.push('/login');
                return;
            }

            try {
                // КРОК А: Оновлюємо дані користувача
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

                // КРОК Б: Завантажуємо квитки
                // 👇 ДОДАНО "&populate=event" ЩОБ ОТРИМАТИ НАЗВУ ПОДІЇ
                const regRes = await fetch(`${API_URL}/api/registrations?filters[user][id][$eq]=${currentUser.id}&populate=event`, {
                    headers: { 'Authorization': `Bearer ${jwt}` }
                });
                const regData = await regRes.json();
                setRegistrations(regData.data || []);

                // КРОК В: Якщо Організатор — завантажуємо події
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

    // --- ФУНКЦІЇ ОБРОБНИКИ ---

    const handleSettingsChange = (e) => {
        const { name, value } = e.target;
        setSettingsForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveSettings = async () => {
        setSaveStatus('saving');
        const jwt = localStorage.getItem('jwt');

        try {
            // 1. Оновлення профілю
            const updateRes = await fetch(`${API_URL}/api/users/${user.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${jwt}`
                },
                body: JSON.stringify({
                    city: settingsForm.city,
                    email: settingsForm.email
                })
            });

            if (!updateRes.ok) throw new Error('Помилка оновлення профілю');
            const updatedUser = await updateRes.json();

            // 2. Зміна пароля
            if (settingsForm.currentPassword && settingsForm.newPassword) {
                const passRes = await fetch(`${API_URL}/api/auth/change-password`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${jwt}`
                    },
                    body: JSON.stringify({
                        currentPassword: settingsForm.currentPassword,
                        password: settingsForm.newPassword,
                        passwordConfirmation: settingsForm.newPassword
                    })
                });

                if (!passRes.ok) {
                    const errorData = await passRes.json();
                    throw new Error(errorData.error?.message || 'Помилка зміни пароля');
                }
                setSettingsForm(prev => ({ ...prev, currentPassword: '', newPassword: '' }));
            }

            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
            setSaveStatus('success');
            setTimeout(() => setSaveStatus('idle'), 2000);

        } catch (err) {
            console.error(err);
            setSaveStatus('error');
            alert(`Помилка: ${err.message}`);
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

    const statusTranslations = {
        pending: 'Очікує підтвердження',
        approved: 'Підтверджено',
        rejected: 'Відхилено'
    };

    if (loading) return <main><p style={{ textAlign: 'center', marginTop: '50px' }}>Завантаження...</p></main>;
    if (!user) return null;

    const isOrganizer = user.role?.name === 'Organizer';

    const stats = myEvents.reduce((acc, event) => {
        const regs = event.registrations || [];
        const soldCount = regs.filter(r => r.approval_status === 'approved').length;
        acc.totalEvents += 1;
        acc.totalSold += soldCount;
        acc.totalRevenue += (event.price || 0) * soldCount;
        return acc;
    }, { totalEvents: 0, totalSold: 0, totalRevenue: 0 });

    return (
        <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
            <h1 style={{ textAlign: 'center', marginBottom: '30px', color: '#2c3e50' }}>
                {isOrganizer ? 'Кабінет організатора' : 'Мій профіль'}
            </h1>

            {/* БЛОК АНАЛІТИКИ */}
            {isOrganizer && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                    <div className="event-card" style={{ textAlign: 'center', background: '#e8f6f3', padding: '20px', borderRadius: '10px' }}>
                        <h3 style={{ fontSize: '1.8rem', color: '#16a085', margin: '0 0 10px 0' }}>{stats.totalRevenue} ₴</h3>
                        <p style={{ margin: 0, color: '#555' }}>Загальний дохід</p>
                    </div>
                    <div className="event-card" style={{ textAlign: 'center', background: '#fef9e7', padding: '20px', borderRadius: '10px' }}>
                        <h3 style={{ fontSize: '1.8rem', color: '#f39c12', margin: '0 0 10px 0' }}>{stats.totalSold}</h3>
                        <p style={{ margin: 0, color: '#555' }}>Квитків продано</p>
                    </div>
                    <div className="event-card" style={{ textAlign: 'center', background: '#fff', border: '1px solid #eee', padding: '20px', borderRadius: '10px' }}>
                        <h3 style={{ fontSize: '1.8rem', color: '#2c3e50', margin: '0 0 10px 0' }}>{stats.totalEvents}</h3>
                        <p style={{ margin: 0, color: '#555' }}>Моїх подій</p>
                    </div>
                </div>
            )}

            {!isOrganizer && (
                <div style={{ background: '#3498db', color: 'white', padding: '30px', borderRadius: '12px', textAlign: 'center', marginBottom: '40px' }}>
                    <h2>Бажаєте створювати власні події?</h2>
                    <p>Приєднуйтесь до нашої спільноти організаторів та продавайте квитки.</p>
                    <Link href="/become-organizer" style={{ display: 'inline-block', background: 'white', color: '#3498db', padding: '12px 25px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', marginTop: '10px' }}>
                        🚀 Стати організатором
                    </Link>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: isOrganizer ? '1fr 1fr' : '1fr', gap: '30px' }}>

                {/* КОЛОНКА 1: Квитки та Налаштування */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* Блок Квитків */}
                    <div className="event-card" style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                        <h2 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '15px' }}>🎟 Мої квитки</h2>
                        {registrations.length === 0 ? (
                            <p style={{ color: 'grey' }}>Ви ще не придбали жодного квитка.</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {registrations.map((reg) => (
                                    <div key={reg.id} style={{ padding: '15px', border: '1px solid #eee', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            {/* 👇 ТУТ ВИВОДИМО НАЗВУ ПОДІЇ ЯК ПОСИЛАННЯ */}
                                            {reg.event ? (
                                                <Link href={`/events/${reg.event.documentId}`} style={{textDecoration: 'none'}}>
                                                    <strong style={{ display: 'block', color: '#3498db', fontSize: '1.1rem' }}>
                                                        {reg.event.title}
                                                    </strong>
                                                </Link>
                                            ) : (
                                                <strong style={{ display: 'block', color: '#555' }}>
                                                    {reg.event_name || 'Подія видалена'}
                                                </strong>
                                            )}

                                            <span style={{ fontSize: '0.85rem', color: '#666', marginTop: '5px', display: 'block' }}>
                                                Статус: <span style={{ color: reg.approval_status === 'approved' ? 'green' : 'orange', fontWeight: 'bold' }}>
                                                    {statusTranslations[reg.approval_status] || reg.approval_status}
                                                </span>
                                            </span>
                                        </div>

                                        <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                                            <button
                                                onClick={() => setSelectedTicketForQR(reg)}
                                                style={{ background: '#3498db', border: 'none', color: 'white', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
                                            >
                                                📱 QR
                                            </button>

                                            <button onClick={() => cancelRegistration(reg.documentId)} style={{ background: '#fff1f0', border: '1px solid #ffa39e', color: '#e74c3c', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>
                                                Скасувати
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ⚙️ Блок Налаштувань */}
                    <div className="event-card" style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                        <h2 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>⚙️ Налаштування</h2>

                        <div style={{ marginBottom: '20px' }}>
                            <h4 style={{ margin: '0 0 10px 0', color: '#7f8c8d', fontSize: '0.9rem', textTransform: 'uppercase' }}>Особисті дані</h4>
                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Ваше місто</label>
                            <input
                                type="text"
                                name="city"
                                placeholder="Наприклад: Київ"
                                value={settingsForm.city}
                                onChange={handleSettingsChange}
                                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', marginBottom: '15px', boxSizing: 'border-box' }}
                            />
                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Email</label>
                            <input
                                type="email"
                                name="email"
                                value={settingsForm.email}
                                onChange={handleSettingsChange}
                                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', marginBottom: '15px', boxSizing: 'border-box' }}
                            />
                        </div>

                        <div style={{ marginBottom: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
                            <h4 style={{ margin: '0 0 10px 0', color: '#7f8c8d', fontSize: '0.9rem', textTransform: 'uppercase' }}>Зміна пароля</h4>
                            <p style={{ fontSize: '0.8rem', color: '#999', marginBottom: '10px' }}>Заповніть лише якщо хочете змінити пароль</p>
                            <input
                                type="password"
                                name="currentPassword"
                                placeholder="Поточний пароль"
                                value={settingsForm.currentPassword}
                                onChange={handleSettingsChange}
                                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', marginBottom: '10px', boxSizing: 'border-box' }}
                            />
                            <input
                                type="password"
                                name="newPassword"
                                placeholder="Новий пароль"
                                value={settingsForm.newPassword}
                                onChange={handleSettingsChange}
                                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' }}
                            />
                        </div>

                        <button
                            onClick={handleSaveSettings}
                            disabled={saveStatus === 'saving'}
                            style={{
                                width: '100%',
                                background: saveStatus === 'success' ? '#27ae60' : '#2ecc71',
                                border: 'none',
                                color: 'white',
                                padding: '12px',
                                borderRadius: '6px',
                                cursor: saveStatus === 'saving' ? 'not-allowed' : 'pointer',
                                fontWeight: 'bold',
                                fontSize: '1rem',
                                transition: 'background 0.3s'
                            }}
                        >
                            {saveStatus === 'saving' ? 'Збереження...' : saveStatus === 'success' ? '✅ Збережено!' : 'Зберегти зміни'}
                        </button>
                        {saveStatus === 'error' && <p style={{ color: 'red', textAlign: 'center', marginTop: '10px' }}>Щось пішло не так.</p>}
                    </div>
                </div>

                {/* КОЛОНКА 2: Створені події (Тільки для організаторів) */}
                {isOrganizer && (
                    <div className="event-card" style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', height: 'fit-content' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '10px', borderBottom: '1px solid #eee' }}>
                            <h2 style={{ margin: 0 }}>📢 Створені події</h2>
                            <Link href="/dashboard/create-event" style={{ background: '#3498db', color: 'white', padding: '8px 15px', borderRadius: '6px', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500' }}>
                                + Нова подія
                            </Link>
                        </div>

                        {myEvents.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px 0', color: '#95a5a6' }}>
                                <p>У вас поки немає створених подій.</p>
                                <Link href="/dashboard/create-event" style={{ color: '#3498db', fontWeight: 'bold' }}>Створити першу подію</Link>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {myEvents.map((evt) => (
                                    <div key={evt.id} style={{ padding: '15px', border: '1px solid #eee', borderRadius: '10px', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <strong style={{ fontSize: '1.1rem', color: '#2c3e50' }}>{evt.title}</strong>
                                            <p style={{ margin: '5px 0 0 0', fontSize: '0.85rem', color: '#7f8c8d' }}>ID: {evt.id}</p>
                                        </div>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <div style={{ position: 'relative' }}>
                                                <Link
                                                    href={`/events/${evt.documentId}/edit`}
                                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '35px', height: '35px', borderRadius: '50%', background: '#f0f9ff', color: '#3498db', border: '1px solid #d6eaf8', textDecoration: 'none' }}
                                                    onMouseEnter={() => setHoveredTooltip({ id: evt.id, type: 'edit' })}
                                                    onMouseLeave={() => setHoveredTooltip(null)}
                                                >
                                                    ✏️
                                                </Link>
                                                {hoveredTooltip?.id === evt.id && hoveredTooltip?.type === 'edit' && (
                                                    <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', background: '#333', color: '#fff', padding: '5px 8px', borderRadius: '4px', fontSize: '12px', marginBottom: '5px', whiteSpace: 'nowrap', zIndex: 10 }}>Редагувати</div>
                                                )}
                                            </div>

                                            <div style={{ position: 'relative' }}>
                                                <button
                                                    onClick={() => deleteEvent(evt.documentId)}
                                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '35px', height: '35px', borderRadius: '50%', background: '#fff1f0', color: '#e74c3c', border: '1px solid #ffa39e', cursor: 'pointer', padding: 0, flexShrink: 0 }}
                                                    onMouseEnter={() => setHoveredTooltip({ id: evt.id, type: 'delete' })}
                                                    onMouseLeave={() => setHoveredTooltip(null)}
                                                >
                                                    🗑
                                                </button>
                                                {hoveredTooltip?.id === evt.id && hoveredTooltip?.type === 'delete' && (
                                                    <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', background: '#e74c3c', color: '#fff', padding: '5px 8px', borderRadius: '4px', fontSize: '12px', marginBottom: '5px', whiteSpace: 'nowrap', zIndex: 10 }}>Видалити</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
            
            {/* МОДАЛЬНЕ ВІКНО ДЛЯ QR */}
            {selectedTicketForQR && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }} onClick={() => setSelectedTicketForQR(null)}>

                    <div style={{ background: 'white', padding: '30px', borderRadius: '20px', textAlign: 'center', maxWidth: '300px' }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ margin: '0 0 20px 0' }}>Ваш вхідний квиток</h3>
                        <div style={{ background: 'white', padding: '10px', display: 'inline-block' }}>
                            {/* 👇 ГЕНЕРАЦІЯ QR З ПРАВИЛЬНОЮ IP */}
                            <QRCode
                                value={`${SITE_URL}/verify/${selectedTicketForQR.documentId}`}
                                size={200}
                            />
                        </div>
                        <p style={{ fontSize: '0.9rem', color: '#555', marginTop: '15px' }}>
                            Покажіть цей код організатору на вході
                        </p>
                        <button
                            onClick={() => setSelectedTicketForQR(null)}
                            style={{ marginTop: '10px', padding: '10px 20px', background: '#333', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                        >
                            Закрити
                        </button>
                    </div>
                </div>
            )}
        </main>
    );
}