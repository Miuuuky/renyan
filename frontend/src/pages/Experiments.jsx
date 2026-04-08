import { useState, useEffect } from 'react';
import { experimentsApi } from '../api/index.js';

export default function Experiments() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [doneId, setDoneId] = useState(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const { data } = await experimentsApi.recommend();
      setCards(data);
    } finally {
      setLoading(false);
    }
  }

  async function submitDone(card) {
    setSubmitting(true);
    try {
      await experimentsApi.done({
        experimentId: card.id,
        content: card.content,
        note: note.trim() || null
      });
      setDoneId(null);
      setNote('');
      load(); // 刷新卡片
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="loading">正在为你匹配实验…</div>;

  return (
    <div className="page">
      <h2 style={{ fontSize: 20, fontWeight: 500, marginBottom: 8 }}>实验场</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 32 }}>
        每张卡片只是一个微小的邀请，做不做都可以。
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {cards.map(card => (
          <div key={card.id} className="card">
            <p style={{ fontSize: 15, lineHeight: 1.8, marginBottom: 20 }}>{card.content}</p>

            {doneId === card.id ? (
              <div>
                <textarea
                  rows={3}
                  placeholder="发生了什么？（可以不写）"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  style={{ marginBottom: 12 }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn-primary"
                    disabled={submitting}
                    onClick={() => submitDone(card)}
                  >
                    {submitting ? '记录中…' : '记录'}
                  </button>
                  <button className="btn-ghost" onClick={() => setDoneId(null)}>取消</button>
                </div>
              </div>
            ) : (
              <button
                className="btn-ghost"
                onClick={() => { setDoneId(card.id); setNote(''); }}
              >
                我做了
              </button>
            )}
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center', marginTop: 32 }}>
        <button className="btn-ghost" onClick={load}>换一批</button>
      </div>
    </div>
  );
}
