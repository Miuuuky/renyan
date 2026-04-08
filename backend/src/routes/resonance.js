const router = require('express').Router();
const db = require('../db');
const auth = require('../middleware/auth');
const { generatePerspective } = require('../services/ai');

// 获取帖子列表
router.get('/', auth, async (req, res) => {
  const { rows } = await db.query(
    `SELECT id, content, anon_name, resonance_count, created_at
     FROM resonance_posts ORDER BY created_at DESC LIMIT 30`
  );
  res.json(rows);
});

// 发布帖子
router.post('/', auth, async (req, res) => {
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: '内容不能为空' });

  try {
    const { rows: userRows } = await db.query(
      'SELECT anon_name FROM users WHERE id = $1', [req.user.userId]
    );
    const { rows } = await db.query(
      `INSERT INTO resonance_posts (user_id, content, anon_name)
       VALUES ($1, $2, $3) RETURNING *`,
      [req.user.userId, content.trim(), userRows[0].anon_name]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// "我也有过"
router.post('/:id/resonate', auth, async (req, res) => {
  const { feeling } = req.body;
  try {
    await db.query(
      'INSERT INTO resonances (post_id, user_id, feeling) VALUES ($1, $2, $3)',
      [req.params.id, req.user.userId, feeling || null]
    );
    const { rows } = await db.query(
      'UPDATE resonance_posts SET resonance_count = resonance_count + 1 WHERE id = $1 RETURNING resonance_count',
      [req.params.id]
    );
    res.json({ resonance_count: rows[0].resonance_count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// "换个视角"：随机取一条，不足时 AI 生成
router.get('/:id/perspective', auth, async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT content FROM perspectives WHERE post_id = $1 ORDER BY RANDOM() LIMIT 1',
      [req.params.id]
    );

    if (rows.length > 0) return res.json({ content: rows[0].content, is_ai: false });

    // AI 生成
    const { rows: postRows } = await db.query(
      'SELECT content FROM resonance_posts WHERE id = $1', [req.params.id]
    );
    if (!postRows.length) return res.status(404).json({ error: '帖子不存在' });

    const content = await generatePerspective(postRows[0].content);
    await db.query(
      'INSERT INTO perspectives (post_id, content, is_ai_generated) VALUES ($1, $2, true)',
      [req.params.id, content]
    );
    res.json({ content, is_ai: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 用户贡献"换个视角"
router.post('/:id/perspective', auth, async (req, res) => {
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: '内容不能为空' });
  try {
    await db.query(
      'INSERT INTO perspectives (post_id, content) VALUES ($1, $2)',
      [req.params.id, content.trim()]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
