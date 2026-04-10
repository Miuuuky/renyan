import { storage, uid, randomName } from './storage';
import { PRESET_WORDS, PRESET_INTERPRETATIONS, TAG_SIMILAR_MAP } from './words-data';

function getOrCreateUser() {
  let user = storage.get('user');
  if (!user) {
    user = { id: uid(), anon_name: randomName(), created_at: new Date().toISOString() };
    storage.set('user', user);
  }
  return user;
}

function mockExtractTags(answers) {
  const text = answers.join(' ');
  const rules = [
    { keywords: ['安静','不说话','内敛'], tag: '安静' },
    { keywords: ['话多','停不下来','爱说'], tag: '话多' },
    { keywords: ['直接','直说','不拐弯'], tag: '直接' },
    { keywords: ['委婉','含蓄','绕弯'], tag: '委婉' },
    { keywords: ['犹豫','迟疑','拿不定'], tag: '犹豫' },
    { keywords: ['果断','决断','快'], tag: '果断' },
    { keywords: ['慢热','需要时间','不容易亲近'], tag: '慢热' },
    { keywords: ['主动','联系','发起'], tag: '主动' },
    { keywords: ['被动','等待','不主动'], tag: '被动' },
    { keywords: ['理性','逻辑','分析'], tag: '理性' },
    { keywords: ['感性','情绪','感受'], tag: '感性' },
    { keywords: ['倾听','听','陪'], tag: '倾听' },
    { keywords: ['表达','说清楚','说不出'], tag: '表达' },
    { keywords: ['独立','自主','不依赖'], tag: '独立' },
    { keywords: ['坚持','不放弃','坚定'], tag: '坚持' },
    { keywords: ['急','急躁','冲动'], tag: '急躁' },
    { keywords: ['耐心','不着急','慢慢'], tag: '耐心' },
    { keywords: ['包容','接受','不计较'], tag: '包容' },
    { keywords: ['信任','相信','信赖'], tag: '信任' },
    { keywords: ['温和','温柔','平和'], tag: '温和' },
    { keywords: ['躲','逃','回避','不想面对'], tag: '回避' },
    { keywords: ['误解','不理解','没人懂'], tag: '渴望被理解' },
    { keywords: ['拒绝','说不','不敢拒绝'], tag: '不善拒绝' },
    { keywords: ['比喻','乌龟','气球','消防'], tag: '善用比喻' },
    { keywords: ['冷战','沉默','不说话'], tag: '习惯沉默' },
  ];
  const matched = rules.filter(r => r.keywords.some(k => text.includes(k))).map(r => r.tag);
  const fallback = ['感受', '表达', '倾听', '独立', '温和'];
  return [...new Set([...matched, ...fallback])].slice(0, Math.floor(Math.random() * 4) + 5);
}

function mockPerspective() {
  const perspectives = [
    '也许对方当时也在等一个开口的机会，只是方式不太一样。',
    '也许他说那句话时，心里也有些不确定，不知道怎么表达才合适。',
    '也许沉默对他来说是一种保护，而不是拒绝。',
    '也许他当时也感到了压力，只是没有说出来。',
    '也许这件事在他那里的重量，和在你这里不一样。',
    '也许他以为你已经知道他的意思了，所以没有再解释。',
  ];
  return perspectives[Math.floor(Math.random() * perspectives.length)];
}

function findSimilarWordId(tagText) {
  const matched = TAG_SIMILAR_MAP.find(r =>
    r.keywords.some(k => tagText.includes(k) || k.includes(tagText))
  );
  return matched?.wordId || null;
}

const PRESET_POSTS = [
  { id: uid(), content: '我说了很多，但感觉对方根本没在听。不是愤怒，只是一种很深的疲惫。', anon_name: '晨雾412', resonance_count: 7, created_at: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: uid(), content: '有些话我想了很久，最后还是没说出口。不知道说了会怎样，但没说也很难受。', anon_name: '流云208', resonance_count: 12, created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: uid(), content: '对方沉默的时候，我不知道该怎么办。我填满了所有的空白，但好像越说越远。', anon_name: '暮光531', resonance_count: 5, created_at: new Date(Date.now() - 3600000 * 5).toISOString() },
];

export const userApi = {
  register: () => Promise.resolve({ data: { token: 'local', user: getOrCreateUser() } }),
  me: () => {
    const user = storage.get('user');
    if (user) return Promise.resolve({ data: user });
    return Promise.reject(new Error('no user'));
  }
};

export const onboardingApi = {
  getQuestions: () => {
    const all = [
      '最近一次让你觉得"沟通好累"的事情，发生了什么？',
      '什么样的人说话，会让你本能地想躲开？',
      '如果用一个比喻形容你在冲突中的样子，你会是什么？',
      '你觉得自己在沟通中经常被误解的一点是什么？',
      '当你需要拒绝别人时，你通常会怎么做？',
      '你有没有一句话，是你很想对某人说但一直没说出口的？',
      '你觉得自己最难被别人理解的一面是什么？',
      '你上一次感到"被看见"是什么时候？那是什么感觉？',
      '当别人情绪很激动时，你的第一反应通常是什么？',
      '你有没有因为怕破坏关系而忍住没说的话？那是什么场景？',
    ];
    const count = Math.floor(Math.random() * 3) + 5;
    const shuffled = [...all].sort(() => Math.random() - 0.5).slice(0, count);
    return Promise.resolve({ data: shuffled.map((question, index) => ({ index, question })) });
  },
  submit: async ({ answers }) => {
    const texts = answers.map(a => a.answer);
    let tagTexts;
    try {
      const res = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: `你是一个中性、不评判的沟通观察者。根据用户的问答内容，提取5-8个描述其沟通特质的标签词。要求：只从以下词库中选择：安静、话多、直接、委婉、犹豫、果断、慢热、主动、被动、理性、感性、专注、发散、守时、随性、计划、灵活、坚持、妥协、倾听、表达、观察、参与、独立、依赖、自信、谨慎、幽默、严肃、热情、冷静、开放、保守、细腻、粗犷、温和、锋利、含蓄、坦率、大胆、稳定、多变、合群、独处、耐心、急躁、包容、挑剔、信任、怀疑、支持、质疑、合作、竞争、分享、保留、引领、跟随、创新、传统、情感、逻辑、直觉、分析、行动、思考、感受、判断、描述、回应。只返回JSON数组格式如["标签1","标签2"]，不要其他内容。`
            },
            { role: 'user', content: texts.join('\n') }
          ],
          temperature: 0.3,
          max_tokens: 200
        })
      });
      const data = await res.json();
      const content = data.choices[0].message.content.trim();
      tagTexts = JSON.parse(content);
      if (!Array.isArray(tagTexts) || tagTexts.length === 0) throw new Error('invalid');
    } catch {
      tagTexts = mockExtractTags(texts);
    }
    const tags = tagTexts.map(text => ({
      id: uid(), text, is_pinned: false, is_archived: false,
      created_at: new Date().toISOString()
    }));
    storage.set('tags', tags);
    storage.set('onboarded', true);
    tags.forEach(t => storage.push('river', { ...t, type: 'tag' }));
    return Promise.resolve({ data: { tags } });
  }
};

export const tagsApi = {
  list: () => Promise.resolve({ data: storage.get('tags') || [] }),
  pin: (id, pinned) => {
    const tags = storage.get('tags') || [];
    if (pinned && tags.filter(t => t.is_pinned).length >= 3) {
      return Promise.reject({ response: { data: { error: '最多置顶3个标签' } } });
    }
    const updated = tags.map(t => t.id === id ? { ...t, is_pinned: pinned } : t);
    storage.set('tags', updated);
    return Promise.resolve({ data: updated.find(t => t.id === id) });
  },
  updateText: (id, text) => {
    const tags = (storage.get('tags') || []).map(t => t.id === id ? { ...t, text } : t);
    storage.set('tags', tags);
    return Promise.resolve({ data: tags.find(t => t.id === id) });
  },
  archive: (id) => {
    const tags = (storage.get('tags') || []).map(t =>
      t.id === id ? { ...t, is_archived: true, is_pinned: false } : t
    );
    storage.set('tags', tags);
    return Promise.resolve({ data: tags.find(t => t.id === id) });
  },
  restore: (id) => {
    const tags = (storage.get('tags') || []).map(t =>
      t.id === id ? { ...t, is_archived: false } : t
    );
    storage.set('tags', tags);
    return Promise.resolve({ data: tags.find(t => t.id === id) });
  }
};

export const experimentsApi = {
  done: ({ experimentId, content, note }) => {
    const record = {
      id: uid(), experiment_id: experimentId,
      experiment_content: content, note,
      type: 'experiment', created_at: new Date().toISOString()
    };
    storage.push('river', record);
    return Promise.resolve({ data: record });
  }
};

export const resonanceApi = {
  list: () => {
    const saved = storage.get('posts') || [];
    return Promise.resolve({ data: [...saved, ...PRESET_POSTS] });
  },
  post: (content) => {
    const user = getOrCreateUser();
    const post = { id: uid(), content, anon_name: user.anon_name, resonance_count: 0, created_at: new Date().toISOString() };
    storage.push('posts', post);
    return Promise.resolve({ data: post });
  },
  resonate: (id, feeling) => {
    const posts = storage.get('posts') || [];
    const updated = posts.map(p => p.id === id ? { ...p, resonance_count: (p.resonance_count || 0) + 1 } : p);
    storage.set('posts', updated);
    return Promise.resolve({ data: { resonance_count: updated.find(p => p.id === id)?.resonance_count || 1 } });
  },
  getPerspective: (id) => {
    const saved = storage.get('perspectives_' + id);
    if (saved?.length) return Promise.resolve({ data: { content: saved[Math.floor(Math.random() * saved.length)].content, is_ai: false } });
    return Promise.resolve({ data: { content: mockPerspective(), is_ai: true } });
  },
  addPerspective: (id, content) => {
    storage.push('perspectives_' + id, { id: uid(), content });
    return Promise.resolve({ data: { ok: true } });
  }
};

export const wordsApi = {
  list: () => Promise.resolve({ data: PRESET_WORDS }),
  getInterpretations: (id) => {
    const saved = storage.get('interp_' + id) || [];
    const preset = PRESET_INTERPRETATIONS[id] || [];
    if (id.startsWith('tag_') && preset.length === 0) {
      const tags = storage.get('tags') || [];
      const tag = tags.find(t => t.id === id.replace('tag_', ''));
      if (tag) {
        const similarId = findSimilarWordId(tag.text);
        const borrowed = (similarId ? (PRESET_INTERPRETATIONS[similarId] || []) : [])
          .slice(0, 3).map(item => ({ ...item, id: uid() }));
        return Promise.resolve({ data: [...saved, ...borrowed] });
      }
    }
    return Promise.resolve({ data: [...saved, ...preset] });
  },
  addInterpretation: (id, content) => {
    const user = getOrCreateUser();
    const item = { id: uid(), anon_name: user.anon_name, content, created_at: new Date().toISOString(), like_count: 0 };
    storage.push('interp_' + id, item);
    return Promise.resolve({ data: item });
  },
  likeInterpretation: (wordId, interpId) => {
    const liked = storage.get('liked_interp') || {};
    if (liked[interpId]) return Promise.resolve({ data: { liked: false, cancelled: true } });
    liked[interpId] = true;
    storage.set('liked_interp', liked);
    return Promise.resolve({ data: { liked: true } });
  },
  isLiked: (interpId) => {
    const liked = storage.get('liked_interp') || {};
    return !!liked[interpId];
  },
  addComment: (wordId, interpId, content) => {
    const user = getOrCreateUser();
    const comment = { id: uid(), anon_name: user.anon_name, content, created_at: new Date().toISOString() };
    storage.push('comments_' + interpId, comment);
    return Promise.resolve({ data: comment });
  },
  getComments: (interpId) => Promise.resolve({ data: storage.get('comments_' + interpId) || [] })
};

export const riverApi = {
  list: () => Promise.resolve({ data: storage.get('river') || [] })
};

export const labApi = {
  // 获取场景库（预设 + 用户贡献）
  getScenes: () => {
    const userScenes = storage.get('user_scenes') || [];
    return Promise.resolve({ data: userScenes });
  },
  // 用户贡献场景
  contributeScene: ({ category, background, prompt }) => {
    const user = getOrCreateUser();
    const scene = {
      id: 'u_' + uid(), category, background, prompt,
      anon_name: user.anon_name, created_at: new Date().toISOString()
    };
    storage.push('user_scenes', scene);
    return Promise.resolve({ data: scene });
  },
  // 提交表达（仅自己 or 发布广场）
  submitResponse: ({ sceneId, sceneBackground, response, isPublic }) => {
    const user = getOrCreateUser();
    const record = {
      id: uid(), sceneId, sceneBackground, response,
      anon_name: user.anon_name, isPublic,
      like_count: 0, created_at: new Date().toISOString()
    };
    // 存训练记录
    storage.push('lab_records', record);
    // 发布广场
    if (isPublic) storage.push('lab_plaza', record);
    return Promise.resolve({ data: record });
  },
  // 广场列表
  getPlaza: (sort = 'time') => {
    const plaza = storage.get('lab_plaza') || [];
    const sorted = [...plaza].sort((a, b) => {
      if (sort === 'likes') return (b.like_count || 0) - (a.like_count || 0);
      if (sort === 'comments') {
        const ac = (storage.get('lab_comments_' + a.id) || []).length;
        const bc = (storage.get('lab_comments_' + b.id) || []).length;
        return bc - ac;
      }
      return new Date(b.created_at) - new Date(a.created_at);
    });
    return Promise.resolve({ data: sorted });
  },
  // 广场点赞
  likeResponse: (id) => {
    const liked = storage.get('liked_lab') || {};
    if (liked[id]) {
      liked[id] = false;
      storage.set('liked_lab', liked);
      const plaza = (storage.get('lab_plaza') || []).map(p =>
        p.id === id ? { ...p, like_count: Math.max(0, (p.like_count || 0) - 1) } : p
      );
      storage.set('lab_plaza', plaza);
      return Promise.resolve({ data: { liked: false } });
    }
    liked[id] = true;
    storage.set('liked_lab', liked);
    const plaza = (storage.get('lab_plaza') || []).map(p =>
      p.id === id ? { ...p, like_count: (p.like_count || 0) + 1 } : p
    );
    storage.set('lab_plaza', plaza);
    return Promise.resolve({ data: { liked: true } });
  },
  isLiked: (id) => !!(storage.get('liked_lab') || {})[id],
  // 广场评论
  getComments: (id) => Promise.resolve({ data: storage.get('lab_comments_' + id) || [] }),
  addComment: (id, content) => {
    const user = getOrCreateUser();
    const comment = { id: uid(), anon_name: user.anon_name, content, created_at: new Date().toISOString() };
    storage.push('lab_comments_' + id, comment);
    return Promise.resolve({ data: comment });
  },
  // 训练记录
  getRecords: () => Promise.resolve({ data: storage.get('lab_records') || [] }),
  deleteRecord: (id) => {
    const records = (storage.get('lab_records') || []).filter(r => r.id !== id);
    storage.set('lab_records', records);
    return Promise.resolve({ data: { ok: true } });
  }
};

export const wordRequestApi = {
  submit: (word) => {
    const user = getOrCreateUser();
    const item = { id: uid(), word: word.trim(), anon_name: user.anon_name, created_at: new Date().toISOString() };
    storage.push('word_requests', item);
    return Promise.resolve({ data: item });
  }
};
