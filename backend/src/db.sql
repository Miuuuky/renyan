-- 用户表（仅存匿名标识，不存真实身份）
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anon_name VARCHAR(50) NOT NULL,          -- 临时自然名，如"流云""晨雾"
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 标签表
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  text VARCHAR(50) NOT NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,       -- 归档到"过去的我"
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 入场问答记录（加密存储原文）
CREATE TABLE IF NOT EXISTS onboarding_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  question_index INT NOT NULL,
  answer_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 实验卡片库（预设 + AI 生成）
CREATE TABLE IF NOT EXISTS experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  tag_hints TEXT[],                        -- 适配的标签关键词
  is_preset BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 用户实验记录
CREATE TABLE IF NOT EXISTS user_experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  experiment_id UUID REFERENCES experiments(id),
  note TEXT,                               -- "我做了"后的记录
  done_at TIMESTAMPTZ DEFAULT NOW()
);

-- 共振厅帖子
CREATE TABLE IF NOT EXISTS resonance_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,                   -- 纯粹描述，仅说感受
  anon_name VARCHAR(50) NOT NULL,
  resonance_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- "我也有过"记录
CREATE TABLE IF NOT EXISTS resonances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES resonance_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  feeling TEXT,                            -- 匿名留下的类似感受
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- "换个视角"留言
CREATE TABLE IF NOT EXISTS perspectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES resonance_posts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_ai_generated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 词语集市词条
CREATE TABLE IF NOT EXISTS words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text VARCHAR(20) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 词语解读卡片
CREATE TABLE IF NOT EXISTS word_interpretations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word_id UUID REFERENCES words(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  anon_name VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 预置词语
INSERT INTO words (text) VALUES
  ('强势'),('敏感'),('冷漠'),('话多'),('沉默'),
  ('急躁'),('温柔'),('固执'),('体贴'),('疏离')
ON CONFLICT DO NOTHING;

-- 预置实验卡片（50条）
INSERT INTO experiments (content, tag_hints, is_preset) VALUES
  ('下次想打断别人时，在心里默数三个数。只做这一次。', ARRAY['容易急','爱打断'], true),
  ('今天找一个人，只听他说完，不给任何建议。', ARRAY['爱给建议','不善倾听'], true),
  ('把一件你一直没说出口的事，写在纸上，不用发给任何人。', ARRAY['不敢说','压抑'], true),
  ('下次感到不舒服时，先在心里说一句"我现在感到___"，再决定要不要开口。', ARRAY['情绪化','不善表达'], true),
  ('今天对一个人说一句具体的感谢，不用"谢谢"，而是说谢谢他做了什么。', ARRAY['不善表达','疏离'], true),
  ('下次对话结束后，问自己：我今天有没有真的听进去对方说的话？', ARRAY['不善倾听','走神'], true),
  ('找一件你最近因为怕麻烦而没说的事，只说出来，不要求对方做什么。', ARRAY['不敢说','怕麻烦'], true),
  ('今天允许自己沉默一次，不用填满每一个空白。', ARRAY['话多','焦虑'], true),
  ('下次想反驳时，先重复一遍对方说的话，确认你理解对了。', ARRAY['容易急','爱争论'], true),
  ('写下你最近一次感到被误解的场景，只写事实，不写评价。', ARRAY['容易受伤','敏感'], true),
  ('今天试着用"我感到"代替"你总是"开头说一句话。', ARRAY['爱指责','情绪化'], true),
  ('找一个你觉得"难沟通"的人，想想他可能在担心什么。', ARRAY['固执','不理解他人'], true),
  ('下次会议或聊天中，只说你最想说的那一件事，其他的先放下。', ARRAY['话多','抓不住重点'], true),
  ('今天给自己五分钟，写下你最近压着没说的情绪。', ARRAY['压抑','不善表达'], true),
  ('下次有人向你倾诉时，忍住不说"我也是"，只问一个问题。', ARRAY['爱抢话','以自我为中心'], true),
  ('今天观察一次：你在什么时候开始不想听对方说话了？', ARRAY['不善倾听','走神'], true),
  ('把你对某人的一个期待，用一句话写下来，不发给他。', ARRAY['期待高','不善表达'], true),
  ('下次感到愤怒时，先离开现场一分钟再回来。', ARRAY['容易急','情绪化'], true),
  ('今天找一件小事，主动告诉对方你的真实感受，哪怕只是"我有点累"。', ARRAY['压抑','不敢说'], true),
  ('下次对话时，注意一下你的语速，试着慢下来说一句话。', ARRAY['容易急','话多'], true),
  ('写下你觉得自己"最难被理解"的一面，不用给任何人看。', ARRAY['孤独','敏感'], true),
  ('今天允许一次不解释，不辩解，只说"好的，我知道了"。', ARRAY['爱解释','防御'], true),
  ('下次想说"你应该"时，换成"我希望"试试。', ARRAY['爱指责','控制欲'], true),
  ('找一个你最近回避的话题，只是想一想，不用真的去说。', ARRAY['回避','压抑'], true),
  ('今天对自己说一句：我不需要在每次对话里都表现得很好。', ARRAY['焦虑','完美主义'], true),
  ('下次有人说了让你不舒服的话，先问自己：他可能是什么意思？', ARRAY['敏感','容易受伤'], true),
  ('今天写下三件你在沟通中做得还不错的事。', ARRAY['自我否定','焦虑'], true),
  ('下次想给建议时，先问对方：你现在需要我听，还是需要我帮你想办法？', ARRAY['爱给建议','不善倾听'], true),
  ('今天找一个你信任的人，说一件你一直觉得"说了也没用"的事。', ARRAY['绝望','压抑'], true),
  ('下次沉默时，不要急着打破它，让它存在三秒钟。', ARRAY['焦虑','话多'], true),
  ('写下你在沟通中最害怕的一件事是什么。', ARRAY['焦虑','回避'], true),
  ('今天试着在说"没事"之前，停一秒，想想是不是真的没事。', ARRAY['压抑','不敢说'], true),
  ('下次对话后，问自己：我今天有没有说了什么让自己后悔的话？', ARRAY['容易急','冲动'], true),
  ('找一件你因为"怕对方不高兴"而没说的事，只是承认它存在。', ARRAY['讨好','不敢说'], true),
  ('今天允许自己不同意对方，哪怕只是在心里。', ARRAY['讨好','压抑'], true),
  ('下次感到委屈时，先写下来，再决定要不要说出口。', ARRAY['敏感','容易受伤'], true),
  ('今天找一个你觉得"他不懂我"的人，想想你有没有真的说清楚过。', ARRAY['孤独','不善表达'], true),
  ('下次想沉默时，试着说一句"我需要想一想"。', ARRAY['沉默','回避'], true),
  ('今天观察一次：你在什么时候会突然变得很想说很多话？', ARRAY['焦虑','话多'], true),
  ('写下你最近一次感到"被看见"是什么时候。', ARRAY['孤独','渴望理解'], true),
  ('下次有人打断你时，不要放弃，温和地说"我还没说完"。', ARRAY['不敢争取','压抑'], true),
  ('今天找一件你一直用"算了"结束的事，重新想想你真正想要的是什么。', ARRAY['放弃','压抑'], true),
  ('下次想说"你不懂"时，换成"我想让你知道的是"。', ARRAY['孤独','不善表达'], true),
  ('今天允许自己有一个"不合理"的情绪，不用解释它。', ARRAY['自我否定','焦虑'], true),
  ('下次对话时，注意一下你有没有在听对方说话，还是在想自己接下来要说什么。', ARRAY['不善倾听','以自我为中心'], true),
  ('写下你觉得"沟通最顺畅"的一次经历，是什么让它顺畅的？', ARRAY['渴望理解','孤独'], true),
  ('今天对一个人说：谢谢你上次听我说话。', ARRAY['孤独','感恩'], true),
  ('下次感到对话陷入僵局时，试着问：我们现在在争什么？', ARRAY['爱争论','固执'], true),
  ('今天给自己写一封短信，说一件你在沟通中一直对自己太苛刻的事。', ARRAY['自我否定','完美主义'], true),
  ('下次想逃离一段对话时，先问自己：我在害怕什么？', ARRAY['回避','焦虑'], true)
ON CONFLICT DO NOTHING;
