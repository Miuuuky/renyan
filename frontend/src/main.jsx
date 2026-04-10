import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import { supabase } from './api/supabase.js';
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
    // 检查已有登录状态
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      setReady(true);
    });
    // 监听登录状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
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
