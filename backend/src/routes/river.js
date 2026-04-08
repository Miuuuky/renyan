const router = require('express').Router();
const db = require('../db');
const auth = require('../middleware/auth');

// 获取"我的河"时间线（标签变化 + 实验记录 + 词语解读）
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.userId;

    const [tagsRes, experimentsRes, interpretationsRes] = await Promise.all([
      db.query(
        `SELECT id, text, is_pinned, is_archived, created_at, 'tag' AS type
         FROM tags WHERE user_id = $1 ORDER BY created_at DESC`,
        [userId]
      ),
      db.query(
        `SELECT ue.id, ue.note, ue.done_at AS created_at, e.content AS experiment_content, 'experiment' AS type
         FROM user_experiments ue
         JOIN experiments e ON ue.experiment_id = e.id
         WHERE ue.user_id = $1 ORDER BY ue.done_at DESC`,
        [userId]
      ),
      db.query(
        `SELECT wi.id, wi.content, wi.created_at, w.text AS word_text, 'interpretation' AS type
         FROM word_interpretations wi
         JOIN words w ON wi.word_id = w.id
         WHERE wi.user_id = $1 ORDER BY wi.created_at DESC`,
        [userId]
      )
    ]);

    // 合并并按时间排序
    const timeline = [
      ...tagsRes.rows,
      ...experimentsRes.rows,
      ...interpretationsRes.rows
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json(timeline);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
