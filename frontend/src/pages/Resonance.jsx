import { useState, useEffect } from 'react';
import { resonanceApi } from '../api/index.js';

// ---- 详情页 ----
function PostDetail({ post, onBack }) {
  const [perspective, setPerspective] = useState(null);
  const [loadingP, setLoadingP] = useState(false);
  const [contributing, setContributing] = useState(false);
  const [pInput, setPInput] = useState('');
  const [resonated, setResonated] = useState(false);
  const [myFeeling, setMyFeeling] = useState('');
  const [feeling, setFeeling] = useState('');
  const [showFeelingInput, setShowFeelingInput] = useState(false);
  const [count, setCount] = useState(post.resonance_count || 0);

  async function handleResonate() {
    if (resonated) return;
    setShowFeelingInput(true);
  }

  async function submitResonate() {
    const { data } = await resonanceApi.resonate(post.id, feeling.trim() || null);
    setCount(data.resonance_count);
    setMyFeeling(feeling.trim());
    setResonated(true);
    setShowFeelingInput(false);
    setFeeling('');
  }

  async function loadPerspective() {
    setLoadingP(true);
    const { data } = await resonanceApi.getPerspective(post.id);
    setPerspective(data.content);
    setLoadingP(false);
  }

  async function submitPerspective() {
    if (!pInput.trim()) return;
    await resonanceApi.addPerspective(post.id, pInput.trim());
    setContributing(false);
    setPInput('');
  }

  return (
    <div className="page">
      <button
        style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}
        onClick={onBack}
      >
        ← 返回
      </button>

      {/* 帖子内容 */}
      <div className="card" style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 15, lineHeight: 1.9, color: 'var(--text-primary)', marginBottom: 16 }}>
          {post.content}
        </p>
        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {post.anon_name} · {new Date(post.created_at).toLocaleDateString('zh-CN')}
        </p>
      </div>

      {/* 我也有过 */}
      <div className="card" style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>🌊 我也有过</p>
        {resonated ? (
          <div>
            <p style={{ fontSize: 13, color: 'var(--accent)', marginBottom: myFeeling ? 10 : 0 }}>
              已留下共鸣 · {count} 人有过类似感受
            </p>
            {myFeeling && (
              <p style={{
                fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7,
                paddingLeft: 10, borderLeft: '2px solid var(--accent)'
              }}>
                {myFeeling}
              </p>
            )}
          </div>
        ) : showFeelingInput ? (
          <div>
            <input
              placeholder="留下你的类似感受（可跳过）"
              value={feeling}
              onChange={e => setFeeling(e.target.value)}
              style={{ marginBottom: 10 }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-ghost" onClick={submitResonate}>留下</button>
              <button className="btn-ghost" onClick={() => { setShowFeelingInput(false); submitResonate(); }}>跳过</button>
            </div>
          </div>
        ) : (
          <div>
            {count > 0 && (
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
                已有 {count} 人有过类似感受
              </p>
            )}
            <button className="btn-ghost" onClick={handleResonate}>我也有过</button>
          </div>
        )}
      </div>

      {/* 换个视角 */}
      <div className="card" style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>🔍 换个视角</p>
        {perspective ? (
          <div>
            <p style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-secondary)', marginBottom: 14 }}>
              {perspective}
            </p>
            {!contributing ? (
              <button
                style={{ fontSize: 12, color: 'var(--text-muted)' }}
                onClick={() => setContributing(true)}
              >
                + 留下我的视角
              </button>
            ) : (
              <div>
                <input
                  placeholder="你的视角…"
                  value={pInput}
                  onChange={e => setPInput(e.target.value)}
                  style={{ marginBottom: 8 }}
                  autoFocus
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn-ghost" onClick={submitPerspective}>提交</button>
                  <button className="btn-ghost" onClick={() => setContributing(false)}>取消</button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            className="btn-ghost"
            disabled={loadingP}
            onClick={loadPerspective}
          >
            {loadingP ? '…' : '看看另一种可能'}
          </button>
        )}
      </div>
    </div>
  );
}

// ---- 列表页 ----
export default function Resonance() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected] = useState(null);

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

  if (selected) {
    return <PostDetail post={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h2 style={{ fontSize: 20, fontWeight: 500 }}>共振厅</h2>
        <button className="btn-ghost" onClick={() => setComposing(true)}>写一段</button>
      </div>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>
        只说自己的感受，不评价对方。
      </p>

      {composing && (
        <div className="card" style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
            描述你的感受，不提对方的对错…
          </p>
          <textarea
            rows={4}
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {posts.map(post => (
          <button
            key={post.id}
            onClick={() => setSelected(post)}
            style={{
              textAlign: 'left', background: 'var(--surface)',
              border: '1px solid var(--border)', borderRadius: 'var(--radius)',
              padding: '16px 18px', transition: 'border-color 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <p style={{
              fontSize: 14, lineHeight: 1.8, color: 'var(--text-primary)',
              marginBottom: 10,
              display: '-webkit-box', WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical', overflow: 'hidden'
            }}>
              {post.content}
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {post.anon_name} · {new Date(post.created_at).toLocaleDateString('zh-CN')}
              </p>
              {post.resonance_count > 0 && (
                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  🌊 {post.resonance_count}
                </p>
              )}
            </div>
          </button>
        ))}
      </div>

      {!loading && posts.length === 0 && (
        <div className="empty">还没有人分享<br />成为第一个</div>
      )}
    </div>
  );
}
