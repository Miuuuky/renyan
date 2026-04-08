const router = require('express').Router();
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const auth = require('../middleware/auth');

// 自然名词库
const NATURE_NAMES = [
  '流云','晨雾','暮光','细雨','山风','溪石','落叶','星尘',
  '浅草','远山','冬雪','春泥','夜潮','林间','霜晨','暖阳'
];

// 匿名注册（无需任何个人信息）
router.post('/register', async (req, res) => {
  try {
    const anonName = NATURE_NAMES[Math.floor(Math.random() * NATURE_NAMES.length)]
      + Math.floor(Math.random() * 900 + 100);
    const { rows } = await db.query(
      'INSERT INTO users (anon_name) VALUES ($1) RETURNING id, anon_name, created_at',
      [anonName]
    );
    const user = rows[0];
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '90d' });
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 获取当前用户信息
router.get('/me', auth, async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT id, anon_name, created_at FROM users WHERE id = $1',
      [req.user.userId]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
