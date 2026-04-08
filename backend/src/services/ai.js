const OpenAI = require('openai');
require('dotenv').config();

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 从问答文本中提取 5~8 个标签
async function extractTags(answers) {
  const text = answers.map((a, i) => `Q${i + 1}: ${a}`).join('\n');
  const res = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `你是一个中性、不评判的沟通观察者。
根据用户的问答内容，提取 5~8 个描述其沟通特质的关键词标签。
要求：
- 标签用中文，2~8 个字，描述性而非评判性（如"容易急"而非"脾气差"）
- 不使用褒贬明显的词
- 只返回 JSON 数组，格式：["标签1","标签2",...]`
      },
      { role: 'user', content: text }
    ],
    temperature: 0.5
  });
  try {
    return JSON.parse(res.choices[0].message.content);
  } catch {
    return res.choices[0].message.content.match(/[\u4e00-\u9fa5a-zA-Z0-9·\-]{2,8}/g) || [];
  }
}

// 为共振厅帖子生成一条"换个视角"
async function generatePerspective(postContent) {
  const res = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `你是一个温和、中性的旁观者。
用户分享了一段沟通感受，请从另一个可能的视角提供一条简短的观察（50字以内）。
要求：
- 不评判对错，不给建议
- 语气平静，像是"也许对方当时……"这样的表达
- 只返回这一句话，不加任何前缀`
      },
      { role: 'user', content: postContent }
    ],
    temperature: 0.7
  });
  return res.choices[0].message.content.trim();
}

// 根据用户标签生成个性化实验卡片
async function generateExperiment(tags) {
  const res = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `你是一个沟通实验设计者。
根据用户的沟通特质标签，生成一条极小的、可立即执行的沟通实验。
要求：
- 只做一件具体的小事，不是课程，不是建议
- 语气平静，不说教，不鼓励
- 50字以内
- 只返回实验内容，不加任何前缀`
      },
      { role: 'user', content: `用户标签：${tags.join('、')}` }
    ],
    temperature: 0.8
  });
  return res.choices[0].message.content.trim();
}

module.exports = { extractTags, generatePerspective, generateExperiment };
