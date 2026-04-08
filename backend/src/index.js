require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/user', require('./routes/user'));
app.use('/api/onboarding', require('./routes/onboarding'));
app.use('/api/tags', require('./routes/tags'));
app.use('/api/experiments', require('./routes/experiments'));
app.use('/api/resonance', require('./routes/resonance'));
app.use('/api/words', require('./routes/words'));
app.use('/api/river', require('./routes/river'));

app.get('/health', (_, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`人言后端运行在 http://localhost:${PORT}`));
