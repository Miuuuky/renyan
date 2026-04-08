import { useState, useEffect } from 'react';
import { tagsApi } from '../api/index.js';

export default function Tags() {
  const [tags, setTags] = useState([]);
  const [editing, setEditing] = useState(null); // tag id
  const [editText, setEditText] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await tagsApi.list();
    setTags(data);
  }

  async function togglePin(tag) {
    try {
      const { data } = await tagsApi.pin(tag.id, !tag.is_pinned);
      setTags(prev => prev.map(t => t.id === tag.id ? data : t));
    } catch (err) {
      if (err.response?.data?.error) alert(err.response.data.error);
    }
  }

  async function saveEdit(id) {
    if (!editText.trim()) return;
    const { data } = await tagsApi.updateText(id, editText.trim());
    setTags(prev => prev.map(t => t.id === id ? data : t));
    setEditing(null);
  }

  async function archive(id) {
    const { data } = await tagsApi.archive(id);
    setTags(prev => prev.map(t => t.id === id ? data : t));
  }

  const active = tags.filter(t => !t.is_archived);
  const archived = tags.filter(t => t.is_archived);

  return (
    <div className="page">
      <h2 style={{ fontSize: 20, fontWeight: 500, marginBottom: 8 }}>我的标签</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 32 }}>
        这些词来自你的回答，不定义你，只是此刻的一个切面。
      </p>

      {active.length === 0 && (
        <div className="empty">还没有标签<br />完成入场问答后会自动生成</div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {active.map(tag => (
          <div key={tag.id} style={{ position: 'relative' }}>
            {editing === tag.id ? (
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  style={{ width: 100, padding: '4px 8px', fontSize: 13 }}
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && saveEdit(tag.id)}
                />
                <button className="btn-ghost" onClick={() => saveEdit(tag.id)}>保存</button>
                <button className="btn-ghost" onClick={() => setEditing(null)}>取消</button>
              </div>
            ) : (
              <div
                className={`tag ${tag.is_pinned ? 'pinned' : ''}`}
                style={{ cursor: 'default' }}
              >
                {tag.is_pinned && (
                  <span style={{ fontSize: 10, color: 'var(--accent)' }}>📌</span>
                )}
                <span>{tag.text}</span>
                <span style={{ display: 'flex', gap: 4, marginLeft: 4 }}>
                  <button
                    style={{ fontSize: 11, color: 'var(--text-muted)', padding: '0 2px' }}
                    title={tag.is_pinned ? '取消置顶' : '置顶'}
                    onClick={() => togglePin(tag)}
                  >
                    {tag.is_pinned ? '·取消' : '·置顶'}
                  </button>
                  <button
                    style={{ fontSize: 11, color: 'var(--text-muted)', padding: '0 2px' }}
                    onClick={() => { setEditing(tag.id); setEditText(tag.text); }}
                  >
                    ·改
                  </button>
                  <button
                    style={{ fontSize: 11, color: 'var(--text-muted)', padding: '0 2px' }}
                    onClick={() => archive(tag.id)}
                  >
                    ·归档
                  </button>
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {archived.length > 0 && (
        <div style={{ marginTop: 48 }}>
          <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 16 }}>过去的我</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {archived.map(tag => (
              <span key={tag.id} className="tag" style={{ opacity: 0.45, fontSize: 12 }}>
                {tag.text}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
