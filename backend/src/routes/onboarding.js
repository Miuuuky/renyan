const router = require('express').Router();
const db = require('../db');
const auth = require('../middleware/auth');
const { extractTags } = require('../services/ai');

const QUESTIONS = [
  '最近一次让你感到不舒服的沟通，发生了什么？（请只描述事实和你的感受）',
  '你觉得自己在说话时，最常被别人说的一句话是什么？',
  '什么样的话会让你立刻不想聊下去？',
  '你心里有一个想说但一直没说出口的需求吗？可以写下来。',
  '如果用一个词形容你现在的沟通状态，会是什么？',
  '你希望别人理解你哪一点？',
  '你曾经因为一句话而觉得被看见过吗？那是一句怎样的话？',
  '当别人情绪激动时，你通常第一反应是什么？',
  '你有没有因为怕伤感情而忍住没说的话？那是什么场景？',
  '你觉得自己在哪种沟通角色里最自在：倾听者、表达者、还是调解者？'
];

// 随机抽取 5~7 道题
router.get('/questions', auth, (req, res) => {
  const count = Math.floor(Math.random() * 3) + 5; // 5~7
  const shuffled = [...QUESTIONS].sort(() => Math.random() - 0.5);
  res.json(shuffled.slice(0, count).map((q, i) => ({ index: i, question: q })));
});

// 提交答案 → AI 提取标签 → 存库
router.post('/submit', auth, async (req, res) => {
  const { answers } = req.body; // [{ index, question, answer }]
  if (!answers?.length) return res.status(400).json({ error: '答案不能为空' });

  try {
    // 存原始答案
    for (const a of answers) {
      await db.query(
        'INSERT INTO onboarding_answers (user_id, question_index, answer_text) VALUES ($1, $2, $3)',
        [req.user.userId, a.index, a.answer]
      );
    }

    // AI 提取标签
    const tags = await extractTags(answers.map(a => a.answer));

    // 存标签
    const inserted = [];
    for (const text of tags) {
      const { rows } = await db.query(
        'INSERT INTO tags (user_id, text) VALUES ($1, $2) RETURNING *',
        [req.user.userId, text]
      );
      inserted.push(rows[0]);
    }

    res.json({ tags: inserted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
