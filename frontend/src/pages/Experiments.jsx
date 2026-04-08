import { useState, useEffect } from 'react';
import { experimentsApi } from '../api/index.js';

const SCENES = [
  {
    id: 's1',
    tag: '职场',
    background: '你在会议上提出了一个方案，主管当众说："这个思路太浅了，没有可行性。"其他同事都在看着你。',
    dialogue: [
      { role: 'other', name: '主管', text: '这个思路太浅了，没有可行性。' },
    ]
  },
  {
    id: 's2',
    tag: '家庭',
    background: '你下班回家已经很累了，家人一见面就开始抱怨你最近回家太晚、不顾家。',
    dialogue: [
      { role: 'other', name: '家人', text: '你最近是不是根本不想回这个家？每天这么晚，眼里还有没有这个家？' },
    ]
  },
  {
    id: 's3',
    tag: '朋友',
    background: '你鼓起勇气向朋友倾诉了一件让你很难受的事，对方听完说了一句话让你瞬间不想再说了。',
    dialogue: [
      { role: 'other', name: '朋友', text: '这有什么好难受的，我以前遇到的比这严重多了，不也过来了吗。' },
    ]
  },
  {
    id: 's4',
    tag: '职场',
    background: '同事在群里@了你，说你上次提交的文件有问题，导致他的工作受影响了。',
    dialogue: [
      { role: 'other', name: '同事', text: '上次那个文件是你发的吧？格式完全不对，害我返工了两个小时。' },
    ]
  },
  {
    id: 's5',
    tag: '社交',
    background: '聚会上，一个不太熟的人当着大家的面问了你一个你不想回答的问题。',
    dialogue: [
      { role: 'other', name: '对方', text: '你现在一个月挣多少啊？感觉你这行不太好做吧？' },
    ]
  },
  {
    id: 's6',
    tag: '亲密关系',
    background: '你和伴侣因为一件小事起了争执，对方突然说了一句让你很受伤的话。',
    dialogue: [
      { role: 'other', name: '伴侣', text: '你每次都这样，说不通的，跟你说话真的很累。' },
    ]
  },
  {
    id: 's7',
    tag: '职场',
    background: '你认真准备了一份报告，发给领导后，对方只回了两个字。',
    dialogue: [
      { role: 'other', name: '领导', text: '知道了。' },
    ]
  },
  {
    id: 's8',
    tag: '家庭',
    background: '父母又一次在饭桌上拿你和别人家的孩子比较。',
    dialogue: [
      { role: 'other', name: '父母', text: '你看看人家，跟你同岁，房子车子都有了。你这边还没个着落，也不知道在忙什么。' },
    ]
  },
  {
    id: 's9',
    tag: '朋友',
    background: '你拒绝了朋友的一个请求，对方的反应让你感到内疚。',
    dialogue: [
      { role: 'other', name: '朋友', text: '算了，我就知道你不会帮我的。没事，我自己想办法。' },
    ]
  },
  {
    id: 's10',
    tag: '职场',
    background: '你在推进一个项目，合作方突然变卦，态度也变得强硬。',
    dialogue: [
      { role: 'other', name: '合作方', text: '这个条件我们没办法接受，你们要么改，要么这个合作就算了。' },
    ]
  },
];

const TAG_COLORS = {
  '职场': '#e8f0f5',
  '家庭': '#f5f0e8',
  '朋友': '#f0f5e8',
  '社交': '#f5e8f0',
  '亲密关系': '#f0e8f5',
};

export default function Experiments() {
  const [scene, setScene] = useState(null);
  const [response, setResponse] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    pickScene();
    const saved = JSON.parse(localStorage.getItem('renyan_scene_history') || '[]');
    setHistory(saved);
  }, []);

  function pickScene() {
    const random = SCENES[Math.floor(Math.random() * SCENES.length)];
    setScene(random);
    setResponse('');
    setSubmitted(false);
  }

  async function handleSubmit() {
    if (!response.trim()) return;
    setSubmitting(true);
    const record = {
      id: Date.now().toString(),
      sceneId: scene.id,
      tag: scene.tag,
      background: scene.background,
      dialogue: scene.dialogue,
      response: response.trim(),
      created_at: new Date().toISOString()
    };
    // 存入本地历史
    const saved = JSON.parse(localStorage.getItem('renyan_scene_history') || '[]');
    saved.unshift(record);
    localStorage.setItem('renyan_scene_history', JSON.stringify(saved.slice(0, 50)));
    setHistory(saved.slice(0, 50));
    // 存入我的河
    await experimentsApi.done({
      experimentId: scene.id,
      content: `【场景练习·${scene.tag}】${scene.dialogue[0].text}`,
      note: response.trim()
    });
    setSubmitting(false);
    setSubmitted(true);
  }

  return (
    <div className="page">
      <h2 style={{ fontSize: 20, fontWeight: 500, marginBottom: 8 }}>场景练习</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 32 }}>
        遇到这句话，你会怎么回应？没有对错，只是记录。
      </p>

      {scene && (
        <div className="card" style={{ marginBottom: 24 }}>
          {/* 场景标签 */}
          <span style={{
            fontSize: 11, padding: '2px 10px', borderRadius: 10,
            background: TAG_COLORS[scene.tag] || 'var(--tag-bg)',
            color: 'var(--text-muted)', marginBottom: 14, display: 'inline-block'
          }}>
            {scene.tag}
          </span>

          {/* 背景 */}
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.8, marginBottom: 16 }}>
            {scene.background}
          </p>

          {/* 对话气泡 */}
          {scene.dialogue.map((line, i) => (
            <div key={i} style={{
              background: 'var(--tag-bg)', borderRadius: 'var(--radius-sm)',
              padding: '12px 14px', marginBottom: 20
            }}>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>{line.name}</p>
              <p style={{ fontSize: 15, lineHeight: 1.8, color: 'var(--text-primary)' }}>"{line.text}"</p>
            </div>
          ))}

          {submitted ? (
            <div>
              <div style={{
                borderLeft: '2px solid var(--accent)', paddingLeft: 12,
                marginBottom: 20, color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.8
              }}>
                {response}
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>已记录到「我的河」</p>
              <button className="btn-ghost" onClick={pickScene}>换一个场景</button>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10 }}>
                你会怎么回应？
              </p>
              <textarea
                rows={4}
                placeholder="写下你当时可能说的话，或者你希望自己说的话…"
                value={response}
                onChange={e => setResponse(e.target.value)}
                style={{ marginBottom: 12 }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn-primary"
                  disabled={!response.trim() || submitting}
                  onClick={handleSubmit}
                >
                  {submitting ? '记录中…' : '记录'}
                </button>
                <button className="btn-ghost" onClick={pickScene}>换一个场景</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 历史记录 */}
      {history.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>我的练习记录</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {history.slice(0, 5).map(record => (
              <div key={record.id} style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', padding: '14px 16px'
              }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                  <span style={{
                    fontSize: 10, padding: '2px 8px', borderRadius: 10,
                    background: TAG_COLORS[record.tag] || 'var(--tag-bg)',
                    color: 'var(--text-muted)'
                  }}>
                    {record.tag}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {new Date(record.created_at).toLocaleDateString('zh-CN')}
                  </span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, lineHeight: 1.6 }}>
                  "{record.dialogue[0].text}"
                </p>
                <p style={{
                  fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7,
                  paddingLeft: 10, borderLeft: '2px solid var(--border)'
                }}>
                  {record.response}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
