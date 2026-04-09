import { useState, useEffect } from 'react';
import { wordsApi, tagsApi, wordRequestApi } from '../api/index.js';
import { useLocation } from 'react-router-dom';

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
        padding: '6px 12px', borderRadius: 20,
        background: 'var(--tag-bg)', transition: 'background 0.2s, color 0.2s', margin: 4
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--tag-pinned)'; e.currentTarget.style.color = 'var(--accent)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'var(--tag-bg)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
    >
      {word.text}
    </button>
  );
}

// 解读详情页
function InterpretationDetail({ item, wordId, wordText, onBack }) {
  const [liked, setLiked] = useState(() => wordsApi.isLiked(item.id));
  const [likeCount, setLikeCount] = useState(item.like_count || 0);
  const [comments, setComments] = useState([]);
  const [draft, setDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    wordsApi.getComments(item.id).then(({ data }) => setComments(data));
  }, []);

  async function toggleLike() {
    const { data } = await wordsApi.likeInterpretation(wordId, item.id);
    if (data.cancelled) { setLiked(false); setLikeCount(c => Math.max(0, c - 1)); }
    else { setLiked(true); setLikeCount(c => c + 1); }
  }

  async function submitComment() {
    if (!draft.trim()) return;
    setSubmitting(true);
    const { data } = await wordsApi.addComment(wordId, item.id, draft.trim());
    setComments(prev => [...prev, data]);
    setDraft('');
    setSubmitting(false);
  }

  return (
    <div className="page">
      <button style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }} onClick={onBack}>
        ← 返回「{wordText}」
      </button>

      <div className="card" style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 15, lineHeight: 1.9, color: 'var(--text-primary)', marginBottom: 12 }}>
          {item.content}
        </p>
        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {item.anon_name} · {new Date(item.created_at).toLocaleDateString('zh-CN')}
        </p>
        <div style={{ display: 'flex', gap: 16, marginTop: 14 }}>
          <button
            onClick={toggleLike}
            style={{ fontSize: 13, color: liked ? 'var(--accent)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            {liked ? '♥' : '♡'} {likeCount > 0 ? likeCount : ''} 有共鸣
          </button>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            💬 {comments.length} 条评论
          </span>
        </div>
      </div>

      {/* 评论区 */}
      <div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>评论</p>
        {comments.length === 0 && (
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>还没有评论，来说说你的想法</p>
        )}
        {comments.map(c => (
          <div key={c.id} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{c.anon_name}</p>
            <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.7 }}>{c.content}</p>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <input
            placeholder="写评论…"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submitComment()}
            style={{ flex: 1, padding: '8px 12px', fontSize: 14 }}
          />
          <button className="btn-ghost" disabled={!draft.trim() || submitting} onClick={submitComment}
            style={{ padding: '8px 14px' }}>
            发
          </button>
        </div>
      </div>
    </div>
  );
}

// 解读列表卡片（只显示摘要）
function InterpretationCard({ item, onClick }) {
  const liked = wordsApi.isLiked(item.id);
  return (
    <button
      onClick={() => onClick(item)}
      style={{
        textAlign: 'left', width: '100%',
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', padding: '14px 16px',
        marginBottom: 10, transition: 'border-color 0.2s'
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <p style={{
        fontSize: 14, lineHeight: 1.8, color: 'var(--text-primary)', marginBottom: 8,
        display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden'
      }}>
        {item.content}
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {item.anon_name} · {new Date(item.created_at).toLocaleDateString('zh-CN')}
        </p>
        <p style={{ fontSize: 11, color: liked ? 'var(--accent)' : 'var(--text-muted)' }}>
          {liked ? '♥' : '♡'} {item.like_count > 0 ? item.like_count : ''}
        </p>
      </div>
    </button>
  );
}

const DAILY_QUESTIONS = [
  { wordId: 'w1', question: '"安静"对你来说是一种享受，还是一种逃避？' },
  { wordId: 'w3', question: '你觉得"直接"是一种优点还是会伤人？' },
  { wordId: 'w10', question: '"理性"和"冷漠"，你觉得有什么区别？' },
  { wordId: 'w20', question: '你上一次真正被人"倾听"是什么时候？' },
  { wordId: 'w24', question: '"独立"让你得到了什么，又失去了什么？' },
  { wordId: 'w44', question: '你需要多少"独处"的时间才能恢复状态？' },
  { wordId: 'w46', question: '"急躁"背后，你在害怕失去什么？' },
  { wordId: 'w49', question: '你是先给出"信任"，还是等对方赢得信任？' },
  { wordId: 'w71', question: '"情感"在你的决定里占多大比重？' },
  { wordId: 'w18', question: '你"坚持"过一件别人都觉得没必要的事吗？' },
];

const PREVIEW_POOL = [
  { wordId: 'w1', content: '安静不是没有想法，是我更喜欢把想法放在心里慢慢消化。', anon_name: '落叶104' },
  { wordId: 'w3', content: '直接让我省了很多弯路，但也让我失去了一些需要被温柔对待的关系。', anon_name: '冬雪443' },
  { wordId: 'w10', content: '理性是我的盔甲，但有时候我也想脱下来。', anon_name: '霜晨155' },
  { wordId: 'w20', content: '倾听是我给别人最好的礼物，但有时候我也需要有人听我说说话。', anon_name: '冬雪189' },
  { wordId: 'w24', content: '独立不是孤独，是我选择了对自己负责。', anon_name: '落叶739' },
  { wordId: 'w44', content: '独处是我充电的方式，不是逃避，是需要。', anon_name: '暖阳534' },
  { wordId: 'w46', content: '急躁的背后是焦虑。我不是真的想催你，我只是控制不住自己的不安。', anon_name: '浅草762' },
  { wordId: 'w49', content: '信任是我给出去最贵重的东西，一旦破碎就很难复原。', anon_name: '林间341' },
  { wordId: 'w71', content: '情感不是弱点，是我和这个世界连接的方式。', anon_name: '溪石671' },
  { wordId: 'w77', content: '允许自己有感受，是我花了很长时间才学会的事。', anon_name: '浅草091' },
];

function DailyQuestion({ words, onSelect }) {
  const today = new Date();
  const idx = (today.getFullYear() * 366 + today.getMonth() * 31 + today.getDate()) % DAILY_QUESTIONS.length;
  const daily = DAILY_QUESTIONS[idx];
  const word = words.find(w => w.id === daily.wordId);
  if (!word) return null;
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '18px 20px', marginBottom: 20 }}>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>今日话题</p>
      <p style={{ fontSize: 15, lineHeight: 1.8, color: 'var(--text-primary)', marginBottom: 14 }}>{daily.question}</p>
      <button className="btn-ghost" style={{ fontSize: 13 }} onClick={() => onSelect(word)}>看看大家怎么说 →</button>
    </div>
  );
}

function HotPreviews({ words, onSelect }) {
  const [previews] = useState(() => [...PREVIEW_POOL].sort(() => Math.random() - 0.5).slice(0, 3));
  return (
    <div>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>有人说过</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {previews.map((p, i) => {
          const word = words.find(w => w.id === p.wordId);
          return (
            <button key={i} onClick={() => word && onSelect(word)}
              style={{ textAlign: 'left', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '14px 16px', transition: 'border-color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-primary)', marginBottom: 8 }}>"{p.content}"</p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.anon_name} · 关于「{word?.text || ''}」</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WordRequest() {
  const [open, setOpen] = useState(false);
  const [word, setWord] = useState('');
  const [done, setDone] = useState(false);

  async function submit() {
    if (!word.trim()) return;
    await wordRequestApi.submit(word);
    setDone(true);
    setWord('');
    setTimeout(() => { setDone(false); setOpen(false); }, 2000);
  }

  return (
    <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
      {!open ? (
        <button style={{ fontSize: 12, color: 'var(--text-muted)' }} onClick={() => setOpen(true)}>
          + 没有你想要的词？申请添加
        </button>
      ) : done ? (
        <p style={{ fontSize: 13, color: 'var(--accent)' }}>已收到你的申请，谢谢。</p>
      ) : (
        <div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>说出你想添加的词，我们会考虑加入。</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <input placeholder="输入词语…" value={word} onChange={e => setWord(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              style={{ flex: 1, padding: '6px 10px', fontSize: 13 }} autoFocus />
            <button className="btn-ghost" onClick={submit} disabled={!word.trim()}>提交</button>
            <button className="btn-ghost" onClick={() => setOpen(false)}>取消</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Words() {
  const [words, setWords] = useState([]);
  const [selected, setSelected] = useState(null);
  const [selectedInterp, setSelectedInterp] = useState(null);
  const [interpretations, setInterpretations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState('');
  const [visibleWords, setVisibleWords] = useState([]);
  const location = useLocation();

  useEffect(() => {
    Promise.all([wordsApi.list(), tagsApi.list()]).then(([{ data: preset }, { data: tags }]) => {
      const presetTexts = new Set(preset.map(w => w.text));
      const tagWords = tags
        .filter(t => !t.is_archived && !presetTexts.has(t.text))
        .map(t => ({ id: 'tag_' + t.id, text: t.text, fromTag: true }));
      setWords([...preset, ...tagWords]);
    });
  }, []);

  useEffect(() => {
    if (location.state?.word && words.length > 0) selectWord(location.state.word);
  }, [location.state, words]);

  useEffect(() => {
    if (words.length > 0) shuffle();
  }, [words]);

  function shuffle() {
    setVisibleWords([...words].sort(() => Math.random() - 0.5).slice(0, 15));
  }

  async function selectWord(word) {
    setSelected(word);
    setSelectedInterp(null);
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

  // 解读详情页
  if (selectedInterp) {
    return (
      <InterpretationDetail
        item={selectedInterp}
        wordId={selected.id}
        wordText={selected.text}
        onBack={() => setSelectedInterp(null)}
      />
    );
  }

  // 词条页
  if (selected) {
    return (
      <div className="page">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button style={{ color: 'var(--text-muted)', fontSize: 13 }}
            onClick={() => { setSelected(null); setComposing(false); }}>
            ← 返回
          </button>
          <h2 style={{ fontSize: 22, fontWeight: 500 }}>「{selected.text}」</h2>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
          不同的人，对同一个词有不同的理解。
        </p>

        {!composing ? (
          <button className="btn-ghost" style={{ marginBottom: 20 }} onClick={() => setComposing(true)}>
            + 留下我的解读
          </button>
        ) : (
          <div className="card" style={{ marginBottom: 20 }}>
            <textarea rows={3} placeholder={`对你来说，"${selected.text}"意味着什么？`}
              value={draft} onChange={e => setDraft(e.target.value)}
              style={{ marginBottom: 12 }} autoFocus />
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-primary" disabled={!draft.trim()} onClick={submitInterpretation}>提交</button>
              <button className="btn-ghost" onClick={() => setComposing(false)}>取消</button>
            </div>
          </div>
        )}

        {loading && <div className="loading">加载中…</div>}
        {!loading && interpretations.length === 0 && (
          <div className="empty">还没有人解读这个词<br />留下你的理解</div>
        )}
        {interpretations.map(item => (
          <InterpretationCard key={item.id} item={item} onClick={setSelectedInterp} />
        ))}
      </div>
    );
  }

  // 主页
  return (
    <div className="page">
      <h2 style={{ fontSize: 20, fontWeight: 500, marginBottom: 8 }}>标签市集</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>
        同一个词，在不同人那里是不同的重量。
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 4, marginBottom: 12 }}>
        {visibleWords.map(word => (
          <FloatingWord key={word.id} word={word} onClick={selectWord} />
        ))}
      </div>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <button className="btn-ghost" style={{ fontSize: 12 }} onClick={shuffle}>换一批</button>
      </div>

      <DailyQuestion words={words} onSelect={selectWord} />
      <HotPreviews words={words} onSelect={selectWord} />
      <WordRequest />
    </div>
  );
}
