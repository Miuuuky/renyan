import { useState } from 'react';
import { supabase } from '../api/supabase.js';

export default function Auth({ onSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('login'); // login | register
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    if (!email.trim() || !password.trim()) return;
    if (password.length < 6) { setError('密码至少6位'); return; }
    setLoading(true);
    setError('');

    if (mode === 'register') {
      const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
      if (error) { setError(error.message === 'User already registered' ? '该邮箱已注册，请直接登录' : '注册失败，请重试'); setLoading(false); return; }
      // 创建用户记录
      if (data.user) {
        const { randomName } = await import('../api/storage.js');
        await supabase.from('users').insert({ id: data.user.id, anon_name: randomName() });
        onSuccess(data.user);
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) { setError('邮箱或密码错误'); setLoading(false); return; }
      onSuccess(data.user);
    }
    setLoading(false);
  }

  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: 40
    }}>
      <h2 style={{ fontSize: 24, fontWeight: 500, marginBottom: 8 }}>人言</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 48, textAlign: 'center', lineHeight: 1.8 }}>
        让人的复杂性，得以被看见
      </p>

      <div style={{ width: '100%', maxWidth: 320 }}>
        {/* 切换登录/注册 */}
        <div style={{ display: 'flex', marginBottom: 24, borderBottom: '1px solid var(--border)' }}>
          {[['login', '登录'], ['register', '注册']].map(([val, label]) => (
            <button key={val} onClick={() => { setMode(val); setError(''); }}
              style={{
                flex: 1, padding: '8px', fontSize: 14,
                color: mode === val ? 'var(--accent)' : 'var(--text-muted)',
                borderBottom: mode === val ? '2px solid var(--accent)' : '2px solid transparent',
                marginBottom: -1
              }}>
              {label}
            </button>
          ))}
        </div>

        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>邮箱</p>
        <input
          type="email"
          placeholder="输入邮箱"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{ marginBottom: 12 }}
          autoFocus
        />

        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>密码</p>
        <input
          type="password"
          placeholder={mode === 'register' ? '设置密码（至少6位）' : '输入密码'}
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{ marginBottom: 16 }}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        />

        {error && <p style={{ fontSize: 12, color: '#e57373', marginBottom: 12 }}>{error}</p>}

        <button
          className="btn-primary"
          style={{ width: '100%' }}
          disabled={!email.includes('@') || password.length < 6 || loading}
          onClick={handleSubmit}
        >
          {loading ? '处理中…' : mode === 'login' ? '登录' : '注册'}
        </button>

        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 16, textAlign: 'center' }}>
          登录后系统会为你分配一个匿名名称
        </p>
      </div>
    </div>
  );
}
