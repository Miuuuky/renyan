import { supabase } from './supabase.js';
import { PRESET_WORDS, PRESET_INTERPRETATIONS, TAG_SIMILAR_MAP } from './words-data';

let currentUserId = null;
let currentAnonName = null;

export function setCurrentUser(userId, anonName) {
  currentUserId = userId;
  currentAnonName = anonName;
}

export async function getAnonName() {
  if (currentAnonName) return currentAnonName;
  const { data } = await supabase.from('users').select('anon_name').eq('id', currentUserId).single();
  currentAnonName = data?.anon_name;
  return currentAnonName;
}

function mockExtractTags(answers) {
  const text = answers.join(' ');
  const totalLength = answers.reduce((sum, a) => sum + a.length, 0);
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
    { keywords: ['躲','逃','回避'], tag: '回避' },
    { keywords: ['误解','不理解','没人懂'], tag: '渴望被理解' },
    { keywords: ['拒绝','说不','不敢拒绝'], tag: '不善拒绝' },
    { keywords: ['冷战','沉默','不说话'], tag: '习惯沉默' },
  ];
  const matched = rules.filter(r => r.keywords.some(k => text.includes(k))).map(r => r.tag);
  // 回答总字数少于30字视为敷衍，只给2个标签
  if (totalLength < 30) return matched.slice(0, 2).length > 0 ? matched.slice(0, 2) : ['感受', '表达'];
  const fallback = ['感受', '表达', '倾听', '独立', '温和'];
  return [...new Set([...matched, ...fallback])].slice(0, Math.floor(Math.random() * 4) + 3);
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
              content: `你是一个中性、不评判的沟通观察者。根据用户的问答内容，提取描述其沟通特质的标签词。要求：
1. 只从以下词库中选择：安静、话多、直接、委婉、犹豫、果断、慢热、主动、被动、理性、感性、专注、发散、守时、随性、计划、灵活、坚持、妥协、倾听、表达、观察、参与、独立、依赖、自信、谨慎、幽默、严肃、热情、冷静、开放、保守、细腻、粗犷、温和、锋利、含蓄、坦率、大胆、稳定、多变、合群、独处、耐心、急躁、包容、挑剔、信任、怀疑、支持、质疑、合作、竞争、分享、保留、引领、跟随、创新、传统、情感、逻辑、直觉、分析、行动、思考、感受、判断、描述、回应
2. 根据回答质量决定标签数量：回答敷衍（如只有几个字、无实质内容）给2-3个；回答一般给3-5个；回答详细真实给5-8个
3. 只返回JSON数组格式如["标签1","标签2"]，不要其他内容。`
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

    // 删除旧标签，插入新标签
    await supabase.from('tags').delete().eq('user_id', currentUserId);
    const rows = tagTexts.map(text => ({ user_id: currentUserId, text, is_pinned: false, is_archived: false }));
    const { data: tags } = await supabase.from('tags').insert(rows).select();
    return { data: { tags } };
  }
};

export const tagsApi = {
  list: async () => {
    const { data } = await supabase.from('tags').select('*').eq('user_id', currentUserId).order('created_at');
    return { data: data || [] };
  },
  pin: async (id, pinned) => {
    if (pinned) {
      const { data } = await supabase.from('tags').select('id').eq('user_id', currentUserId).eq('is_pinned', true);
      if (data && data.length >= 3) throw { response: { data: { error: '最多置顶3个标签' } } };
    }
    const { data } = await supabase.from('tags').update({ is_pinned: pinned }).eq('id', id).select().single();
    return { data };
  },
  updateText: async (id, text) => {
    const { data } = await supabase.from('tags').update({ text }).eq('id', id).select().single();
    return { data };
  },
  archive: async (id) => {
    const { data } = await supabase.from('tags').update({ is_archived: true, is_pinned: false }).eq('id', id).select().single();
    return { data };
  },
  restore: async (id) => {
    const { data } = await supabase.from('tags').update({ is_archived: false }).eq('id', id).select().single();
    return { data };
  },
  addMbti: async (type) => {
    // 归档旧的MBTI标签
    const mbtiTypes = ['INTJ','INTP','ENTJ','ENTP','INFJ','INFP','ENFJ','ENFP','ISTJ','ISFJ','ESTJ','ESFJ','ISTP','ISFP','ESTP','ESFP'];
    await supabase.from('tags').update({ is_archived: true, is_pinned: false })
      .eq('user_id', currentUserId).in('text', mbtiTypes);
    const { data } = await supabase.from('tags').insert({ user_id: currentUserId, text: type, is_pinned: false, is_archived: false }).select().single();
    return { data };
  }
};

export const resonanceApi = {
  list: async () => {
    const { data } = await supabase.from('resonance_posts').select('*').order('created_at', { ascending: false }).limit(50);
    return { data: data || [] };
  },
  post: async (content) => {
    const anon_name = await getAnonName();
    const { data } = await supabase.from('resonance_posts').insert({ user_id: currentUserId, content, anon_name, resonance_count: 0 }).select().single();
    return { data };
  },
  resonate: async (postId, feeling) => {
    const { data: existing } = await supabase.from('resonances').select('id').eq('post_id', postId).eq('user_id', currentUserId).single();
    if (!existing) {
      await supabase.from('resonances').insert({ post_id: postId, user_id: currentUserId, feeling });
      await supabase.rpc('increment_resonance', { post_id: postId });
    }
    const { data: post } = await supabase.from('resonance_posts').select('resonance_count').eq('id', postId).single();
    return { data: { resonance_count: post?.resonance_count || 0 } };
  },
  hasResonated: async (postId) => {
    const { data } = await supabase.from('resonances').select('id').eq('post_id', postId).eq('user_id', currentUserId).single();
    return !!data;
  },
  getPerspective: async (postId) => {
    const { data } = await supabase.from('perspectives').select('content').eq('post_id', postId).order('created_at').limit(1).single();
    if (data) return { data: { content: data.content, is_ai: false } };
    return { data: { content: mockPerspective(), is_ai: true } };
  },
  addPerspective: async (postId, content) => {
    await supabase.from('perspectives').insert({ post_id: postId, user_id: currentUserId, content });
    return { data: { ok: true } };
  }
};

export const wordsApi = {
  list: () => Promise.resolve({ data: PRESET_WORDS }),
  getInterpretations: async (wordId) => {
    if (!wordId.startsWith('tag_')) {
      const { data: saved } = await supabase.from('word_interpretations').select('*').eq('word_id', wordId).order('created_at', { ascending: false });
      const preset = PRESET_INTERPRETATIONS[wordId] || [];
      return { data: [...(saved || []), ...preset] };
    }
    // 标签词条匹配相似预置解读
    const { data: tags } = await supabase.from('tags').select('text').eq('user_id', currentUserId).eq('id', wordId.replace('tag_', '')).single();
    const { data: saved } = await supabase.from('word_interpretations').select('*').eq('word_id', wordId).order('created_at', { ascending: false });
    if (tags) {
      const similarId = findSimilarWordId(tags.text);
      const borrowed = (similarId ? (PRESET_INTERPRETATIONS[similarId] || []) : []).slice(0, 3);
      return { data: [...(saved || []), ...borrowed] };
    }
    return { data: saved || [] };
  },
  addInterpretation: async (wordId, content) => {
    const anon_name = await getAnonName();
    const { data } = await supabase.from('word_interpretations').insert({ word_id: wordId, user_id: currentUserId, anon_name, content, like_count: 0 }).select().single();
    return { data };
  },
  likeInterpretation: async (wordId, interpId) => {
    const { data: existing } = await supabase.from('word_likes').select('id').eq('interpretation_id', interpId).eq('user_id', currentUserId).single();
    if (existing) {
      await supabase.from('word_likes').delete().eq('id', existing.id);
      await supabase.from('word_interpretations').update({ like_count: supabase.rpc('decrement', { x: 1 }) }).eq('id', interpId);
      return { data: { liked: false, cancelled: true } };
    }
    await supabase.from('word_likes').insert({ interpretation_id: interpId, user_id: currentUserId });
    await supabase.from('word_interpretations').update({ like_count: supabase.rpc('increment', { x: 1 }) }).eq('id', interpId);
    return { data: { liked: true } };
  },
  isLiked: async (interpId) => {
    const { data } = await supabase.from('word_likes').select('id').eq('interpretation_id', interpId).eq('user_id', currentUserId).single();
    return !!data;
  },
  addComment: async (wordId, interpId, content) => {
    const anon_name = await getAnonName();
    const { data } = await supabase.from('word_comments').insert({ interpretation_id: interpId, user_id: currentUserId, anon_name, content }).select().single();
    return { data };
  },
  getComments: async (interpId) => {
    const { data } = await supabase.from('word_comments').select('*').eq('interpretation_id', interpId).order('created_at');
    return { data: data || [] };
  }
};

export const labApi = {
  getScenes: () => Promise.resolve({ data: [] }),
  contributeScene: async ({ category, background, prompt }) => {
    const anon_name = await getAnonName();
    return { data: { id: 'u_' + Date.now(), category, background, prompt, anon_name } };
  },
  submitResponse: async ({ sceneId, sceneBackground, response, isPublic, category }) => {
    const anon_name = await getAnonName();
    const { data } = await supabase.from('lab_records').insert({
      user_id: currentUserId, scene_id: sceneId, scene_background: sceneBackground,
      category, response, is_public: isPublic, like_count: 0, anon_name
    }).select().single();
    return { data };
  },
  getPlaza: async (sort = 'time') => {
    let query = supabase.from('lab_records').select('*').eq('is_public', true);
    if (sort === 'likes') query = query.order('like_count', { ascending: false });
    else query = query.order('created_at', { ascending: false });
    const { data } = await query.limit(50);
    return { data: data || [] };
  },
  likeResponse: async (id) => {
    const { data: existing } = await supabase.from('lab_likes').select('id').eq('record_id', id).eq('user_id', currentUserId).single();
    if (existing) {
      await supabase.from('lab_likes').delete().eq('id', existing.id);
      return { data: { liked: false } };
    }
    await supabase.from('lab_likes').insert({ record_id: id, user_id: currentUserId });
    return { data: { liked: true } };
  },
  isLiked: async (id) => {
    const { data } = await supabase.from('lab_likes').select('id').eq('record_id', id).eq('user_id', currentUserId).single();
    return !!data;
  },
  getComments: async (id) => {
    const { data } = await supabase.from('lab_comments').select('*').eq('record_id', id).order('created_at');
    return { data: data || [] };
  },
  addComment: async (id, content) => {
    const anon_name = await getAnonName();
    const { data } = await supabase.from('lab_comments').insert({ record_id: id, user_id: currentUserId, anon_name, content }).select().single();
    return { data };
  },
  getRecords: async () => {
    const { data } = await supabase.from('lab_records').select('*').eq('user_id', currentUserId).order('created_at', { ascending: false });
    return { data: data || [] };
  },
  deleteRecord: async (id) => {
    await supabase.from('lab_records').delete().eq('id', id);
    return { data: { ok: true } };
  }
};

export const wordRequestApi = {
  submit: async (word) => {
    return { data: { ok: true, word } };
  }
};

export const tagRemoveApi = {
  // 申请撑掉标签
  request: async (tagId, tagText) => {
    // 检查是否已有待处理的申请
    const { data: existing } = await supabase.from('tag_remove_requests')
      .select('id').eq('tag_id', tagId).eq('status', 'pending').single();
    if (existing) return { data: { error: '已有待处理的申请' } };

    // 创建申请
    const { data: req } = await supabase.from('tag_remove_requests')
      .insert({ tag_id: tagId, requester_id: currentUserId, tag_text: tagText })
      .select().single();

    // 随机取3个其他用户发送投票通知
    const { data: voters } = await supabase.from('users')
      .select('id').neq('id', currentUserId).limit(3);
    if (voters?.length) {
      const notifications = voters.map(v => ({ request_id: req.id, voter_id: v.id }));
      await supabase.from('tag_remove_notifications').insert(notifications);
    }
    return { data: req };
  },

  // 获取我的待投票通知
  getNotifications: async () => {
    const { data } = await supabase.from('tag_remove_notifications')
      .select('*, tag_remove_requests(tag_text, requester_id, status, users(anon_name))')
      .eq('voter_id', currentUserId).eq('is_read', false)
      .order('created_at', { ascending: false });
    return { data: data || [] };
  },

  // 投票
  vote: async (requestId, notificationId, vote) => {
    // 记录投票
    await supabase.from('tag_remove_votes')
      .insert({ request_id: requestId, voter_id: currentUserId, vote });

    // 标记通知已读
    await supabase.from('tag_remove_notifications')
      .update({ is_read: true }).eq('id', notificationId);

    // 检查投票结果
    const { data: votes } = await supabase.from('tag_remove_votes')
      .select('vote').eq('request_id', requestId);
    const agrees = votes?.filter(v => v.vote === 'agree').length || 0;
    const total = votes?.length || 0;

    // 2/3同意则自动归档标签
    if (total >= 2 && agrees >= 2) {
      const { data: req } = await supabase.from('tag_remove_requests')
        .select('tag_id').eq('id', requestId).single();
      if (req?.tag_id) {
        await supabase.from('tags').update({ is_archived: true, is_pinned: false }).eq('id', req.tag_id);
      }
      await supabase.from('tag_remove_requests').update({ status: 'approved' }).eq('id', requestId);
    } else if (total >= 3 && agrees < 2) {
      await supabase.from('tag_remove_requests').update({ status: 'rejected' }).eq('id', requestId);
    }
    return { data: { ok: true } };
  },

  // 获取我的申请状态
  getMyRequests: async () => {
    const { data } = await supabase.from('tag_remove_requests')
      .select('*, tag_remove_votes(vote)')
      .eq('requester_id', currentUserId)
      .order('created_at', { ascending: false });
    return { data: data || [] };
  }
};
