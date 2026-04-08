# 人言 · Renyan

> 让人的复杂性，得以被看见。

---

## 项目结构

```
renyan/
├── backend/          # Node.js + Express 后端
│   └── src/
│       ├── index.js          # 入口
│       ├── db.js             # PostgreSQL 连接
│       ├── db.sql            # 建表 + 初始数据
│       ├── middleware/
│       │   └── auth.js       # JWT 鉴权
│       ├── services/
│       │   └── ai.js         # OpenAI 调用（标签提取/视角生成/实验生成）
│       └── routes/
│           ├── user.js       # 匿名注册
│           ├── onboarding.js # 入场问答
│           ├── tags.js       # 标签墙
│           ├── experiments.js# 实验场
│           ├── resonance.js  # 共振厅
│           ├── words.js      # 词语集市
│           └── river.js      # 我的河
└── frontend/         # React + Vite 前端
    └── src/
        ├── main.jsx          # 入口 + 路由
        ├── index.css         # 全局样式
        ├── api/index.js      # 接口封装
        ├── store/index.js    # Zustand 状态
        ├── components/
        │   └── BottomNav.jsx
        └── pages/
            ├── Onboarding.jsx
            ├── Tags.jsx
            ├── Experiments.jsx
            ├── Resonance.jsx
            ├── Words.jsx
            └── River.jsx
```

---

## 快速启动

### 1. 准备数据库

```bash
# 创建 PostgreSQL 数据库
createdb renyan

# 执行建表语句
psql -d renyan -f backend/src/db.sql
```

### 2. 启动后端

```bash
cd backend
npm install

# 复制环境变量
copy .env.example .env
# 编辑 .env，填入 DATABASE_URL 和 OPENAI_API_KEY

npm run dev
# 运行在 http://localhost:3001
```

### 3. 启动前端

```bash
cd frontend
npm install
npm run dev
# 运行在 http://localhost:5173
```

---

## 环境变量说明（backend/.env）

| 变量 | 说明 |
|------|------|
| `DATABASE_URL` | PostgreSQL 连接串，如 `postgresql://user:pass@localhost:5432/renyan` |
| `JWT_SECRET` | 任意随机字符串，用于签发 token |
| `OPENAI_API_KEY` | OpenAI API Key，可替换为国产模型 |

---

## 替换为国产模型

修改 `backend/src/services/ai.js`，将 OpenAI client 替换为通义千问（DashScope）：

```js
// 通义千问示例
const OpenAI = require('openai');
const client = new OpenAI({
  apiKey: process.env.QWEN_API_KEY,
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1'
});
// model 改为 'qwen-turbo' 或 'qwen-plus'
```

---

## 核心设计原则

- **无真实身份**：注册只生成随机自然名（如"流云312"），不收集任何个人信息
- **无社交压力**：无关注、无粉丝、无私信、无点赞数字
- **AI 辅助而非主导**：AI 只做标签提取和内容补充，不做评判
- **极简留白**：主色浅灰/白，仅可点击元素使用淡蓝灰辅助色

---

## 后续迭代方向

- [ ] 离线缓存（IndexedDB / Service Worker）
- [ ] React Native 打包为 iOS/Android App
- [ ] 词语集市解读自动归类（AI 辅助）
- [ ] 共振厅内容安全过滤
- [ ] 数据加密存储（字段级加密）
