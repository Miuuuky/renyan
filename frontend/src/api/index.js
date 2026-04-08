import { storage, uid, randomName } from './storage';

// 初始化用户
function getOrCreateUser() {
  let user = storage.get('user');
  if (!user) {
    user = { id: uid(), anon_name: randomName(), created_at: new Date().toISOString() };
    storage.set('user', user);
  }
  return user;
}

// 模拟标签提取（根据关键词匹配）
function mockExtractTags(answers) {
  const text = answers.join(' ');
  const rules = [
    { keywords: ['打断','急','快','来不及'], tag: '容易急' },
    { keywords: ['不敢','没说','忍住','算了'], tag: '不敢说' },
    { keywords: ['效率','时间','浪费','拖'], tag: '对效率有要求' },
    { keywords: ['误解','不理解','不懂我'], tag: '渴望被理解' },
    { keywords: ['情绪','激动','发火','生气'], tag: '情绪敏感' },
    { keywords: ['倾听','听','陪'], tag: '善于倾听' },
    { keywords: ['表达','说清楚','说不出'], tag: '不善表达' },
    { keywords: ['沉默','不说话','安静'], tag: '习惯沉默' },
    { keywords: ['委屈','受伤','难过'], tag: '容易受伤' },
    { keywords: ['调解','中间','平衡'], tag: '喜欢调解' },
    { keywords: ['怕','担心','焦虑'], tag: '容易焦虑' },
    { keywords: ['直接','直说','坦白'], tag: '表达直接' },
  ];
  const matched = rules.filter(r => r.keywords.some(k => text.includes(k))).map(r => r.tag);
  // 保证至少5个，不足时补充通用标签
  const fallback = ['在意他人感受','重视沟通','有自己的节奏','不轻易示弱','需要被看见'];
  const result = [...new Set([...matched, ...fallback])].slice(0, Math.floor(Math.random() * 4) + 5);
  return result;
}

// 模拟换个视角
function mockPerspective(content) {
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

// 预置实验卡片
const PRESET_EXPERIMENTS = [
  '下次想打断别人时，在心里默数三个数。只做这一次。',
  '今天找一个人，只听他说完，不给任何建议。',
  '把一件你一直没说出口的事，写在纸上，不用发给任何人。',
  '下次感到不舒服时，先在心里说一句"我现在感到___"，再决定要不要开口。',
  '今天对一个人说一句具体的感谢，不用"谢谢"，而是说谢谢他做了什么。',
  '下次想反驳时，先重复一遍对方说的话，确认你理解对了。',
  '今天允许自己沉默一次，不用填满每一个空白。',
  '下次想说"你应该"时，换成"我希望"试试。',
  '今天试着在说"没事"之前，停一秒，想想是不是真的没事。',
  '写下你觉得自己"最难被理解"的一面，不用给任何人看。',
];

// 预置共振厅帖子
const PRESET_POSTS = [
  { id: uid(), content: '我说了很多，但感觉对方根本没在听。不是愤怒，只是一种很深的疲惫。', anon_name: '晨雾412', resonance_count: 7, created_at: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: uid(), content: '有些话我想了很久，最后还是没说出口。不知道说了会怎样，但没说也很难受。', anon_name: '流云208', resonance_count: 12, created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: uid(), content: '对方沉默的时候，我不知道该怎么办。我填满了所有的空白，但好像越说越远。', anon_name: '暮光531', resonance_count: 5, created_at: new Date(Date.now() - 3600000 * 5).toISOString() },
];

// 预置词语
const PRESET_WORDS = [
  { id: 'w1', text: '强势', interpretation_count: 3 },
  { id: 'w2', text: '敏感', interpretation_count: 5 },
  { id: 'w3', text: '冷漠', interpretation_count: 2 },
  { id: 'w4', text: '话多', interpretation_count: 4 },
  { id: 'w5', text: '沉默', interpretation_count: 6 },
  { id: 'w6', text: '急躁', interpretation_count: 3 },
  { id: 'w7', text: '温柔', interpretation_count: 7 },
  { id: 'w8', text: '固执', interpretation_count: 2 },
  { id: 'w9', text: '体贴', interpretation_count: 4 },
  { id: 'w10', text: '疏离', interpretation_count: 3 },
];

const PRESET_INTERPRETATIONS = {
  w1: [{ id: uid(), anon_name: '细雨317', content: '对我来说，强势不是坏事。是一个人知道自己要什么，并且敢于说出来。', created_at: new Date(Date.now() - 86400000).toISOString() }],
  w2: [{ id: uid(), anon_name: '山风629', content: '敏感让我能感受到别人感受不到的东西，但也让我更容易受伤。', created_at: new Date(Date.now() - 86400000 * 2).toISOString() }],
  w5: [{ id: uid(), anon_name: '落叶104', content: '我的沉默不是拒绝，是我在认真想你说的话。', created_at: new Date(Date.now() - 3600000 * 3).toISOString() }],
  w7: [{ id: uid(), anon_name: '星尘256', content: '温柔有时候是一种很累的事，因为你要一直照顾别人的感受。', created_at: new Date(Date.now() - 86400000 * 3).toISOString() }],
};

// ---- 对外暴露的 API ----

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
      '最近一次让你感到不舒服的沟通，发生了什么？（请只描述事实和你的感受）',
      '你觉得自己在说话时，最常被别人说的一句话是什么？',
      '什么样的话会让你立刻不想聊下去？',
      '你心里有一个想说但一直没说出口的需求吗？可以写下来。',
      '如果用一个词形容你现在的沟通状态，会是什么？',
      '你希望别人理解你哪一点？',
      '你曾经因为一句话而觉得被看见过吗？那是一句怎样的话？',
      '当别人情绪激动时，你通常第一反应是什么？',
      '你有没有因为怕伤感情而忍住没说的话？那是什么场景？',
      '你觉得自己在哪种沟通角色里最自在：倾听者、表达者、还是调解者？',
    ];
    const count = Math.floor(Math.random() * 3) + 5;
    const shuffled = [...all].sort(() => Math.random() - 0.5).slice(0, count);
    return Promise.resolve({ data: shuffled.map((question, index) => ({ index, question })) });
  },
  submit: ({ answers }) => {
    const texts = answers.map(a => a.answer);
    const tagTexts = mockExtractTags(texts);
    const tags = tagTexts.map(text => ({
      id: uid(), text, is_pinned: false, is_archived: false,
      created_at: new Date().toISOString()
    }));
    storage.set('tags', tags);
    storage.set('onboarded', true);
    // 存入我的河
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
  }
};

export const experimentsApi = {
  recommend: () => {
    const shuffled = [...PRESET_EXPERIMENTS].sort(() => Math.random() - 0.5);
    const cards = shuffled.slice(0, 3).map((content, i) => ({ id: 'exp-' + i, content }));
    return Promise.resolve({ data: cards });
  },
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
    const post = {
      id: uid(), content, anon_name: user.anon_name,
      resonance_count: 0, created_at: new Date().toISOString()
    };
    storage.push('posts', post);
    return Promise.resolve({ data: post });
  },
  resonate: (id, feeling) => {
    const posts = storage.get('posts') || [];
    const updated = posts.map(p =>
      p.id === id ? { ...p, resonance_count: (p.resonance_count || 0) + 1 } : p
    );
    storage.set('posts', updated);
    return Promise.resolve({ data: { resonance_count: (updated.find(p => p.id === id)?.resonance_count || 1) } });
  },
  getPerspective: (id) => {
    const saved = storage.get('perspectives_' + id);
    if (saved?.length) {
      return Promise.resolve({ data: { content: saved[Math.floor(Math.random() * saved.length)].content, is_ai: false } });
    }
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
    return Promise.resolve({ data: [...saved, ...preset] });
  },
  addInterpretation: (id, content) => {
    const user = getOrCreateUser();
    const item = { id: uid(), anon_name: user.anon_name, content, created_at: new Date().toISOString() };
    storage.push('interp_' + id, item);
    return Promise.resolve({ data: item });
  }
};

export const riverApi = {
  list: () => Promise.resolve({ data: storage.get('river') || [] })
};
