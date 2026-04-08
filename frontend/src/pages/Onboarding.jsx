import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onboardingApi } from '../api/index.js';
import { useStore } from '../store';

export default function Onboarding() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [step, setStep] = useState(0); // 当前题目索引
  const [loading, setLoading] = useState(false);
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
    try {
      const payload = questions.map(q => ({ index: q.index, answer: answers[q.index] }));
      const { data } = await onboardingApi.submit({ answers: payload });
      setTags(data.tags);
      navigate('/tags');
    } catch {
      setLoading(false);
    }
  }

  if (!questions.length) return <div className="loading">准备中…</div>;

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
