const router = require('express').Router();
const db = require('../db');
const auth = require('../middleware/auth');

// 获取我的标签（含归档）
router.get('/', auth, async (req, res) => {
  const { rows } = await db.query(
    'SELECT * FROM tags WHERE user_id = $1 ORDER BY is_pinned DESC, created_at DESC',
    [req.user.userId]
  );
  res.json(rows);
});

// 钉住/取消钉住（最多3个）
router.patch('/:id/pin', auth, async (req, res) => {
  const { id } = req.params;
  const { pinned } = req.body;

  if (pinned) {
    const { rows } = await db.query(
      'SELECT COUNT(*) FROM tags WHERE user_id = $1 AND is_pinned = true',
      [req.user.userId]
    );
    if (parseInt(rows[0].count) >= 3) {
      return res.status(400).json({ error: '最多置顶3个标签' });
    }
  }

  const { rows } = await db.query(
    'UPDATE tags SET is_pinned = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
    [pinned, id, req.user.userId]
  );
  res.json(rows[0]);
});

// 修改标签措辞
router.patch('/:id/text', auth, async (req, res) => {
  const { text } = req.body;
  const { rows } = await db.query(
    'UPDATE tags SET text = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
    [text, req.params.id, req.user.userId]
  );
  res.json(rows[0]);
});

// 归档到"过去的我"
router.patch('/:id/archive', auth, async (req, res) => {
  const { rows } = await db.query(
    'UPDATE tags SET is_archived = true, is_pinned = false WHERE id = $1 AND user_id = $2 RETURNING *',
    [req.params.id, req.user.userId]
  );
  res.json(rows[0]);
});

module.exports = router;
