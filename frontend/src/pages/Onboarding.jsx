import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onboardingApi } from '../api/index.js';
import { useStore } from '../store';

export default function Onboarding() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [step, setStep] = useState(0); // 当前题目索引
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const navigate = useNavigate();
  const setTags = useStore(s => s.setTags);

  useEffect(() => {
    onboardingApi.getQuestions().then(({ data }) => {
      setQuestions(data);
      setAnswers(Object.fromEntries(data.map(q => [q.index, ''])));
    });
  }, []);

  const current = questions[step];
  const isLast = step === questions.length - 1;
  const canNext = answers[current?.index]?.trim().length > 0;

  async function handleSubmit() {
    setLoading(true);
    setAnalyzing(true);
    try {
      const payload = questions.map(q => ({ index: q.index, answer: answers[q.index] }));
      const { data } = await onboardingApi.submit({ answers: payload });
      setTags(data.tags);
      // 停留2秒让用户看到过渡动画
      await new Promise(r => setTimeout(r, 2000));
      navigate('/tags');
    } catch {
      setLoading(false);
      setAnalyzing(false);
    }
  }

  if (!questions.length) return <div className="loading">准备中…</div>;

  if (analyzing) return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 24,
      padding: 40
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
      {/* 进度条 */}
      <div style={{ height: 2, background: 'var(--border)', borderRadius: 2, marginBottom: 40 }}>
        <div style={{
          height: '100%',
          width: `${((step + 1) / questions.length) * 100}%`,
          background: 'var(--accent)',
          borderRadius: 2,
          transition: 'width 0.3s'
        }} />
      </div>

      <div style={{ flex: 1 }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 16 }}>
          {step + 1} / {questions.length}
        </p>
        <p style={{ fontSize: 17, lineHeight: 1.8, marginBottom: 32, color: 'var(--text-primary)' }}>
          {current.question}
        </p>
        <textarea
          rows={5}
          placeholder="写下你真实的感受，没有对错…"
          value={answers[current.index] || ''}
          onChange={e => setAnswers(prev => ({ ...prev, [current.index]: e.target.value }))}
          style={{ fontSize: 15 }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
        {isLast ? (
          <button
            className="btn-primary"
            disabled={!canNext || loading}
            onClick={handleSubmit}
          >
            {loading ? '分析中…' : '生成我的标签'}
          </button>
        ) : (
          <button
            className="btn-primary"
            disabled={!canNext}
            onClick={() => setStep(s => s + 1)}
          >
            下一题
          </button>
        )}
      </div>
    </div>
  );
}
