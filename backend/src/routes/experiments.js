const router = require('express').Router();
const db = require('../db');
const auth = require('../middleware/auth');
const { generateExperiment } = require('../services/ai');

// 根据用户标签推荐实验卡片（3张）
router.get('/recommend', auth, async (req, res) => {
  try {
    // 获取用户当前有效标签
    const { rows: tags } = await db.query(
      'SELECT text FROM tags WHERE user_id = $1 AND is_archived = false',
      [req.user.userId]
    );
    const tagTexts = tags.map(t => t.text);

    // 从预设库中匹配
    let { rows: presets } = await db.query(
      `SELECT * FROM experiments WHERE is_preset = true
       AND (tag_hints && $1 OR tag_hints IS NULL)
       ORDER BY RANDOM() LIMIT 2`,
      [tagTexts.length ? tagTexts : ['']]
    );

    // 不足时补充随机预设
    if (presets.length < 2) {
      const { rows: extra } = await db.query(
        'SELECT * FROM experiments WHERE is_preset = true ORDER BY RANDOM() LIMIT $1',
        [2 - presets.length]
      );
      presets = [...presets, ...extra];
    }

    // AI 动态生成1张
    let aiCard = null;
    if (tagTexts.length > 0) {
      try {
        const content = await generateExperiment(tagTexts);
        aiCard = { id: 'ai-' + Date.now(), content, is_preset: false };
      } catch {
        // AI 失败时降级，不影响主流程
      }
    }

    const result = aiCard ? [...presets, aiCard] : presets;
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 记录"我做了"
router.post('/done', auth, async (req, res) => {
  const { experimentId, note, content } = req.body;
  try {
    let expId = experimentId;

    // AI 生成的卡片先入库
    if (experimentId?.startsWith('ai-')) {
      const { rows } = await db.query(
        'INSERT INTO experiments (content, is_preset) VALUES ($1, false) RETURNING id',
        [content]
      );
      expId = rows[0].id;
    }

    const { rows } = await db.query(
      'INSERT INTO user_experiments (user_id, experiment_id, note) VALUES ($1, $2, $3) RETURNING *',
      [req.user.userId, expId, note || null]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
