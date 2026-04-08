import { useState, useEffect } from 'react';
import { riverApi } from '../api/index.js';

const TYPE_LABEL = {
  tag: '标签',
  experiment: '实验',
  interpretation: '词语解读'
};

const TYPE_COLOR = {
  tag: 'var(--tag-bg)',
  experiment: '#f0f5f0',
  interpretation: '#f5f0f5'
};

function RiverItem({ item }) {
  return (
    <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
      {/* 时间轴线 */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: 'var(--accent)', flexShrink: 0, marginTop: 6
        }} />
        <div style={{ width: 1, flex: 1, background: 'var(--border)', marginTop: 4 }} />
      </div>

      <div style={{ flex: 1, paddingBottom: 8 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
          <span style={{
            fontSize: 10,
            background: TYPE_COLOR[item.type],
            color: 'var(--text-muted)',
            padding: '2px 8px',
            borderRadius: 10
          }}>
            {TYPE_LABEL[item.type]}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {new Date(item.created_at).toLocaleDateString('zh-CN', {
              month: 'long', day: 'numeric'
            })}
          </span>
        </div>

        {item.type === 'tag' && (
          <div>
            <span className={`tag ${item.is_pinned ? 'pinned' : ''}`}>{item.text}</span>
            {item.is_archived && (
              <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>
                已归档
              </span>
            )}
          </div>
        )}

        {item.type === 'experiment' && (
          <div>
            <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.7 }}>
              {item.experiment_content}
            </p>
            {item.note && (
              <p style={{
                fontSize: 13, color: 'var(--text-secondary)',
                marginTop: 8, paddingLeft: 12,
                borderLeft: '2px solid var(--border)'
              }}>
                {item.note}
              </p>
            )}
          </div>
        )}

        {item.type === 'interpretation' && (
          <div>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
              对「{item.word_text}」的解读
            </span>
            <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.7 }}>
              {item.content}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function River() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    riverApi.list().then(({ data }) => {
      setItems(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="loading">加载中…</div>;

  return (
    <div className="page">
      <h2 style={{ fontSize: 20, fontWeight: 500, marginBottom: 8 }}>我的河</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 40 }}>
        流过的都在这里，没有评分，没有排名。
      </p>

      {items.length === 0 && (
        <div className="empty">
          还没有记录<br />
          完成问答、做一个实验，或在词语集市留下解读
        </div>
      )}

      {items.map(item => (
        <RiverItem key={`${item.type}-${item.id}`} item={item} />
      ))}
    </div>
  );
}
