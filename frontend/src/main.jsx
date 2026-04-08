import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import { useStore } from './store';
import BottomNav from './components/BottomNav';
import Onboarding from './pages/Onboarding';
import Tags from './pages/Tags';
import Experiments from './pages/Experiments';
import Resonance from './pages/Resonance';
import Words from './pages/Words';
import River from './pages/River';

function App() {
  const init = useStore(s => s.init);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    init().catch(() => {}).finally(() => setReady(true));
  }, []);

  const hasOnboarded = localStorage.getItem('onboarded');

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

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/tags" element={<><Tags /><BottomNav /></>} />
        <Route path="/experiments" element={<><Experiments /><BottomNav /></>} />
        <Route path="/resonance" element={<><Resonance /><BottomNav /></>} />
        <Route path="/words" element={<><Words /><BottomNav /></>} />
        <Route path="/river" element={<><River /><BottomNav /></>} />
        <Route path="*" element={<Navigate to={hasOnboarded ? '/tags' : '/onboarding'} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
