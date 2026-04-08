const router = require('express').Router();
const db = require('../db');
const auth = require('../middleware/auth');

// 获取所有词条（飘浮展示用）
router.get('/', auth, async (req, res) => {
  const { rows } = await db.query(
    `SELECT w.id, w.text, COUNT(wi.id)::int AS interpretation_count
     FROM words w LEFT JOIN word_interpretations wi ON w.id = wi.word_id
     GROUP BY w.id ORDER BY RANDOM()`
  );
  res.json(rows);
});

// 获取某词条的解读卡片
router.get('/:id/interpretations', auth, async (req, res) => {
  const { rows } = await db.query(
    `SELECT id, anon_name, content, created_at
     FROM word_interpretations WHERE word_id = $1 ORDER BY created_at DESC`,
    [req.params.id]
  );
  res.json(rows);
});

// 提交解读
router.post('/:id/interpretations', auth, async (req, res) => {
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: '内容不能为空' });
  try {
    const { rows: userRows } = await db.query(
      'SELECT anon_name FROM users WHERE id = $1', [req.user.userId]
    );
    const { rows } = await db.query(
      `INSERT INTO word_interpretations (word_id, user_id, anon_name, content)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.params.id, req.user.userId, userRows[0].anon_name, content.trim()]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
