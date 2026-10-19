import { CardData, ProfileData, Styles, TagData } from '../types/data';
import { normalizeCards } from './profileSchema';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ChatRole = 'system' | 'user' | 'assistant';

export interface AiChatMessage {
  role: Exclude<ChatRole, 'system'>;
  content: string;
}

export interface AiConfig {
  provider: 'openai' | 'gemini' | 'anthropic' | 'custom';
  apiKey: string;
  baseUrl: string;
  model: string;
}

export interface AiConfigResolution {
  config: AiConfig;
  usesFallbackApiKey: boolean;
}

export type AiErrorCode = 'NETWORK_ERROR' | 'PARSE_ERROR' | 'API_ERROR' | 'EMPTY_RESPONSE' | 'MALFORMED_CALL' | 'TRUNCATED' | 'TIMEOUT';

/** 每次请求的可选项：强制生成、取消信号、界面语言（让模型用同一种语言回复） */
export interface AiCallOptions {
  forceGenerate?: boolean;
  signal?: AbortSignal;
  locale?: string;
}

interface ToolFunctionCall {
  name: string;
  arguments: string;
}

interface ToolCall {
  id?: string;
  type: 'function';
  function: ToolFunctionCall;
}

interface OpenAiMessage {
  role: ChatRole;
  content: string | null;
  tool_calls?: ToolCall[];
}

interface OpenAiChoice {
  message?: OpenAiMessage;
  finish_reason?: string;
}

interface OpenAiResponse {
  choices?: OpenAiChoice[];
  error?: {
    message?: string;
  };
}

interface GeminiPart {
  text?: string;
  functionCall?: {
    name: string;
    args?: Record<string, unknown>;
  };
}

interface GeminiContent {
  role?: 'user' | 'model';
  parts?: GeminiPart[];
}

interface GeminiCandidate {
  content?: GeminiContent;
  finishReason?: string;
  finishMessage?: string;
}

interface GeminiResponse {
  candidates?: GeminiCandidate[];
  error?: {
    message?: string;
  };
}

interface AnthropicContentBlock {
  type: 'text' | 'tool_use';
  text?: string;
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
}

interface AnthropicResponse {
  content?: AnthropicContentBlock[];
  stop_reason?: string;
  error?: {
    type?: string;
    message?: string;
  };
}

export interface AiChatResult {
  assistantText?: string;
  generated?: Partial<ProfileData> & { cards?: unknown };
  debug?: AiDebugTrace;
}

export interface AiDebugTrace {
  provider: 'gemini' | 'openai-compatible' | 'anthropic';
  endpoint: string;
  model: string;
  historyLength: number;
  forceGenerate: boolean;
  requestPayload: unknown;
  responsePayload?: unknown;
  assistantText?: string;
  toolCall?: {
    name: string;
    argumentsPreview?: unknown;
  };
  parsedGeneratedPreview?: unknown;
  elapsedMs: number;
  error?: string;
  errorCode?: AiErrorCode;
}

// ---------------------------------------------------------------------------
// Constants & defaults
// ---------------------------------------------------------------------------

export const AI_LOCAL_STORAGE_KEY = 'profilecraft-ai-config';
const DEFAULT_PROVIDER = 'gemini';
const DEFAULT_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
// 2026-09 起 Gemini 2.5 系列只对已在使用的项目开放，新 Key 必须用新模型
export const DEFAULT_MODEL = 'gemini-3.5-flash-lite';
/** 旧版默认模型；读取到用户保存的旧默认值时自动升级到对应服务商的新默认值 */
export const LEGACY_DEFAULT_MODELS: Partial<Record<AiConfig['provider'], string[]>> = {
  gemini: ['gemini-2.5-flash-lite'],
  // gpt-4o-mini 于 2027-01-14 停用，OpenAI 推荐替换为 gpt-6-luna
  openai: ['gpt-4o-mini'],
};
/** 单次请求超时 */
export const AI_REQUEST_TIMEOUT_MS = 90_000;

const getEnvValue = (value: string | boolean | undefined): string => {
  return typeof value === 'string' ? value.trim() : '';
};

// ---------------------------------------------------------------------------
// Config resolution
// ---------------------------------------------------------------------------

/** 各服务商的默认地址和模型；地址 / 模型留空时用所选服务商自己的默认值 */
export const PROVIDER_PRESETS: Record<AiConfig['provider'], { baseUrl: string; model: string }> = {
  gemini: { baseUrl: DEFAULT_BASE_URL, model: DEFAULT_MODEL },
  openai: { baseUrl: 'https://api.openai.com/v1', model: 'gpt-6-luna' },
  anthropic: { baseUrl: 'https://api.anthropic.com', model: 'claude-haiku-5-5' },
  custom: { baseUrl: '', model: '' },
};

const isProvider = (value: string): value is AiConfig['provider'] => value in PROVIDER_PRESETS;

/**
 * 计算实际使用的配置。规则：
 * 1. 用户完全没配置（没填 Key，地址 / 模型是默认值或空），且构建时提供了兜底 Key → 整套使用兜底配置（包括 provider）。
 * 2. 否则只用用户的配置；地址 / 模型留空时取所选服务商的默认值。
 *    兜底 Key 不会和用户自己的地址混用，避免把站点的 Key 发到用户随手填的地址上。
 */
export const resolveAiConfig = (input: Partial<AiConfig>): AiConfigResolution => {
  const fallbackApiKey = getEnvValue(import.meta.env.VITE_AI_FALLBACK_API_KEY);
  const rawFallbackProvider = getEnvValue(import.meta.env.VITE_AI_FALLBACK_PROVIDER);
  const fallbackProvider: AiConfig['provider'] = isProvider(rawFallbackProvider) ? rawFallbackProvider : DEFAULT_PROVIDER;
  const fallbackBaseUrl = getEnvValue(import.meta.env.VITE_AI_FALLBACK_BASE_URL);
  const fallbackModel = getEnvValue(import.meta.env.VITE_AI_FALLBACK_MODEL);

  const userProvider: AiConfig['provider'] = input.provider && isProvider(input.provider) ? input.provider : DEFAULT_PROVIDER;
  const userPreset = PROVIDER_PRESETS[userProvider];
  const userApiKey = getEnvValue(input.apiKey);
  const userBaseUrl = getEnvValue(input.baseUrl);
  const userModel = getEnvValue(input.model);

  const untouched =
    !userApiKey &&
    (!userBaseUrl || userBaseUrl === userPreset.baseUrl) &&
    (!userModel || userModel === userPreset.model || Boolean(LEGACY_DEFAULT_MODELS[userProvider]?.includes(userModel)));

  if (untouched && fallbackApiKey) {
    const preset = PROVIDER_PRESETS[fallbackProvider];
    return {
      config: {
        provider: fallbackProvider,
        apiKey: fallbackApiKey,
        baseUrl: fallbackBaseUrl || preset.baseUrl,
        model: fallbackModel || preset.model,
      },
      usesFallbackApiKey: true,
    };
  }

  return {
    config: {
      provider: userProvider,
      apiKey: userApiKey,
      baseUrl: userBaseUrl || userPreset.baseUrl,
      model: userModel || userPreset.model,
    },
    usesFallbackApiKey: false,
  };
};

// ---------------------------------------------------------------------------
// Data normalization helpers
// ---------------------------------------------------------------------------

const defaultStyles = (overrides?: Styles): Styles => ({
  fontWeight: '400',
  fontSize: '15',
  fontFamily: '',
  ...overrides,
});

const defaultTitleStyles = (): Styles => ({
  fontWeight: '600',
  fontSize: '22',
  fontFamily: '',
});

const getSafeString = (value: unknown, fallback = ''): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return fallback;
};

const normalizeTags = (value: unknown): TagData[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === 'string') {
        return { text: item.trim() };
      }
      if (item && typeof item === 'object') {
        const raw = item as Record<string, unknown>;
        return {
          text: getSafeString(raw.text).trim(),
          type: getSafeString(raw.type) || undefined,
            };
      }
      return null;
    })
    .filter((tag): tag is TagData => Boolean(tag && tag.text));
};

// 这里只做 AI 输出特有的宽松兼容（字符串标签、groups 写法、默认文案等），
// 最终结构由 profileSchema.normalizeCards 统一校验，旧版 profileInfo 也在那里拆成细分区块。
type LooseElement = Record<string, unknown>;

const normalizeElement = (element: unknown): LooseElement | null => {
  if (!element || typeof element !== 'object') return null;
  const raw = element as Record<string, unknown>;
  const type = getSafeString(raw.type);

  if (type === 'paragraph') {
    return {
      type,
      text: getSafeString(raw.text || raw.content),
      styles: defaultStyles(),
    };
  }

  if (type === 'profileInfo') {
    return {
      type,
      nickname: getSafeString(raw.nickname || raw.value),
      gender: getSafeString(raw.gender),
      age: getSafeString(raw.age),
      location: getSafeString(raw.location),
      mbti: getSafeString(raw.mbti),
      items: Array.isArray(raw.items)
        ? raw.items
            .map((i) => {
              if (!i || typeof i !== 'object') return null;
              const item = i as Record<string, unknown>;
              const label = getSafeString(item.label);
              const value = getSafeString(item.value);
              if (!label && !value) return null;
              return { label, value };
            })
            .filter((i): i is { label: string; value: string } => Boolean(i))
        : undefined,
      textStyles: defaultStyles(),
    };
  }

  if (type === 'tagSection') {
    return {
      type,
      subheading: getSafeString(raw.subheading),
      subheadingStyles: defaultStyles(),
      tags: normalizeTags(raw.tags),
      tagStyles: defaultStyles({ fontWeight: '500', fontSize: '13' }),
    };
  }

  if (type === 'groupedTagSection') {
    let arcadeLabel = getSafeString(raw.arcadeLabel);
    let arcadeTags = normalizeTags(raw.arcade);
    let mobileLabel = getSafeString(raw.mobileLabel);
    let mobileTags = normalizeTags(raw.mobile);

    if (Array.isArray(raw.groups) && raw.groups.length > 0) {
      const g1 = raw.groups[0] as Record<string, unknown> | undefined;
      if (g1) {
        arcadeLabel = getSafeString(g1.title, arcadeLabel);
        arcadeTags = normalizeTags(g1.tags);
      }
      const g2 = raw.groups[1] as Record<string, unknown> | undefined;
      if (g2) {
        mobileLabel = getSafeString(g2.title, mobileLabel);
        mobileTags = normalizeTags(g2.tags);
      }
    }

    return {
      type,
      subheading: getSafeString(raw.subheading),
      subheadingStyles: defaultStyles(),
      arcadeLabel,
      arcadeLabelStyles: defaultStyles(),
      arcade: arcadeTags,
      mobileLabel,
      mobileLabelStyles: defaultStyles(),
      mobile: mobileTags,
      tagStyles: defaultStyles({ fontWeight: '500', fontSize: '13' }),
    };
  }

  if (type === 'tagSectionTwo') {
    return {
      type,
      subheading: getSafeString(raw.subheading),
      subheadingStyles: defaultStyles(),
      oshis: normalizeTags(raw.oshis),
      meta: normalizeTags(raw.meta),
    };
  }

  // heading / avatar / infoList / qrCode / divider 等交给 profileSchema 校验
  return raw;
};


export const normalizeGeneratedCards = (cards: unknown): CardData[] => {
  if (!Array.isArray(cards)) return [];

  // 统一走 profileSchema：去重 id、补齐布局、校验并拆分区块
  return normalizeCards(cards
    .map((card, index) => {
      if (!card || typeof card !== 'object') return null;
      const raw = card as Record<string, unknown>;
      const id = getSafeString(raw.id) || `card_${Date.now()}_${index}`;
      const title = getSafeString(raw.title);
      const rawElements = Array.isArray(raw.elements) ? raw.elements : [];
      const elements = rawElements.map(normalizeElement).filter((el): el is LooseElement => Boolean(el));
      const layoutSpan = getSafeString(raw.layoutSpan, index === 0 ? 'profile-card-span' : index === 1 ? 'about-me-card-span' : 'oshi-card-span');
      // 没有任何区块的卡片直接丢弃，不塞占位文字
      if (elements.length === 0) return null;

      return {
        id,
        title,
        titleStyles: defaultTitleStyles(),
        layoutSpan,
        elements,
      };
    })
    .filter(Boolean));
};

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

const BASE_SYSTEM_PROMPT = `你是「芝士扩列条」的采访助手，熟悉二次元、游戏、音游、虚拟主播、偶像、追星等兴趣圈。你通过轻松的多轮聊天了解用户，然后调用 generate_profile_card 工具生成一张扩列卡（用来在社群里介绍自己、找同好的个人卡片）。

【聊天方式】
- 像朋友聊天：每次只问 1～2 个具体问题，回复简短（一般不超过 80 字），可以对用户的回答做一句真诚的回应再提问。
- 回复只用纯文本，不要用 Markdown（不要 **加粗**、# 标题、列表符号）。
- 按需了解下面这些内容，用户不想说的就跳过，不要追问：
  1. 希望别人怎么称呼 TA（昵称）
  2. 主要的圈子和爱好（游戏、音游、番剧、偶像、乐队、画画……），以及常玩 / 常看的具体作品
  3. 推（喜欢的角色、声优、偶像、主播等）
  4. 想找什么样的朋友、希望一起做什么（扩列诉求）
  5. 可选：MBTI、所在城市或“线上”、雷点 / 边界（如同担拒否、不聊某些话题）
- 聊了 3～5 轮、已经有足够内容时，主动问用户要不要现在生成；用户说可以生成、或者点了「直接生成」时，立即调用工具。

【真实与隐私（必须遵守）】
- 只使用用户明确说过的信息。用户没提到的字段（年龄、性别、地区、MBTI 等）直接省略，绝不编造或猜测。可以润色措辞，但不能改变事实。
- 即使用户说“随便编”“帮我编得厉害点”，也不要编造兴趣、作品、推、经历或头衔：聊天时用一句话说明卡片只写真实信息，并问一两个简单问题；如果已经要求直接生成，就只生成有内容的部分，信息很少时卡片少一点没关系。
- subtitle 只能概括用户说过的内容；信息太少时用“正在扩列中”这类中性的话，不要夸张。
- 不主动询问真实姓名、手机号、具体住址、学校或公司全称、证件信息。用户自己提到时也不要写进卡片，联系方式由用户自己在卡片上添加二维码。
- 如果用户给的称呼看起来像真实全名（例如“王小明”），聊天时问一次要不要换成昵称；用户坚持或已经要求直接生成时，照用户说的写。
- 不生成歧视、骚扰、色情或针对他人的内容；用户要求时礼貌拒绝。

【生成卡片（调用 generate_profile_card）】
- userSettings.mainTitle：用户的昵称；userSettings.subtitle：一句话签名或成分总结，不超过 30 字。
- 卡片标题 2～6 个字。卡片按下面的顺序组织，没有对应信息的卡片就不要生成：
  1. 个人档案（layoutSpan: profile-card-span）：一个 profileInfo，items 只放用户提供过的信息，如 [{"label":"昵称","value":"…"},{"label":"MBTI","value":"…"}]。
  2. 爱好与涉猎（about-me-card-span）：一个或多个 tagSection，例如「常玩游戏」「在追的番」。
  3. 我的推（oshi-card-span）：用 tagSectionTwo 列出推（oshis），或用 groupedTagSection 分两组展示（如「游戏 / 动漫」「虚拟 / 现实」）。
  4. 扩列诉求（about-me-card-span）：一个 paragraph，用自然的口吻写想找什么样的朋友。
  5. 雷点 / 边界（profile-card-span）：用户提到时才生成，一个 paragraph，每条之间用换行分隔。
- 标签要短，每个不超过 10 个字，每组不超过 12 个；段落不超过 80 字。作品名、角色名保留用户的原始写法。
- tagSection、tagSectionTwo、groupedTagSection 都必须写 subheading（小标题），groupedTagSection 还要写两个组名；全部使用用户的语言。

【示例】
用户说：叫我星之海就好，ISTP，最近在打 Arcaea 和 Phigros，推初音未来，想找周末一起打音游的朋友。
可以生成：mainTitle "星之海"，subtitle "音游人 / ISTP / 寻找周末音游搭子"；
个人档案 items：昵称 = 星之海，MBTI = ISTP；
爱好与涉猎：tagSection「常玩音游」= [Arcaea, Phigros]；
我的推：tagSectionTwo oshis = [初音未来]；
扩列诉求：paragraph "想找周末一起打音游的朋友，水平不限，一起进步就好～"
（用户没说年龄、性别、城市，所以都不写。）`;

const LANGUAGE_NAMES: Record<string, string> = { 'zh-CN': '简体中文', 'en-US': 'English', 'ja-JP': '日本語', 'ko-KR': '한국어' };

/**
 * 实际发送的系统提示 = 基础提示 + 当前对话上下文。
 * 界面上的欢迎语不在消息历史里（Anthropic 要求第一条消息必须来自用户），所以在这里告诉模型它已经问过什么。
 */
const buildSystemPrompt = (locale?: string) => {
  const language = (locale && LANGUAGE_NAMES[locale]) || LANGUAGE_NAMES['zh-CN'];
  return `${BASE_SYSTEM_PROMPT}

【当前对话上下文】
- 界面已经替你发出了开场白：请用户介绍昵称和希望呈现的风格。用户的第一条消息就是对它的回答，不要再重复同样的问题。
- 用户界面语言是 ${language}。聊天回复和卡片内容都使用用户实际使用的语言；无法判断时使用 ${language}。示例只是格式参考，不要照抄示例的语言或内容。`;
};

// ---------------------------------------------------------------------------
// Tool schema — single source of truth
// ---------------------------------------------------------------------------

const stringArray = (description: string) => ({ type: 'array' as const, items: { type: 'string' as const }, description });

const TOOL_SCHEMA_DEF = {
  name: 'generate_profile_card',
  description: '信息足够时调用，生成扩列卡数据。只填用户明确提供过的信息，没有的字段省略。',
  parameters: {
    type: 'object' as const,
    properties: {
      userSettings: {
        type: 'object' as const,
        description: '页面顶部的标题区',
        properties: {
          mainTitle: { type: 'string' as const, description: '主标题，即用户的昵称' },
          subtitle: { type: 'string' as const, description: '副标题：一句话签名或成分总结，不超过 30 字' },
        },
      },
      cards: {
        type: 'array' as const,
        description: '卡片列表，按展示顺序排列',
        items: {
          type: 'object' as const,
          properties: {
            title: { type: 'string' as const, description: '卡片标题，2～6 个字' },
            layoutSpan: { type: 'string' as const, description: '卡片宽度：profile-card-span（1 列）、about-me-card-span（2 列）、oshi-card-span（通栏 3 列）' },
            elements: {
              type: 'array' as const,
              description: '卡片里的区块',
              items: {
                type: 'object' as const,
                properties: {
                  type: { type: 'string' as const, description: '区块类型：profileInfo（个人档案）、paragraph（段落）、heading（大字标题）、tagSection（标签组）、tagSectionTwo（推）、groupedTagSection（两组标签）、divider（分割线）' },
                  text: { type: 'string' as const, description: 'paragraph / heading 的文字。paragraph 不超过 80 字，换行用 \\n' },
                  items: {
                    type: 'array' as const,
                    description: 'profileInfo 的信息行，只放用户提供过的信息',
                    items: { type: 'object' as const, properties: { label: { type: 'string' as const, description: '如：昵称、MBTI、坐标' }, value: { type: 'string' as const } } },
                  },
                  subheading: { type: 'string' as const, description: 'tagSection / tagSectionTwo / groupedTagSection 的小标题（必填，用用户的语言）' },
                  tags: stringArray('tagSection 的标签，每个不超过 10 个字，最多 12 个'),
                  oshis: stringArray('tagSectionTwo 的推（角色、声优、偶像、主播等）'),
                  meta: stringArray('tagSectionTwo 的补充说明标签，如 "and more…"，可省略'),
                  arcadeLabel: { type: 'string' as const, description: 'groupedTagSection 第一组的组名，如「游戏」' },
                  arcade: stringArray('groupedTagSection 第一组的标签'),
                  mobileLabel: { type: 'string' as const, description: 'groupedTagSection 第二组的组名，如「动漫」' },
                  mobile: stringArray('groupedTagSection 第二组的标签'),
                },
                required: ['type'],
              },
            },
          },
          required: ['title', 'elements'],
        },
      },
    },
    required: ['cards', 'userSettings'],
  },
};

/** Build OpenAI-compatible tool schema */
const buildOpenAiTools = () => [
  {
    type: 'function' as const,
    function: {
      name: TOOL_SCHEMA_DEF.name,
      description: TOOL_SCHEMA_DEF.description,
      parameters: TOOL_SCHEMA_DEF.parameters,
    },
  },
];

/** Build Gemini tool schema (UPPERCASE types) */
const toGeminiSchema = (schema: Record<string, unknown>): Record<string, unknown> => {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(schema)) {
    if (key === 'type' && typeof value === 'string') {
      result[key] = value.toUpperCase();
    } else if (key === 'properties' && typeof value === 'object' && value !== null) {
      const props: Record<string, unknown> = {};
      for (const [pk, pv] of Object.entries(value as Record<string, unknown>)) {
        props[pk] = toGeminiSchema(pv as Record<string, unknown>);
      }
      result[key] = props;
    } else if (key === 'items' && typeof value === 'object' && value !== null) {
      result[key] = toGeminiSchema(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  return result;
};

const buildGeminiTools = () => [
  {
    functionDeclarations: [
      {
        name: TOOL_SCHEMA_DEF.name,
        description: TOOL_SCHEMA_DEF.description,
        parameters: toGeminiSchema(TOOL_SCHEMA_DEF.parameters as unknown as Record<string, unknown>),
      },
    ],
  },
];

/** Build Anthropic tool schema */
const buildAnthropicTools = () => [
  {
    name: TOOL_SCHEMA_DEF.name,
    description: TOOL_SCHEMA_DEF.description,
    input_schema: TOOL_SCHEMA_DEF.parameters,
  },
];

// ---------------------------------------------------------------------------
// Endpoint builders
// ---------------------------------------------------------------------------

const buildEndpoint = (baseUrl: string): string => {
  const trimmed = baseUrl.trim().replace(/\/+$/, '');
  return trimmed.endsWith('/chat/completions') ? trimmed : `${trimmed}/chat/completions`;
};

const sanitizeEndpoint = (endpoint: string): string => {
  return endpoint.replace(/([?&]key=)[^&]+/i, '$1***');
};

const safePreview = (value: unknown): unknown => {
  if (value === null || value === undefined) return value;
  const str = typeof value === 'string' ? value : JSON.stringify(value);
  if (str.length <= 2400) return value;
  return `${str.slice(0, 2400)}...(truncated)`;
};

// 明确选择的 provider 优先，只有“自定义”时才按地址猜测；
// 否则选了 OpenAI 却填 Gemini 的 OpenAI 兼容地址（…/v1beta/openai）时，会错发 Gemini 原生格式
const isGeminiProvider = (config: AiConfig): boolean => {
  if (config.provider !== 'custom') return config.provider === 'gemini';
  return /generativelanguage\.googleapis\.com/i.test(config.baseUrl) && !/\/openai\/?$/i.test(config.baseUrl);
};

const isAnthropicProvider = (config: AiConfig): boolean => {
  if (config.provider !== 'custom') return config.provider === 'anthropic';
  return /api\.anthropic\.com/i.test(config.baseUrl);
};

const buildGeminiEndpoint = (baseUrl: string, model: string): string => {
  let trimmed = baseUrl.trim().replace(/\/+$/, '');
  if (!trimmed) trimmed = DEFAULT_BASE_URL;
  if (/models\/.+:generateContent/i.test(trimmed)) return trimmed;
  const withVersion = /\/v1(beta)?$/i.test(trimmed) ? trimmed : `${trimmed}/v1beta`;
  return `${withVersion}/models/${encodeURIComponent(model)}:generateContent`;
};

const buildAnthropicEndpoint = (baseUrl: string): string => {
  const trimmed = baseUrl.trim().replace(/\/+$/, '');
  if (!trimmed) return 'https://api.anthropic.com/v1/messages';
  if (trimmed.endsWith('/messages')) return trimmed;
  if (/\/v1$/i.test(trimmed)) return `${trimmed}/messages`;
  return `${trimmed}/v1/messages`;
};

/** 合并相邻的同角色消息：请求失败后用户再发一条，会出现两条连续的 user 消息 */
const mergeConsecutive = (history: AiChatMessage[]): AiChatMessage[] =>
  history.reduce<AiChatMessage[]>((acc, m) => {
    const last = acc[acc.length - 1];
    if (last && last.role === m.role) {
      acc[acc.length - 1] = { role: m.role, content: `${last.content}\n\n${m.content}` };
    } else {
      acc.push({ ...m });
    }
    return acc;
  }, []);

// ---------------------------------------------------------------------------
// Gemini helpers
// ---------------------------------------------------------------------------

const toGeminiContents = (history: AiChatMessage[]): Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> => {
  return mergeConsecutive(history).map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
};

const extractTextFromGemini = (content?: GeminiContent): string => {
  if (!content?.parts?.length) return '';
  return content.parts
    .map((p) => p.text || '')
    .join('\n')
    .trim();
};

// ---------------------------------------------------------------------------
// Anthropic helpers
// ---------------------------------------------------------------------------

const toAnthropicMessages = (history: AiChatMessage[]): Array<{ role: 'user' | 'assistant'; content: string }> => {
  return mergeConsecutive(history).map((m) => ({
    role: m.role,
    content: m.content,
  }));
};

const extractTextFromAnthropic = (content?: AnthropicContentBlock[]): string => {
  if (!content?.length) return '';
  return content
    .filter((b) => b.type === 'text')
    .map((b) => b.text || '')
    .join('\n')
    .trim();
};

// ---------------------------------------------------------------------------
// JSON / text parsing
// ---------------------------------------------------------------------------

const parseJsonObjectFromText = (text: string): AiChatResult['generated'] => {
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace < 0 || lastBrace <= firstBrace) return undefined;

  const maybeJson = text.slice(firstBrace, lastBrace + 1);
  try {
    return JSON.parse(maybeJson);
  } catch {
    return undefined;
  }
};

const parseGeneratedObject = (value: unknown): AiChatResult['generated'] => {
  if (!value || typeof value !== 'object') return undefined;
  const raw = value as Record<string, unknown>;
  if (Array.isArray(raw.cards)) {
    return raw as AiChatResult['generated'];
  }
  if (Array.isArray(raw.data)) {
    return { cards: raw.data } as AiChatResult['generated'];
  }
  return undefined;
};

const parseToolArguments = (args: string): AiChatResult['generated'] => {
  try {
    const parsed = JSON.parse(args);
    return parsed;
  } catch {
    return undefined;
  }
};

// ---------------------------------------------------------------------------
// Shared debug trace builder helpers
// ---------------------------------------------------------------------------

type DebugBase = Pick<AiDebugTrace, 'model' | 'historyLength' | 'forceGenerate'>;

const buildDebugError = (
  base: DebugBase & { endpoint: string; requestPayload: unknown },
  provider: AiDebugTrace['provider'],
  error: string,
  errorCode: AiErrorCode,
  elapsedMs: number,
  responsePayload?: unknown,
): AiDebugTrace => ({
  provider,
  endpoint: base.endpoint,
  model: base.model,
  historyLength: base.historyLength,
  forceGenerate: base.forceGenerate,
  requestPayload: base.requestPayload,
  responsePayload: responsePayload ? safePreview(responsePayload) : undefined,
  elapsedMs,
  error,
  errorCode,
});

// ---------------------------------------------------------------------------
// Safe fetch wrapper
// ---------------------------------------------------------------------------

interface SafeFetchResult {
  response?: Response;
  data?: unknown;
  error?: string;
  errorCode?: AiErrorCode;
}

const safeFetchJson = async (endpoint: string, init: RequestInit): Promise<SafeFetchResult> => {
  let response: Response;
  try {
    response = await fetch(endpoint, init);
  } catch (fetchErr) {
    if (fetchErr instanceof DOMException && fetchErr.name === 'AbortError') throw fetchErr;
    const msg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
    return { error: `Network error: ${msg}`, errorCode: 'NETWORK_ERROR' };
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    return {
      response,
      error: `Non-JSON response (HTTP ${response.status})`,
      errorCode: 'PARSE_ERROR',
    };
  }

  return { response, data };
};

// ---------------------------------------------------------------------------
// Provider: Gemini
// ---------------------------------------------------------------------------

const callGemini = async (
  config: AiConfig,
  history: AiChatMessage[],
  options: AiCallOptions,
  startedAt: number,
): Promise<AiChatResult> => {
  const endpoint = buildGeminiEndpoint(config.baseUrl, config.model);
  const systemPrompt = buildSystemPrompt(options.locale);
  const geminiHeaders = { 'Content-Type': 'application/json', 'x-goog-api-key': config.apiKey };
  const requestPayload = {
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    contents: toGeminiContents(history),
    tools: buildGeminiTools(),
    toolConfig: options.forceGenerate
      ? {
          functionCallingConfig: {
            mode: 'ANY',
            allowedFunctionNames: ['generate_profile_card'],
          },
        }
      : {
          functionCallingConfig: {
            mode: 'AUTO',
          },
        },
  };

  const base = { endpoint: sanitizeEndpoint(endpoint), model: config.model, historyLength: history.length, forceGenerate: Boolean(options.forceGenerate), requestPayload: safePreview(requestPayload) };
  const elapsed = () => Date.now() - startedAt;

  const fetchResult = await safeFetchJson(endpoint, {
    method: 'POST',
    signal: options.signal,
    headers: geminiHeaders,
    body: JSON.stringify(requestPayload),
  });

  if (fetchResult.error) {
    return { debug: buildDebugError(base, 'gemini', fetchResult.error, fetchResult.errorCode!, elapsed()) };
  }

  const data = fetchResult.data as GeminiResponse;

  if (!fetchResult.response!.ok) {
    return {
      debug: buildDebugError(base, 'gemini', data?.error?.message || 'Gemini API error', 'API_ERROR', elapsed(), data),
    };
  }

  const firstCandidate = data.candidates?.[0];
  const isMalformedFunctionCall = firstCandidate?.finishReason === 'MALFORMED_FUNCTION_CALL';

  // MALFORMED_FUNCTION_CALL fallback for forceGenerate
  if (isMalformedFunctionCall && options.forceGenerate) {
    const fallbackPayload = {
      systemInstruction: {
        parts: [{ text: `${systemPrompt}\n\n现在不要调用函数，请直接输出 JSON 对象，格式必须是 {"cards":[...]}。` }],
      },
      contents: [
        ...toGeminiContents(history),
        { role: 'user' as const, parts: [{ text: '请直接输出最终 cards JSON。只允许返回 JSON。' }] },
      ],
      generationConfig: { responseMimeType: 'application/json' },
    };

    const fbResult = await safeFetchJson(endpoint, {
      method: 'POST',
      signal: options.signal,
      headers: geminiHeaders,
      body: JSON.stringify(fallbackPayload),
    });

    if (fbResult.error) {
      return {
        debug: buildDebugError(
          { ...base, requestPayload: safePreview({ primary: requestPayload, fallback: fallbackPayload }) },
          'gemini',
          fbResult.error,
          fbResult.errorCode!,
          elapsed(),
          { primary: data },
        ),
      };
    }

    const fbData = fbResult.data as GeminiResponse;
    const fbContent = fbData.candidates?.[0]?.content;
    const fbText = extractTextFromGemini(fbContent);
    const parsedFromText = parseJsonObjectFromText(fbText);
    const parsedFromObject = parseGeneratedObject(
      (() => { try { return fbText ? JSON.parse(fbText) : undefined; } catch { return undefined; } })(),
    );
    const parsed = parsedFromObject || parsedFromText;

    if (fbResult.response!.ok && parsed) {
      return {
        // 不把调试信息展示给用户；assistantText 为空时界面显示通用的“已应用”文案
        generated: parsed,
        debug: {
          provider: 'gemini',
          ...base,
          requestPayload: safePreview({ primary: requestPayload, fallback: fallbackPayload }),
          responsePayload: safePreview({ primary: data, fallback: fbData }),
          assistantText: fbText,
          parsedGeneratedPreview: safePreview(parsed),
          elapsedMs: elapsed(),
        },
      };
    }

    return {
      debug: buildDebugError(
        { ...base, requestPayload: safePreview({ primary: requestPayload, fallback: fallbackPayload }) },
        'gemini',
        firstCandidate?.finishMessage || fbData?.error?.message || 'Gemini MALFORMED_FUNCTION_CALL and JSON fallback failed.',
        'MALFORMED_CALL',
        elapsed(),
        { primary: data, fallback: fbData },
      ),
    };
  }

  if (isMalformedFunctionCall) {
    return {
      debug: buildDebugError(
        base,
        'gemini',
        firstCandidate?.finishMessage || 'Gemini MALFORMED_FUNCTION_CALL.',
        'MALFORMED_CALL',
        elapsed(),
        data,
      ),
    };
  }

  const content = data.candidates?.[0]?.content;
  const functionCall = content?.parts?.find((p) => p.functionCall)?.functionCall;
  if (functionCall?.name === 'generate_profile_card') {
    const parsed = parseGeneratedObject(functionCall.args);
    if (!parsed) {
      return { debug: buildDebugError(base, 'gemini', 'Function call arguments missing cards.', 'MALFORMED_CALL', elapsed(), data) };
    }
    return {
      assistantText: extractTextFromGemini(content) || undefined,
      generated: parsed,
      debug: {
        provider: 'gemini',
        ...base,
        responsePayload: safePreview(data),
        assistantText: extractTextFromGemini(content) || undefined,
        toolCall: { name: functionCall.name, argumentsPreview: safePreview(functionCall.args) },
        parsedGeneratedPreview: safePreview(parsed),
        elapsedMs: elapsed(),
      },
    };
  }

  const text = extractTextFromGemini(content);
  if (options.forceGenerate) {
    const parsed = parseJsonObjectFromText(text);
    if (parsed) {
      return {
        assistantText: text,
        generated: parsed,
        debug: {
          provider: 'gemini',
          ...base,
          responsePayload: safePreview(data),
          assistantText: text,
          parsedGeneratedPreview: safePreview(parsed),
          elapsedMs: elapsed(),
        },
      };
    }
  }

  return {
    assistantText: text,
    debug: {
      provider: 'gemini',
      ...base,
      responsePayload: safePreview(data),
      assistantText: text,
      elapsedMs: elapsed(),
    },
  };
};

// ---------------------------------------------------------------------------
// Provider: OpenAI-compatible
// ---------------------------------------------------------------------------

const callOpenAiCompatible = async (
  config: AiConfig,
  history: AiChatMessage[],
  options: AiCallOptions,
  startedAt: number,
): Promise<AiChatResult> => {
  const endpoint = buildEndpoint(config.baseUrl);
  const messages: OpenAiMessage[] = [
    { role: 'system', content: buildSystemPrompt(options.locale) },
    ...mergeConsecutive(history).map((m) => ({ role: m.role, content: m.content })),
  ];

  const isOpenAiOfficial = config.provider === 'openai';
  const forceToolChoice = isOpenAiOfficial
    ? { type: 'function' as const, function: { name: 'generate_profile_card' } }
    : 'auto' as const;

  // 不传 temperature：推理类模型（o 系列、GPT-5 之后）只接受默认值，传了会直接报 400
  const requestPayload: Record<string, unknown> = {
    model: config.model,
    messages,
    tools: buildOpenAiTools(),
  };
  // OpenAI 官方文档：GPT-6 系列在 Chat Completions 上只有 reasoning_effort 为 none 时才支持函数调用。
  // 旧模型（如 gpt-4o-mini）不认识这个参数，所以只对 GPT-6 系列添加。
  if (config.provider === 'openai' && /^gpt-6/i.test(config.model)) {
    requestPayload.reasoning_effort = 'none';
  }

  if (options.forceGenerate) {
    requestPayload.tool_choice = forceToolChoice;
    // Do NOT send response_format together with tool_choice — some APIs reject the combo
  }

  const base = { endpoint: sanitizeEndpoint(endpoint), model: config.model, historyLength: history.length, forceGenerate: Boolean(options.forceGenerate), requestPayload: safePreview(requestPayload) };
  const elapsed = () => Date.now() - startedAt;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (config.apiKey) {
    headers['Authorization'] = `Bearer ${config.apiKey}`;
  }

  const fetchResult = await safeFetchJson(endpoint, {
    method: 'POST',
    signal: options.signal,
    headers,
    body: JSON.stringify(requestPayload),
  });

  if (fetchResult.error) {
    return { debug: buildDebugError(base, 'openai-compatible', fetchResult.error, fetchResult.errorCode!, elapsed()) };
  }

  const data = fetchResult.data as OpenAiResponse;

  if (!fetchResult.response!.ok) {
    return {
      debug: buildDebugError(base, 'openai-compatible', data?.error?.message || 'AI service error', 'API_ERROR', elapsed(), data),
    };
  }

  const message = data.choices?.[0]?.message;
  if (!message) {
    return {
      debug: buildDebugError(base, 'openai-compatible', 'AI returned empty response.', 'EMPTY_RESPONSE', elapsed(), data),
    };
  }

  const firstToolCall = message.tool_calls?.[0];
  if (firstToolCall?.type === 'function' && firstToolCall.function.name === 'generate_profile_card') {
    const parsed = parseGeneratedObject(parseToolArguments(firstToolCall.function.arguments));
    if (!parsed) {
      // 参数被截断或不是合法 JSON：报错，而不是假装模型在追问
      const truncated = data.choices?.[0]?.finish_reason === 'length';
      return { debug: buildDebugError(base, 'openai-compatible', 'Tool call arguments are not valid card JSON.', truncated ? 'TRUNCATED' : 'MALFORMED_CALL', elapsed(), data) };
    }
    return {
      assistantText: message.content || undefined,
      generated: parsed,
      debug: {
        provider: 'openai-compatible',
        ...base,
        responsePayload: safePreview(data),
        assistantText: message.content || undefined,
        toolCall: { name: firstToolCall.function.name, argumentsPreview: safePreview(firstToolCall.function.arguments) },
        parsedGeneratedPreview: safePreview(parsed),
        elapsedMs: elapsed(),
      },
    };
  }

  // forceGenerate but model didn't call the tool — try parsing text
  if (options.forceGenerate && message.content) {
    const parsed = parseJsonObjectFromText(message.content);
    if (parsed) {
      return {
        assistantText: message.content,
        generated: parsed,
        debug: {
          provider: 'openai-compatible',
          ...base,
          responsePayload: safePreview(data),
          assistantText: message.content,
          parsedGeneratedPreview: safePreview(parsed),
          elapsedMs: elapsed(),
        },
      };
    }
  }

  return {
    assistantText: message.content || '',
    debug: {
      provider: 'openai-compatible',
      ...base,
      responsePayload: safePreview(data),
      assistantText: message.content || '',
      elapsedMs: elapsed(),
    },
  };
};

// ---------------------------------------------------------------------------
// Provider: Anthropic
// ---------------------------------------------------------------------------

const callAnthropic = async (
  config: AiConfig,
  history: AiChatMessage[],
  options: AiCallOptions,
  startedAt: number,
): Promise<AiChatResult> => {
  const endpoint = buildAnthropicEndpoint(config.baseUrl);

  const anthropicTools = buildAnthropicTools();
  const requestPayload: Record<string, unknown> = {
    model: config.model,
    max_tokens: 8192,
    system: buildSystemPrompt(options.locale),
    messages: toAnthropicMessages(history),
    tools: anthropicTools,
  };

  if (options.forceGenerate) {
    requestPayload.tool_choice = { type: 'tool', name: 'generate_profile_card' };
  }

  const base = { endpoint: sanitizeEndpoint(endpoint), model: config.model, historyLength: history.length, forceGenerate: Boolean(options.forceGenerate), requestPayload: safePreview(requestPayload) };
  const elapsed = () => Date.now() - startedAt;

  const fetchResult = await safeFetchJson(endpoint, {
    method: 'POST',
    signal: options.signal,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
      // 从浏览器直接调用 Anthropic API 必须带这个头，否则 CORS 预检会被拒绝
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify(requestPayload),
  });

  if (fetchResult.error) {
    return { debug: buildDebugError(base, 'anthropic', fetchResult.error, fetchResult.errorCode!, elapsed()) };
  }

  const data = fetchResult.data as AnthropicResponse;

  if (!fetchResult.response!.ok) {
    return {
      debug: buildDebugError(base, 'anthropic', data?.error?.message || 'Anthropic API error', 'API_ERROR', elapsed(), data),
    };
  }

  const text = extractTextFromAnthropic(data.content);
  const toolUseBlock = data.content?.find((b) => b.type === 'tool_use' && b.name === 'generate_profile_card');

  if (toolUseBlock) {
    // 输出被 max_tokens 截断时，tool_use 的参数是不完整的
    if (data.stop_reason === 'max_tokens') {
      return { debug: buildDebugError(base, 'anthropic', 'Response truncated by max_tokens.', 'TRUNCATED', elapsed(), data) };
    }
    const parsed = parseGeneratedObject(toolUseBlock.input);
    if (!parsed) {
      return { debug: buildDebugError(base, 'anthropic', 'Tool input missing cards.', 'MALFORMED_CALL', elapsed(), data) };
    }
    return {
      assistantText: text || undefined,
      generated: parsed,
      debug: {
        provider: 'anthropic',
        ...base,
        responsePayload: safePreview(data),
        assistantText: text || undefined,
        toolCall: { name: 'generate_profile_card', argumentsPreview: safePreview(toolUseBlock.input) },
        parsedGeneratedPreview: safePreview(parsed),
        elapsedMs: elapsed(),
      },
    };
  }

  // forceGenerate but no tool call — try parsing text as JSON
  if (options.forceGenerate && text) {
    const parsed = parseJsonObjectFromText(text);
    if (parsed) {
      return {
        assistantText: text,
        generated: parsed,
        debug: {
          provider: 'anthropic',
          ...base,
          responsePayload: safePreview(data),
          assistantText: text,
          parsedGeneratedPreview: safePreview(parsed),
          elapsedMs: elapsed(),
        },
      };
    }
  }

  return {
    assistantText: text,
    debug: {
      provider: 'anthropic',
      ...base,
      responsePayload: safePreview(data),
      assistantText: text,
      elapsedMs: elapsed(),
    },
  };
};

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export const callAiInterviewer = async (
  config: AiConfig,
  history: AiChatMessage[],
  options?: AiCallOptions,
): Promise<AiChatResult> => {
  const startedAt = Date.now();
  const opts = options || {};

  if (!config.apiKey && config.provider !== 'custom') {
    throw new Error('Missing API Key.');
  }

  if (isGeminiProvider(config)) {
    return callGemini(config, history, opts, startedAt);
  }

  if (isAnthropicProvider(config)) {
    return callAnthropic(config, history, opts, startedAt);
  }

  return callOpenAiCompatible(config, history, opts, startedAt);
};
