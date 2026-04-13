import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import { supabase } from './api/supabase.js';
import { setCurrentUser } from './api/index.js';
import BottomNav from './components/BottomNav';
import Auth from './pages/Auth';
import Onboarding from './pages/Onboarding';
import Lab from './pages/Lab';
import Resonance from './pages/Resonance';
import Words from './pages/Words';
import Mine from './pages/Mine';

function App() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // 先处理URL里的token（邮件链接跳转）
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { data: userData } = await supabase.from('users').select('anon_name').eq('id', session.user.id).single();
        setCurrentUser(session.user.id, userData?.anon_name);
      }
      setUser(session?.user || null);
      setReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: userData } = await supabase.from('users').select('anon_name').eq('id', session.user.id).single();
        setCurrentUser(session.user.id, userData?.anon_name);
        // 新用户自动创建
        if (event === 'SIGNED_IN') {
          const { data: existing } = await supabase.from('users').select('id').eq('id', session.user.id).single();
          if (!existing) {
            const { randomName } = await import('./api/storage.js');
            await supabase.from('users').insert({ id: session.user.id, anon_name: randomName() });
          }
        }
      }
      setUser(session?.user || null);
      if (!ready) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (!ready) {
    return (
      <div style={{
        height: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        color: '#b8b5af', fontSize: 14
      }}>
        人言
      </div>
    );
  }

  if (!user) {
    return <Auth onSuccess={setUser} />;
  }

  const hasOnboarded = localStorage.getItem('renyan_onboarded_' + user.id);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/onboarding" element={<Onboarding userId={user.id} />} />
        <Route path="/lab" element={<><Lab userId={user.id} /><BottomNav /></>} />
        <Route path="/resonance" element={<><Resonance userId={user.id} /><BottomNav /></>} />
        <Route path="/words" element={<><Words userId={user.id} /><BottomNav /></>} />
        <Route path="/mine" element={<><Mine userId={user.id} /><BottomNav /></>} />
        <Route path="*" element={<Navigate to={hasOnboarded ? '/lab' : '/onboarding'} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
