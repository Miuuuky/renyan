import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onboardingApi } from '../api/index.js';
import { useStore } from '../store';

const QUESTION_EXAMPLES = {
  '最近一次让你觉得"沟通好累"的事情，发生了什么？': [
    '比如有人可能会写：上次开会我提了个建议，没人接话，我后来就没再说话了。',
    '也有人会写：朋友跟我抱怨同一件事第三遍了，我直接说"你烦不烦"，然后冷战三天。',
    '或者：家人问我工作怎么样，我说还好，他们说"还好是什么意思"，我就不想聊了。',
  ],
  '什么样的人说话，会让你本能地想躲开？': [
    '比如：说话总是绕弯子，我猜不到他想说什么的人。',
    '或者：一开口就否定我，还没听完就说"你这样不对"的人。',
    '也有人会说：情绪很大、声音很响的人，我会本能地想缩起来。',
  ],
  '如果用一个比喻形容你在冲突中的样子，你会是什么？': [
    '比如：一只缩进壳里的乌龟，等风头过了再出来。',
    '或者：一个一直在灭火的消防员，但自己也快烧起来了。',
    '也有人会写：一颗随时要爆炸的气球，但一直在忍着不爆。',
  ],
  '你觉得自己在沟通中经常被误解的一点是什么？': [
    '比如：我沉默不是不在乎，是我在认真想，但别人以为我生气了。',
    '或者：我说话直接，不是想伤人，只是觉得绕弯子更累。',
    '也有人会写：我笑着说的话，别人以为我不当回事，但其实我很认真。',
  ],
  '当你需要拒绝别人时，你通常会怎么做？': [
    '比如：找一个理由，说自己最近很忙，其实是不想去。',
    '或者：直接说不行，但说完会担心对方不高兴，反复想很久。',
    '也有人会写：答应了，然后在心里骂自己为什么又答应了。',
  ],
  '你有没有一句话，是你很想对某人说但一直没说出口的？': [
    '比如：想跟父母说"你们能不能别再比较我和别人"，但怕他们难过。',
    '或者：想跟朋友说"你最近让我觉得很累"，但怕伤感情。',
    '也有人会写：想跟自己说"你已经做得够好了"，但说不出口。',
  ],
  '你觉得自己最难被别人理解的一面是什么？': [
    '比如：我需要很多独处时间，不是不喜欢你，是我需要充电。',
    '或者：我看起来很冷静，但其实内心一直在转。',
    '也有人会写：我在乎的事情很多，但我不知道怎么表达出来。',
  ],
  '你上一次感到"被看见"是什么时候？那是什么感觉？': [
    '比如：朋友说"我知道你最近很累"，我当时眼眶就红了。',
    '或者：有人记得我随口说过的一件小事，我觉得自己是真实存在的。',
    '也有人会写：好像从来没有过，或者想不起来了。',
  ],
  '当别人情绪很激动时，你的第一反应通常是什么？': [
    '比如：先让自己冷静，等他说完再说话。',
    '或者：我也会跟着激动起来，然后说一些后来后悔的话。',
    '也有人会写：想逃离现场，找个理由先走开。',
  ],
  '你有没有因为怕破坏关系而忍住没说的话？那是什么场景？': [
    '比如：同事抢了我的功劳，我没说，因为还要一起工作。',
    '或者：朋友说了一句让我很受伤的话，我笑着说没事，但记了很久。',
    '也有人会写：几乎每次都在忍，已经不记得上次说出来是什么时候了。',
  ],
};

export default function Onboarding({ userId }) {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [showExample, setShowExample] = useState(false);
  const navigate = useNavigate();
  const setTags = useStore(s => s.setTags);

  useEffect(() => {
    onboardingApi.getQuestions().then(({ data }) => {
      setQuestions(data);
      setAnswers(Object.fromEntries(data.map(q => [q.index, ''])));
    });
  }, []);

  useEffect(() => { setShowExample(false); }, [step]);

  const current = questions[step];
  const isLast = step === questions.length - 1;
  const canNext = answers[current?.index]?.trim().length > 0;
  const examples = current ? (QUESTION_EXAMPLES[current.question] || []) : [];

  async function handleSubmit() {
    setLoading(true);
    setAnalyzing(true);
    try {
      const payload = questions.map(q => ({ index: q.index, answer: answers[q.index] }));
      const { data } = await onboardingApi.submit({ answers: payload });
      setTags(data.tags);
      localStorage.setItem('renyan_onboarded_' + (userId || 'local'), 'true');
      await new Promise(r => setTimeout(r, 2000));
      navigate('/mine');
    } catch {
      setLoading(false);
      setAnalyzing(false);
    }
  }

  if (!questions.length) return <div className="loading">准备中…</div>;

  if (analyzing) return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 24, padding: 40
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        border: '2px solid var(--border)',
        borderTopColor: 'var(--accent)',
        animation: 'spin 1s linear infinite'
      }} />
      <p style={{ color: 'var(--text-secondary)', fontSize: 15, textAlign: 'center', lineHeight: 2 }}>
        正在读取你的回答<br />
        <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>提取你的沟通特质…</span>
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <div style={{ height: 2, background: 'var(--border)', borderRadius: 2, marginBottom: 40 }}>
        <div style={{
          height: '100%',
          width: `${((step + 1) / questions.length) * 100}%`,
          background: 'var(--accent)', borderRadius: 2, transition: 'width 0.3s'
        }} />
      </div>

      <div style={{ flex: 1 }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 16 }}>
          {step + 1} / {questions.length}
        </p>
        <p style={{ fontSize: 17, lineHeight: 1.8, marginBottom: 24, color: 'var(--text-primary)' }}>
          {current.question}
        </p>

        {examples.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <button
              onClick={() => setShowExample(v => !v)}
              style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <span>💡</span>
              <span>{showExample ? '收起例子' : '不知道怎么写？看看例子'}</span>
            </button>
            {showExample && (
              <div style={{ marginTop: 10, padding: '12px 14px', background: 'var(--tag-bg)', borderRadius: 'var(--radius-sm)' }}>
                {examples.map((ex, i) => (
                  <p key={i} style={{
                    fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8,
                    marginBottom: i < examples.length - 1 ? 10 : 0
                  }}>
                    {ex}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        <textarea
          rows={5}
          placeholder="写下你真实的感受，没有对错…"
          value={answers[current.index] || ''}
          onChange={e => setAnswers(prev => ({ ...prev, [current.index]: e.target.value }))}
          style={{ fontSize: 15 }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 }}>
        {step > 0 ? (
          <button className="btn-ghost" onClick={() => setStep(s => s - 1)}>上一题</button>
        ) : <span />}
        {isLast ? (
          <button className="btn-primary" disabled={!canNext || loading} onClick={handleSubmit}>
            {loading ? '分析中…' : '生成我的标签'}
          </button>
        ) : (
          <button className="btn-primary" disabled={!canNext} onClick={() => setStep(s => s + 1)}>
            下一题
          </button>
        )}
      </div>
    </div>
  );
}
