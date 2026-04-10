import { useState, useEffect } from 'react';
import { supabase } from '../api/supabase.js';
import { randomName } from '../api/storage.js';

export default function Auth({ onSuccess }) {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const userId = session.user.id;
        const { data: existing } = await supabase.from('users').select('id').eq('id', userId).single();
        if (!existing) {
          await supabase.from('users').insert({ id: userId, anon_name: randomName() });
        }
        onSuccess(session.user);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function sendMagicLink() {
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true }
    });
    if (error) {
      setError('发送失败，请检查邮箱格式');
    } else {
      setStep('sent');
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

      {step === 'email' ? (
        <div style={{ width: '100%', maxWidth: 320 }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>邮箱登录</p>
          <input
            type="email"
            placeholder="输入你的邮箱"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{ marginBottom: 16 }}
            onKeyDown={e => e.key === 'Enter' && sendMagicLink()}
            autoFocus
          />
          {error && <p style={{ fontSize: 12, color: '#e57373', marginBottom: 12 }}>{error}</p>}
          <button
            className="btn-primary"
            style={{ width: '100%' }}
            disabled={!email.includes('@') || loading}
            onClick={sendMagicLink}
          >
            {loading ? '发送中…' : '发送登录链接'}
          </button>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 16, textAlign: 'center', lineHeight: 1.8 }}>
            我们会发一封邮件到你的邮箱<br />点击邮件里的链接即可登录，无需密码
          </p>
        </div>
      ) : (
        <div style={{ width: '100%', maxWidth: 320, textAlign: 'center' }}>
          <p style={{ fontSize: 32, marginBottom: 20 }}>📬</p>
          <p style={{ fontSize: 15, color: 'var(--text-primary)', marginBottom: 8 }}>邮件已发送</p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.8, marginBottom: 24 }}>
            请查收 <strong>{email}</strong> 的邮件<br />
            点击邮件中的链接完成登录
          </p>
          <button className="btn-ghost" style={{ fontSize: 13 }}
            onClick={() => { setStep('email'); setError(''); }}>
            换一个邮箱
          </button>
        </div>
      )}
    </div>
  );
}
