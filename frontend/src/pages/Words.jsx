import { useState, useEffect } from 'react';
import { wordsApi } from '../api/index.js';

function FloatingWord({ word, onClick }) {
  const delay = Math.random() * 2;
  const duration = 2.5 + Math.random() * 2;

  return (
    <button
      onClick={() => onClick(word)}
      style={{
        animation: `float ${duration}s ease-in-out ${delay}s infinite`,
        color: 'var(--text-secondary)',
        fontSize: 14 + Math.random() * 6,
        padding: '6px 12px',
        borderRadius: 20,
        background: 'var(--tag-bg)',
        transition: 'background 0.2s, color 0.2s',
        margin: 4
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'var(--tag-pinned)';
        e.currentTarget.style.color = 'var(--accent)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'var(--tag-bg)';
        e.currentTarget.style.color = 'var(--text-secondary)';
      }}
    >
      {word.text}
    </button>
  );
}

function InterpretationCard({ item }) {
  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <p style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-primary)' }}>{item.content}</p>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10 }}>
        {item.anon_name} · {new Date(item.created_at).toLocaleDateString('zh-CN')}
      </p>
    </div>
  );
}

export default function Words() {
  const [words, setWords] = useState([]);
  const [selected, setSelected] = useState(null);
  const [interpretations, setInterpretations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    wordsApi.list().then(({ data }) => setWords(data));
  }, []);

  async function selectWord(word) {
    setSelected(word);
    setLoading(true);
    const { data } = await wordsApi.getInterpretations(word.id);
    setInterpretations(data);
    setLoading(false);
  }

  async function submitInterpretation() {
    if (!draft.trim()) return;
    const { data } = await wordsApi.addInterpretation(selected.id, draft.trim());
    setInterpretations(prev => [data, ...prev]);
    setDraft('');
    setComposing(false);
  }

  if (selected) {
    return (
      <div className="page">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <button
            style={{ color: 'var(--text-muted)', fontSize: 13 }}
            onClick={() => { setSelected(null); setComposing(false); }}
          >
            ← 返回
          </button>
          <h2 style={{ fontSize: 22, fontWeight: 500 }}>「{selected.text}」</h2>
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>
          不同的人，对同一个词有不同的理解。
        </p>

        {!composing ? (
          <button
            className="btn-ghost"
            style={{ marginBottom: 24 }}
            onClick={() => setComposing(true)}
          >
            + 留下我的解读
          </button>
        ) : (
          <div className="card" style={{ marginBottom: 24 }}>
            <textarea
              rows={3}
              placeholder={`对你来说，"${selected.text}"意味着什么？`}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              style={{ marginBottom: 12 }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-primary" disabled={!draft.trim()} onClick={submitInterpretation}>
                提交
              </button>
              <button className="btn-ghost" onClick={() => setComposing(false)}>取消</button>
            </div>
          </div>
        )}

        {loading && <div className="loading">加载中…</div>}

        {!loading && interpretations.length === 0 && (
          <div className="empty">还没有人解读这个词<br />留下你的理解</div>
        )}

        {interpretations.map(item => (
          <InterpretationCard key={item.id} item={item} />
        ))}
      </div>
    );
  }

  return (
    <div className="page">
      <h2 style={{ fontSize: 20, fontWeight: 500, marginBottom: 8 }}>词语集市</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 40 }}>
        同一个词，在不同人那里是不同的重量。
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 4 }}>
        {words.map(word => (
          <FloatingWord key={word.id} word={word} onClick={selectWord} />
        ))}
      </div>
    </div>
  );
}
