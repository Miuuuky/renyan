import { useState, useEffect } from 'react';
import { tagsApi, labApi, setCurrentUser, getAnonName, tagRemoveApi } from '../api/index.js';
import { useNavigate } from 'react-router-dom';
import { storage, uid } from '../api/storage.js';
import { supabase } from '../api/supabase.js';

const TAG_COLORS = {
  '职场': '#e8f0f5', '亲密关系': '#f5e8f0', '家庭': '#f5f0e8',
  '朋友': '#f0f5e8', '社交': '#f0e8f5'
};

const TABS = ['我的标签', '练习记录', '解读记录', '点赞记录'];

const MBTI_TYPES = [
  'INTJ','INTP','ENTJ','ENTP',
  'INFJ','INFP','ENFJ','ENFP',
  'ISTJ','ISFJ','ESTJ','ESFJ',
  'ISTP','ISFP','ESTP','ESFP'
];

// ---- 我的标签 ----
function MyTags() {
  const [tags, setTags] = useState([]);
  const [showMbti, setShowMbti] = useState(false);
  const [requesting, setRequesting] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    tagsApi.list().then(({ data }) => setTags(data));
    tagRemoveApi.getNotifications().then(({ data }) => setNotifications(data));
  }, []);

  async function requestRemove(tag) {
    setRequesting(tag.id);
    const { data } = await tagRemoveApi.request(tag.id, tag.text);
    if (data?.error) { alert(data.error); }
    else { alert(`已提交申请，等待其他用户投票。`); }
    setRequesting(null);
  }

  async function vote(notification, voteValue) {
    await tagRemoveApi.vote(notification.request_id, notification.id, voteValue);
    setNotifications(prev => prev.filter(n => n.id !== notification.id));
  }

  async function addMbti(type) {
    const exists = tags.find(t => MBTI_TYPES.includes(t.text) && !t.is_archived);
    let currentTags = storage.get('tags') || [];
    if (exists) {
      currentTags = currentTags.map(t => t.id === exists.id ? { ...t, is_archived: true, is_pinned: false } : t);
    }
    const newTag = { id: uid(), text: type, is_pinned: false, is_archived: false, created_at: new Date().toISOString() };
    currentTags.push(newTag);
    storage.set('tags', currentTags);
    setTags(currentTags);
    setShowMbti(false);
  }

  async function togglePin(tag) {
    try {
      const { data } = await tagsApi.pin(tag.id, !tag.is_pinned);
      setTags(prev => prev.map(t => t.id === tag.id ? data : t));
    } catch (err) {
      if (err.response?.data?.error) alert(err.response.data.error);
    }
  }

  async function archive(id) {
    const { data } = await tagsApi.archive(id);
    setTags(prev => prev.map(t => t.id === id ? data : t));
  }

  async function restore(id) {
    const { data } = await tagsApi.restore(id);
    setTags(prev => prev.map(t => t.id === id ? data : t));
  }

  const active = tags
    .filter(t => !t.is_archived)
    .sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0));
  const archived = tags.filter(t => t.is_archived);

  if (tags.length === 0) return (
    <div className="empty">还没有标签<br />完成入场问答后会自动生成</div>
  );

  return (
    <div>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
        这些词来自你的回答，不定义你，只是此刻的一个切面。点击词语可以看看别人怎么理解它。
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
        {active.map(tag => (
          <div key={tag.id} className={`tag ${tag.is_pinned ? 'pinned' : ''}`}>
            {tag.is_pinned && <span style={{ fontSize: 10 }}>📌</span>}
            <button
              style={{ fontSize: 13, color: 'inherit', padding: 0 }}
              onClick={() => navigate('/words', { state: { word: { id: 'tag_' + tag.id, text: tag.text } } })}
            >
              {tag.text}
            </button>
            <span style={{ display: 'flex', gap: 4, marginLeft: 4 }}>
              <button
                style={{ fontSize: 11, color: 'var(--text-muted)', padding: '0 2px' }}
                onClick={() => togglePin(tag)}
              >
                {tag.is_pinned ? '·取消' : '·置顶'}
              </button>
              <button
                style={{ fontSize: 11, color: 'var(--text-muted)', padding: '0 2px' }}
                onClick={() => archive(tag.id)}
              >
                ·归档
              </button>
              <button
                style={{ fontSize: 11, color: 'var(--text-muted)', padding: '0 2px' }}
                onClick={() => requestRemove(tag)}
                disabled={requesting === tag.id}
              >
                {requesting === tag.id ? '·申请中…' : '·申请撕掉'}
              </button>
            </span>
          </div>
        ))}
      </div>

      {/* 投票通知 */}
      {notifications.length > 0 && (
        <div style={{ marginBottom: 24, padding: '14px 16px', background: 'var(--tag-bg)', borderRadius: 'var(--radius)' }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>待你投票 · {notifications.length} 条</p>
          {notifications.map(n => {
            const req = n.tag_remove_requests;
            return (
              <div key={n.id} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
                <p style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 6 }}>
                  <span style={{ color: 'var(--accent)' }}>{req?.users?.anon_name || '某用户'}</span>
                  {' '}申请撕掉标签「{req?.tag_text}」，你认为这个标签准确吗？
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => vote(n, 'agree')}>不准确，同意撕掉</button>
                  <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => vote(n, 'disagree')}>准确，不同意</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MBTI 入口 */}
      {!showMbti ? (
        <button
          style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 24 }}
          onClick={() => setShowMbti(true)}
        >
          + 添加 MBTI 标签
        </button>
      ) : (
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>选择你的 MBTI 类型</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
            {MBTI_TYPES.map(type => (
              <button
                key={type}
                onClick={() => addMbti(type)}
                style={{
                  fontSize: 13, padding: '5px 12px', borderRadius: 20,
                  background: tags.find(t => t.text === type) ? 'var(--accent)' : 'var(--tag-bg)',
                  color: tags.find(t => t.text === type) ? '#fff' : 'var(--text-secondary)',
                  border: '1px solid var(--border)'
                }}
              >
                {type}
              </button>
            ))}
          </div>
          <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => setShowMbti(false)}>关闭</button>
        </div>
      )}

      {archived.length > 0 && (
        <div>
          <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 12 }}>过去的我</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {archived.map(tag => (
              <div key={tag.id} className="tag" style={{ opacity: 0.55, fontSize: 12 }}>
                <span>{tag.text}</span>
                <button
                  style={{ fontSize: 11, color: 'var(--text-muted)', padding: '0 2px', marginLeft: 4 }}
                  onClick={() => restore(tag.id)}
                >
                  ·恢复
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---- 练习记录 ----
function PracticeHistory() {
  const [history, setHistory] = useState([]);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    labApi.getRecords().then(({ data }) => setHistory(data));
  }, []);

  async function handleDelete(id) {
    await labApi.deleteRecord(id);
    setHistory(prev => prev.filter(r => r.id !== id));
    setDeleting(null);
  }

  if (history.length === 0) return (
    <div className="empty">还没有练习记录<br />去场景练习里试试</div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {history.map(record => (
        <div key={record.id} className="card">
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <span style={{
              fontSize: 10, padding: '2px 8px', borderRadius: 10,
              background: TAG_COLORS[record.category] || 'var(--tag-bg)',
              color: 'var(--text-muted)'
            }}>
              {record.category}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {new Date(record.created_at).toLocaleDateString('zh-CN')}
            </span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, lineHeight: 1.6 }}>
            {record.sceneBackground}
          </p>
          <p style={{
            fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7,
            paddingLeft: 10, borderLeft: '2px solid var(--accent)'
          }}>
            {record.response}
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            {deleting === record.id ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={{ fontSize: 11, color: 'var(--text-muted)' }} onClick={() => setDeleting(null)}>取消</button>
                <button style={{ fontSize: 11, color: '#e57373' }} onClick={() => handleDelete(record.id)}>确认删除</button>
              </div>
            ) : (
              <button style={{ fontSize: 11, color: 'var(--text-muted)' }} onClick={() => setDeleting(record.id)}>删除</button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---- 解读记录 ----
function InterpretationHistory() {
  const records = [];
  // 从 localStorage 里找所有 interp_ 开头的用户自己提交的解读
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('renyan_interp_')) {
      try {
        const items = JSON.parse(localStorage.getItem(key)) || [];
        const wordId = key.replace('renyan_interp_', '');
        items.forEach(item => records.push({ ...item, wordId }));
      } catch {}
    }
  }
  records.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  if (records.length === 0) return (
    <div className="empty">还没有解读记录<br />去词语集市留下你的理解</div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {records.map(r => (
        <div key={r.id} className="card">
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
            {new Date(r.created_at).toLocaleDateString('zh-CN')}
          </p>
          <p style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-primary)' }}>{r.content}</p>
        </div>
      ))}
    </div>
  );
}

// ---- 点赞记录 ----
function LikeHistory() {
  const liked = storage.get('liked_interp') || {};
  const likedIds = Object.keys(liked).filter(k => liked[k]);

  if (likedIds.length === 0) return (
    <div className="empty">还没有点赞记录<br />在词语集市里点击"有共鸣"</div>
  );

  return (
    <div>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
        共 {likedIds.length} 条有共鸣的解读
      </p>
      <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>
        （点赞内容需要接入后端后才能完整展示）
      </p>
    </div>
  );
}

// ---- 主页面 ----
export default function Mine({ userId }) {
  const [tab, setTab] = useState(0);
  const [anonName, setAnonName] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    getAnonName().then(name => setAnonName(name || ''));
  }, []);

  async function saveName() {
    if (!nameInput.trim()) return;
    setSavingName(true);
    await supabase.from('users').update({ anon_name: nameInput.trim() }).eq('id', userId);
    setCurrentUser(userId, nameInput.trim());
    setAnonName(nameInput.trim());
    setEditingName(false);
    setSavingName(false);
  }

  return (
    <div className="page">
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 20, fontWeight: 500, marginBottom: 4 }}>我的</h2>
        {editingName ? (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6 }}>
            <input
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              style={{ width: 140, padding: '4px 8px', fontSize: 13 }}
              autoFocus
              onKeyDown={e => e.key === 'Enter' && saveName()}
            />
            <button className="btn-ghost" style={{ fontSize: 12 }} onClick={saveName} disabled={savingName}>
              {savingName ? '保存中…' : '保存'}
            </button>
            <button style={{ fontSize: 12, color: 'var(--text-muted)' }} onClick={() => setEditingName(false)}>取消</button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{anonName}</p>
            <button
              style={{ fontSize: 11, color: 'var(--text-muted)' }}
              onClick={() => { setNameInput(anonName); setEditingName(true); }}
            >
              ·改名字
            </button>
          </div>
        )}
      </div>

      {/* Tab 切换 */}
      <div style={{
        display: 'flex', gap: 0, marginBottom: 28,
        borderBottom: '1px solid var(--border)'
      }}>
        {TABS.map((t, i) => (
          <button
            key={i}
            onClick={() => setTab(i)}
            style={{
              fontSize: 13, padding: '8px 12px',
              color: tab === i ? 'var(--accent)' : 'var(--text-muted)',
              borderBottom: tab === i ? '2px solid var(--accent)' : '2px solid transparent',
              marginBottom: -1, transition: 'color 0.2s'
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 0 && <MyTags />}
      {tab === 1 && <PracticeHistory />}
      {tab === 2 && <InterpretationHistory />}
      {tab === 3 && <LikeHistory />}
    </div>
  );
}
