'use strict';
// 润色引擎：把 ASR 的口语原文整理成干净可用的文本。
// 这是「越用越懂我」的落点：个人风格画像 + 场景档位 都在这里注入 prompt。
const config = require('./config');

/**
 * @param {string} raw           ASR 原始转写
 * @param {object} opts
 * @param {string} opts.scene    场景档位：chat|email|doc|code|social|default
 * @param {string} opts.style    个人语言画像（一段自然语言描述，L2 学习产物）
 * @param {string[]} opts.terms  专有名词/热词提示（帮助模型不改错专名）
 * @returns {Promise<string>}
 */
async function polish(raw, opts = {}) {
  const text = (raw || '').trim();
  if (!text) return '';
  if (!config.polish.enabled || !config.polish.apiKey) return text; // 无 key 时原样返回，不阻塞

  const system = buildSystemPrompt(opts);
  const body = {
    model: config.polish.model,
    max_tokens: config.polish.maxTokens,
    temperature: 0.3,
    // 关掉长思考：润色是轻任务，不需要推理，关掉后 13-18s -> 约 1s
    enable_thinking: false,
    thinking: { type: 'disabled' },
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: text },
    ],
  };

  const data = await postWithRetry(`${config.polish.baseURL}/chat/completions`, body);
  // MiMo 是推理模型：content=最终答案，reasoning_content=思考（忽略）
  const out = data?.choices?.[0]?.message?.content?.trim();
  return out || text;
}

// MiMo 推理模型响应慢，且偶发瞬时网络错误 —— 带指数退避重试。
async function postWithRetry(url, body, tries = 3) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 60000);
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.polish.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      }).finally(() => clearTimeout(timer));
      if (!resp.ok) {
        const t = await resp.text().catch(() => '');
        throw new Error(`MiMo HTTP ${resp.status}: ${t.slice(0, 200)}`);
      }
      return await resp.json();
    } catch (e) {
      lastErr = e;
      if (i < tries - 1) await new Promise((r) => setTimeout(r, 800 * (i + 1)));
    }
  }
  throw lastErr;
}

const SCENE_RULES = {
  chat: '【场景：聊天/IM（微信、钉钉、飞书等）】保留口语语气和人情味，句子短、自然，标点从简；不要写成公文腔，不要用书名号/项目符号这类正式排版。',
  email: '【场景：邮件/正式沟通】用词得体、有条理，该分段分段、该分点分点，礼貌完整，可保留称呼与结尾。',
  doc: '【场景：文档/写作】整理成通顺规范的书面语，逻辑清楚，适当分段或用列表；数字、日期、金额规范化。',
  code: '【场景：代码/技术/终端】技术名词、命令、变量、缩写一律用英文原文（如 API、Docker、useState、npm install、git commit），保留精确性；不要把专有名词翻译或润色成散文，不要规范化数字与符号，尽量贴近原话。',
  social: '【场景：社交（小红书/朋友圈）】语气活泼亲切，可适度加 emoji 与分行，像发帖的口吻。',
  default: '【场景：通用】整理为通顺自然、干净可用的文本。',
};

function buildSystemPrompt(opts) {
  const scene = SCENE_RULES[opts.scene] || SCENE_RULES.default;
  const isCode = opts.scene === 'code';
  const parts = [
    '你是一个语音输入的文本整理器。用户在对着麦克风口述，你要把语音转写的口语原文整理成可以直接使用的干净文本。',
    '规则：',
    '1. 去掉「嗯、啊、那个、就是说、然后然后」等口水词和无意义重复。',
    '2. 修正明显的口误、同音错别字（如 的/得/地、在/再），补全合理标点。',
    '3. 保持原意，不要增删信息、不要扩写、不要回答内容里的问题——你只做整理，不做创作。',
    '4. 该分点时分点、该分段时分段；口述里说的「第一 第二」「首先 其次」可整理成列表。',
    isCode
      ? '5. 数字、代码、符号、命令保持原样，不要规范化。'
      : '5. 数字、金额、日期、时间、百分比用常规书面写法：如「两千三」→「2300」、「百分之二十」→「20%」、「下午三点」→「下午3点」、「一月五号」→「1月5日」；但不确定的口语数字不要强行改。',
    '6. 直接输出整理后的文本，不要任何解释、前言或引号包裹。',
    scene,
  ];
  if (opts.structure) {
    parts.push(
      '【梳理模式·重要】主动把口述整理成结构清晰的呈现：识别其中并列的要点/步骤/原因/清单，用分点、编号或分组组织起来，并按合理的逻辑顺序排列。' +
      '即使用户说的时候顺序颠倒（先说第三点、再说第一点）、中途跳跃、来回补充遗漏，也要帮他理顺成条理清晰的结构。' +
      '但只重组和归纳用户真正说过的内容——不新增信息、不扩写、不回答问题。'
    );
  }
  if (opts.style) {
    parts.push(`用户的个人语言风格画像（请贴合其习惯）：${opts.style}`);
  }
  if (opts.terms && opts.terms.length) {
    parts.push(
      `以下是用户词库中的专有名词，若语音里出现同音/近音，请写成这些标准写法，不要改错：${opts.terms.slice(0, 60).join('、')}`
    );
  }
  if (opts.context) {
    parts.push(
      '以下是从用户知识库检索到的相关背景资料，仅用于帮助你理解领域、把人名/产品名/项目名/黑话写正确。' +
      '严禁把这些内容加进输出、严禁据此扩写或回答——你只整理用户口述的原话：\n' + opts.context.slice(0, 1200)
    );
  }
  return parts.join('\n');
}

module.exports = { polish, buildSystemPrompt, SCENE_RULES };
