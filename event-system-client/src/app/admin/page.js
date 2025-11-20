"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Імпортуємо хук для перенаправлення

export default function AdminPanel() {
  const [registrations, setRegistrations] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState([]);
  const stopSignal = useRef(false);

  // 👇 СТАН ДЛЯ АВТОРИЗАЦІЇ
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Показуємо завантаження
  const router = useRouter(); // Отримуємо роутер

  // 👇 ЕФЕКТ, ЯКИЙ ПЕРЕВІРЯЄ КОРИСТУВАЧА ПРИ ЗАВАНТАЖЕННІ
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      
      if (user.username === 'Marian') {
        // Все добре, це ви
        setIsAuthorized(true);
        fetchRegistrations(); // Починаємо завантажувати дані
      } else {
        // Це інший залогінений користувач. Викидаємо його.
        router.push('/');
      }
    } else {
      // Це взагалі гість. Викидаємо його.
      router.push('/login'); // Або на логін
    }
    setIsLoading(false);
  }, [router]); // Додаємо router в залежності

  const addLog = (msg) => setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 15));

  // 1. ЗАВАНТАЖЕННЯ ДАНИХ
  async function fetchRegistrations() {
    try {
      const res = await fetch('http://localhost:1337/api/registrations');
      const data = await res.json();
      
      const formatted = data.data.map(item => ({
        id: item.id,
        documentId: item.documentId,
        participant_name: item.participant_name,
        participant_email: item.participant_email,
        event_name: item.event_name,
        // 👇 ТУТ ЗМІНА: читаємо поле approval_status
        approval_status: item.approval_status || 'pending' 
      }));
      
      setRegistrations(formatted);
    } catch (e) {
      console.error("Помилка завантаження:", e);
      addLog("❌ Помилка з'єднання з сервером");
    }
  }

  useEffect(() => {
    fetchRegistrations();
  }, []);

  // 2. ОНОВЛЕННЯ НА СЕРВЕРІ
  const updateStatusOnServer = async (documentId, newStatus) => {
    await fetch(`http://localhost:1337/api/registrations/${documentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // 👇 ТУТ ЗМІНА: записуємо в поле approval_status
        data: { approval_status: newStatus } 
      })
    });
  };

  // --- ЛОГІКА ПОТОКУ ---
  const processNext = async (workerId) => {
    if (stopSignal.current) return;

    let targetId = null;
    let targetDocId = null;

    // Шукаємо заявку 'pending'
    setRegistrations(prev => {
      // 👇 ТУТ ЗМІНА: перевіряємо approval_status
      const item = prev.find(r => r.approval_status === 'pending');
      if (item) {
        targetId = item.id;
        targetDocId = item.documentId;
        // Ставимо тимчасовий статус processing
        return prev.map(r => r.id === item.id ? { ...r, approval_status: 'processing' } : r);
      }
      return prev;
    });

    if (!targetId) return;

    try {
      const delay = Math.random() * 2000 + 500;
      await new Promise(resolve => setTimeout(resolve, delay));

      if (stopSignal.current) {
        // Якщо стоп - повертаємо pending (тільки локально)
        setRegistrations(prev => prev.map(r => r.id === targetId ? { ...r, approval_status: 'pending' } : r));
        return;
      }

      const decision = Math.random() > 0.3 ? 'approved' : 'rejected';
      
      // Оновлюємо на сервері
      await updateStatusOnServer(targetDocId, decision);

      // Оновлюємо локально
      setRegistrations(prev => prev.map(r => r.id === targetId ? { ...r, approval_status: decision } : r));
      
      addLog(`🔧 Потік #${workerId}: Заявка ID:${targetId} -> ${decision === 'approved' ? '✅' : '❌'}`);

      await processNext(workerId);

    } catch (e) {
      console.error(e);
      addLog(`❌ Помилка у потоці #${workerId}`);
    }
  };

  const startProcessing = () => {
    if (isProcessing) return;
    stopSignal.current = false;
    setIsProcessing(true);
    addLog("🚀 ЗАПУСК: 10 потоків починають обробку бази даних...");

    for (let i = 1; i <= 10; i++) {
      processNext(i);
    }
  };

  const stopProcessing = () => {
    stopSignal.current = true;
    setIsProcessing(false);
    addLog("🛑 СТОП. Зупинка всіх процесів.");
  };

  const refreshData = () => {
    addLog("🔄 Оновлення списку з сервера...");
    fetchRegistrations();
  };

  if (isLoading) {
    return (
      <main style={{ textAlign: 'center', padding: '50px' }}>
        <h2>Перевірка доступу...</h2>
      </main>
    );
  }

  if (!isAuthorized) {
    // Цей екран користувач майже не побачить, бо роутер вже перенаправить його
    return (
      <main style={{ textAlign: 'center', padding: '50px' }}>
        <h2>❌ Доступ заборонено</h2>
        <p>Вас буде перенаправлено.</p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
         <h1 style={{ margin: 0 }}>🛡️ Панель Адміністратора</h1>
         <button onClick={refreshData} style={{ padding: '10px', cursor: 'pointer' }}>🔄 Оновити дані</button>
      </div>

      <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '12px', marginBottom: '30px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <button 
          onClick={startProcessing} 
          disabled={isProcessing}
          style={{ background: isProcessing ? '#ccc' : '#27ae60', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer' }}
        >
          ▶ Обробити заявки (10 потоків)
        </button>
        <button 
          onClick={stopProcessing} 
          disabled={!isProcessing}
          style={{ background: !isProcessing ? '#ccc' : '#c0392b', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer' }}
        >
          ⏹ СТОП
        </button>
      </div>

      <div style={{ display: 'grid', gap: '10px' }}>
        {registrations.length === 0 ? <p>Заявок поки немає...</p> : null}
        
        {registrations.map(reg => (
          <div key={reg.id} style={{ 
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '15px', 
            background: 'white',
            borderLeft: `5px solid ${
              reg.approval_status === 'pending' ? '#95a5a6' :
              reg.approval_status === 'processing' ? '#f1c40f' :
              reg.approval_status === 'approved' ? '#2ecc71' : '#e74c3c'
            }`,
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}>
            <div>
              <strong>{reg.participant_name}</strong> <span style={{ color: 'grey' }}>({reg.participant_email})</span>
              <br/>
              <small>Подія: {reg.event_name}</small>
            </div>
            <div style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '12px' }}>
              {/* Відображаємо статус */}
              {reg.approval_status}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '30px', background: '#2c3e50', color: '#ecf0f1', padding: '15px', borderRadius: '8px', fontFamily: 'monospace', maxHeight: '200px', overflowY: 'auto' }}>
        {logs.map((log, i) => <div key={i}>{log}</div>)}
      </div>
    </main>
  );
}