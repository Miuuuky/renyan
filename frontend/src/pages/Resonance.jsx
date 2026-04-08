import { useState, useEffect, useRef } from 'react';
import { resonanceApi } from '../api/index.js';

function RippleButton({ postId, count, onResonate }) {
  const [ripples, setRipples] = useState([]);
  const [showFeeling, setShowFeeling] = useState(false);
  const [feeling, setFeeling] = useState('');

  function triggerRipple(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    setRipples(prev => [...prev, { id, x, y }]);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 700);
    setShowFeeling(true);
  }

  async function submit() {
    await onResonate(feeling.trim() || null);
    setShowFeeling(false);
    setFeeling('');
  }

  return (
    <div>
      <button
        onClick={triggerRipple}
        style={{
          position: 'relative',
          overflow: 'hidden',
          color: 'var(--text-muted)',
          fontSize: 13,
          padding: '6px 0',
          display: 'flex',
          alignItems: 'center',
          gap: 6
        }}
      >
        {ripples.map(r => (
          <span
            key={r.id}
            className="ripple-effect"
            style={{ width: 20, height: 20, left: r.x - 10, top: r.y - 10 }}
          />
        ))}
        <span>我也有过</span>
        {count > 0 && (
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>· {count}</span>
        )}
      </button>

      {showFeeling && (
        <div style={{ marginTop: 10 }}>
          <input
            placeholder="留下你的类似感受（可跳过）"
            value={feeling}
            onChange={e => setFeeling(e.target.value)}
            style={{ marginBottom: 8 }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-ghost" onClick={submit}>留下</button>
            <button className="btn-ghost" onClick={() => setShowFeeling(false)}>跳过</button>
          </div>
        </div>
      )}
    </div>
  );
}

function PerspectiveButton({ postId }) {
  const [perspective, setPerspective] = useState(null);
  const [loading, setLoading] = useState(false);
  const [contributing, setContributing] = useState(false);
  const [input, setInput] = useState('');

  async function load() {
    setLoading(true);
    try {
      const { data } = await resonanceApi.getPerspective(postId);
      setPerspective(data.content);
    } finally {
      setLoading(false);
    }
  }

  async function contribute() {
    if (!input.trim()) return;
    await resonanceApi.addPerspective(postId, input.trim());
    setContributing(false);
    setInput('');
  }

  return (
    <div>
      <button
        className="btn-ghost"
        style={{ fontSize: 13 }}
        onClick={load}
        disabled={loading}
      >
        {loading ? '…' : '换个视角'}
      </button>

      {perspective && (
        <div style={{
          marginTop: 12,
          padding: '12px 14px',
          background: 'var(--tag-bg)',
          borderRadius: 'var(--radius-sm)',
          fontSize: 13,
          color: 'var(--text-secondary)',
          lineHeight: 1.7
        }}>
          {perspective}
          <div style={{ marginTop: 10 }}>
            {contributing ? (
              <div>
                <input
                  placeholder="你的视角…"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  style={{ marginBottom: 8 }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn-ghost" onClick={contribute}>提交</button>
                  <button className="btn-ghost" onClick={() => setContributing(false)}>取消</button>
                </div>
              </div>
            ) : (
              <button
                style={{ fontSize: 11, color: 'var(--text-muted)' }}
                onClick={() => setContributing(true)}
              >
                + 留下我的视角
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Resonance() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await resonanceApi.list();
    setPosts(data);
    setLoading(false);
  }

  async function publish() {
    if (!draft.trim()) return;
    setSubmitting(true);
    try {
      const { data } = await resonanceApi.post(draft.trim());
      setPosts(prev => [data, ...prev]);
      setDraft('');
      setComposing(false);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResonate(postId, feeling) {
    const { data } = await resonanceApi.resonate(postId, feeling);
    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, resonance_count: data.resonance_count } : p
    ));
  }

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 500 }}>共振厅</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
            只说自己的感受，不评价对方。
          </p>
        </div>
        <button className="btn-ghost" onClick={() => setComposing(true)}>写一段</button>
      </div>

      {composing && (
        <div className="card" style={{ marginBottom: 24 }}>
          <textarea
            rows={4}
            placeholder="描述你的感受，不提对方的对错…"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            style={{ marginBottom: 12 }}
            autoFocus
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-primary" disabled={!draft.trim() || submitting} onClick={publish}>
              {submitting ? '发布中…' : '发布'}
            </button>
            <button className="btn-ghost" onClick={() => setComposing(false)}>取消</button>
          </div>
        </div>
      )}

      {loading && <div className="loading">加载中…</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {posts.map(post => (
          <div key={post.id} className="card">
            <p style={{ fontSize: 15, lineHeight: 1.8, marginBottom: 16 }}>{post.content}</p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16 }}>
              {post.anon_name} · {new Date(post.created_at).toLocaleDateString('zh-CN')}
            </p>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <RippleButton
                postId={post.id}
                count={post.resonance_count}
                onResonate={(feeling) => handleResonate(post.id, feeling)}
              />
              <PerspectiveButton postId={post.id} />
            </div>
          </div>
        ))}
      </div>

      {!loading && posts.length === 0 && (
        <div className="empty">还没有人分享<br />成为第一个</div>
      )}
    </div>
  );
}
