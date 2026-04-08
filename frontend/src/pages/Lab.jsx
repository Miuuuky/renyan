import { useState, useEffect } from 'react';
import { labApi } from '../api/index.js';
import { PRESET_SCENES, CATEGORIES } from '../api/scenes-data.js';

const CATEGORY_COLORS = {
  '职场': '#e8f0f5', '亲密关系': '#f5e8f0', '家庭': '#f5f0e8',
  '朋友': '#f0f5e8', '社交': '#f0e8f5'
};

// ---- 场景卡片 ----
function SceneCard({ scene, onRespond }) {
  return (
    <div className="card">
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <span style={{
          fontSize: 11, padding: '2px 10px', borderRadius: 10,
          background: CATEGORY_COLORS[scene.category] || 'var(--tag-bg)',
          color: 'var(--text-muted)'
        }}>
          {scene.category}
        </span>
        {scene.anon_name && (
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            由 {scene.anon_name} 贡献
          </span>
        )}
      </div>
      <p style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-secondary)', marginBottom: 12 }}>
        {scene.background}
      </p>
      <p style={{ fontSize: 15, color: 'var(--text-primary)', marginBottom: 16 }}>
        {scene.prompt}
      </p>
      <button className="btn-ghost" onClick={() => onRespond(scene)}>写下我的回应</button>
    </div>
  );
}

// ---- 回应输入 ----
function ResponseInput({ scene, onSubmit, onCancel }) {
  const [text, setText] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!text.trim()) return;
    setSubmitting(true);
    await onSubmit({ text: text.trim(), isPublic });
    setSubmitting(false);
  }

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
        <span style={{
          fontSize: 11, padding: '2px 10px', borderRadius: 10,
          background: CATEGORY_COLORS[scene.category] || 'var(--tag-bg)',
          color: 'var(--text-muted)'
        }}>
          {scene.category}
        </span>
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 14 }}>
        {scene.background}
      </p>
      <p style={{ fontSize: 14, color: 'var(--text-primary)', marginBottom: 14 }}>{scene.prompt}</p>
      <textarea
        rows={4}
        placeholder="写下你会怎么说，或者你希望自己怎么说…"
        value={text}
        onChange={e => setText(e.target.value)}
        style={{ marginBottom: 14 }}
        autoFocus
      />
      {/* 发布选项 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <button
          onClick={() => setIsPublic(false)}
          style={{
            flex: 1, padding: '8px', borderRadius: 'var(--radius-sm)', fontSize: 13,
            border: `1px solid ${!isPublic ? 'var(--accent)' : 'var(--border)'}`,
            color: !isPublic ? 'var(--accent)' : 'var(--text-muted)',
            background: 'var(--surface)'
          }}
        >
          仅自己记录
        </button>
        <button
          onClick={() => setIsPublic(true)}
          style={{
            flex: 1, padding: '8px', borderRadius: 'var(--radius-sm)', fontSize: 13,
            border: `1px solid ${isPublic ? 'var(--accent)' : 'var(--border)'}`,
            color: isPublic ? 'var(--accent)' : 'var(--text-muted)',
            background: 'var(--surface)'
          }}
        >
          匿名发布到广场
        </button>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn-primary" disabled={!text.trim() || submitting} onClick={handleSubmit}>
          {submitting ? '提交中…' : '提交'}
        </button>
        <button className="btn-ghost" onClick={onCancel}>取消</button>
      </div>
    </div>
  );
}

// ---- 广场 ----
function Plaza() {
  const [posts, setPosts] = useState([]);
  const [sort, setSort] = useState('time');
  const [openComments, setOpenComments] = useState(null);
  const [commentDraft, setCommentDraft] = useState('');

  useEffect(() => { loadPosts(); }, [sort]);

  async function loadPosts() {
    const { data } = await labApi.getPlaza(sort);
    setPosts(data);
  }

  async function toggleLike(id) {
    await labApi.likeResponse(id);
    loadPosts();
  }

  async function submitComment(id) {
    if (!commentDraft.trim()) return;
    await labApi.addComment(id, commentDraft.trim());
    setCommentDraft('');
    loadPosts();
  }

  if (posts.length === 0) return (
    <div className="empty">还没有人发布<br />完成一个场景练习后选择"匿名发布到广场"</div>
  );

  return (
    <div>
      {/* 排序 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[['time', '最新'], ['likes', '点赞'], ['comments', '评论']].map(([val, label]) => (
          <button
            key={val}
            onClick={() => setSort(val)}
            style={{
              fontSize: 12, padding: '4px 12px', borderRadius: 20,
              background: sort === val ? 'var(--accent)' : 'var(--tag-bg)',
              color: sort === val ? '#fff' : 'var(--text-muted)',
              transition: 'all 0.2s'
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {posts.map(post => {
          const liked = labApi.isLiked(post.id);
          const comments = storage_get_comments(post.id);
          return (
            <div key={post.id} className="card">
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                <span style={{
                  padding: '1px 8px', borderRadius: 10, marginRight: 6,
                  background: CATEGORY_COLORS[post.category] || 'var(--tag-bg)'
                }}>
                  {post.category}
                </span>
                {post.anon_name} · {new Date(post.created_at).toLocaleDateString('zh-CN')}
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 8 }}>
                场景：{post.sceneBackground}
              </p>
              <p style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-primary)', marginBottom: 12 }}>
                {post.response}
              </p>
              <div style={{ display: 'flex', gap: 16 }}>
                <button
                  onClick={() => toggleLike(post.id)}
                  style={{
                    fontSize: 12, color: liked ? 'var(--accent)' : 'var(--text-muted)',
                    display: 'flex', alignItems: 'center', gap: 4
                  }}
                >
                  {liked ? '♥' : '♡'} {post.like_count > 0 ? post.like_count : ''}
                </button>
                <button
                  onClick={() => setOpenComments(openComments === post.id ? null : post.id)}
                  style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  💬 {openComments === post.id ? '收起' : '评论'}
                </button>
              </div>

              {openComments === post.id && (
                <CommentsSection postId={post.id} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function storage_get_comments(id) {
  try { return JSON.parse(localStorage.getItem('renyan_lab_comments_' + id) || '[]'); } catch { return []; }
}

function CommentsSection({ postId }) {
  const [comments, setComments] = useState([]);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    labApi.getComments(postId).then(({ data }) => setComments(data));
  }, [postId]);

  async function submit() {
    if (!draft.trim()) return;
    const { data } = await labApi.addComment(postId, draft.trim());
    setComments(prev => [...prev, data]);
    setDraft('');
  }

  return (
    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
      {comments.length === 0 && (
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>还没有评论</p>
      )}
      {comments.map(c => (
        <div key={c.id} style={{ marginBottom: 8 }}>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{c.anon_name}</p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{c.content}</p>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <input
          placeholder="写评论…"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          style={{ flex: 1, padding: '6px 10px', fontSize: 13 }}
        />
        <button className="btn-ghost" disabled={!draft.trim()} onClick={submit}
          style={{ fontSize: 12, padding: '6px 12px' }}>
          发
        </button>
      </div>
    </div>
  );
}

// ---- 贡献场景 ----
function ContributeScene({ onDone }) {
  const [category, setCategory] = useState('职场');
  const [background, setBackground] = useState('');
  const [prompt, setPrompt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    if (!background.trim() || !prompt.trim()) return;
    setSubmitting(true);
    await labApi.contributeScene({ category, background: background.trim(), prompt: prompt.trim() });
    setDone(true);
    setTimeout(onDone, 1500);
  }

  if (done) return (
    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--accent)', fontSize: 14 }}>
      场景已加入场景库，谢谢你的贡献。
    </div>
  );

  return (
    <div className="card">
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>
        描述一个你遇到过的真实沟通场景，让更多人来练习。
      </p>
      <div style={{ marginBottom: 14 }}>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>分类</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['职场', '亲密关系', '家庭', '朋友', '社交'].map(c => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              style={{
                fontSize: 12, padding: '4px 12px', borderRadius: 20,
                background: category === c ? 'var(--accent)' : 'var(--tag-bg)',
                color: category === c ? '#fff' : 'var(--text-muted)'
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>场景描述</p>
        <textarea
          rows={3}
          placeholder="描述具体发生了什么，不要提真实姓名…"
          value={background}
          onChange={e => setBackground(e.target.value)}
        />
      </div>
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>提问</p>
        <input
          placeholder="如：你会怎么说？"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
        />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          className="btn-primary"
          disabled={!background.trim() || !prompt.trim() || submitting}
          onClick={submit}
        >
          {submitting ? '提交中…' : '提交场景'}
        </button>
        <button className="btn-ghost" onClick={onDone}>取消</button>
      </div>
    </div>
  );
}

// ---- 主页面 ----
export default function Lab() {
  const [tab, setTab] = useState('practice'); // practice | plaza
  const [category, setCategory] = useState('全部');
  const [scene, setScene] = useState(null);
  const [responding, setResponding] = useState(false);
  const [contributing, setContributing] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [userScenes, setUserScenes] = useState([]);

  useEffect(() => {
    labApi.getScenes().then(({ data }) => setUserScenes(data));
    pickRandom();
  }, []);

  function pickRandom(cat) {
    const all = [...PRESET_SCENES, ...userScenes];
    const pool = (cat && cat !== '全部') ? all.filter(s => s.category === cat) : all;
    const picked = pool[Math.floor(Math.random() * pool.length)];
    setScene(picked);
    setResponding(false);
    setSubmitted(false);
  }

  function handleCategoryChange(cat) {
    setCategory(cat);
    pickRandom(cat);
  }

  async function handleSubmit({ text, isPublic }) {
    if (!scene) return;
    await labApi.submitResponse({
      sceneId: scene.id,
      sceneBackground: scene.background,
      response: text,
      isPublic,
      category: scene.category
    });
    setSubmitted(true);
    setResponding(false);
  }

  const allScenes = [...PRESET_SCENES, ...userScenes];
  const filtered = category === '全部' ? allScenes : allScenes.filter(s => s.category === category);

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 500 }}>实验室</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn-ghost"
            style={{ fontSize: 12 }}
            onClick={() => setContributing(true)}
          >
            + 贡献场景
          </button>
        </div>
      </div>

      {/* Tab */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderBottom: '1px solid var(--border)' }}>
        {[['practice', '场景练习'], ['plaza', '广场']].map(([val, label]) => (
          <button
            key={val}
            onClick={() => setTab(val)}
            style={{
              fontSize: 13, padding: '8px 16px',
              color: tab === val ? 'var(--accent)' : 'var(--text-muted)',
              borderBottom: tab === val ? '2px solid var(--accent)' : '2px solid transparent',
              marginBottom: -1
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {contributing && (
        <ContributeScene onDone={() => {
          setContributing(false);
          labApi.getScenes().then(({ data }) => setUserScenes(data));
        }} />
      )}

      {tab === 'practice' && !contributing && (
        <div>
          {/* 分类筛选 */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                style={{
                  fontSize: 12, padding: '4px 12px', borderRadius: 20,
                  background: category === cat ? 'var(--accent)' : 'var(--tag-bg)',
                  color: category === cat ? '#fff' : 'var(--text-muted)',
                  transition: 'all 0.2s'
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {responding && scene ? (
            <ResponseInput
              scene={scene}
              onSubmit={handleSubmit}
              onCancel={() => setResponding(false)}
            />
          ) : submitted ? (
            <div className="card" style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 14, color: 'var(--accent)', marginBottom: 16 }}>已记录 ✓</p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                同一个场景，不同的人会有完全不同的反应。去广场看看别人怎么说？
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-ghost" onClick={() => setTab('plaza')}>去广场看看</button>
                <button className="btn-ghost" onClick={() => pickRandom(category === '全部' ? null : category)}>
                  换一个场景
                </button>
              </div>
            </div>
          ) : scene ? (
            <div>
              <SceneCard scene={scene} onRespond={() => setResponding(true)} />
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <button
                  className="btn-ghost"
                  style={{ fontSize: 12 }}
                  onClick={() => pickRandom(category === '全部' ? null : category)}
                >
                  换一个场景
                </button>
              </div>
            </div>
          ) : (
            <div className="empty">该分类暂无场景</div>
          )}
        </div>
      )}

      {tab === 'plaza' && !contributing && <Plaza />}
    </div>
  );
}
