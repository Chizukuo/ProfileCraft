import { CardData, CardElement, ProfileData, Styles, TagData } from '../types/data';

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

export type AiErrorCode = 'NETWORK_ERROR' | 'PARSE_ERROR' | 'API_ERROR' | 'EMPTY_RESPONSE' | 'MALFORMED_CALL';

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
const DEFAULT_MODEL = 'gemini-2.5-flash-lite';

const getEnvValue = (value: string | boolean | undefined): string => {
  return typeof value === 'string' ? value.trim() : '';
};

// ---------------------------------------------------------------------------
// Config resolution
// ---------------------------------------------------------------------------

export const resolveAiConfig = (input: Partial<AiConfig>): AiConfigResolution => {
  const fallbackProvider = getEnvValue(import.meta.env.VITE_AI_FALLBACK_PROVIDER) as AiConfig['provider'] || '';
  const fallbackApiKey = getEnvValue(import.meta.env.VITE_AI_FALLBACK_API_KEY);
  const fallbackBaseUrl = getEnvValue(import.meta.env.VITE_AI_FALLBACK_BASE_URL);
  const fallbackModel = getEnvValue(import.meta.env.VITE_AI_FALLBACK_MODEL);

  const userProvider = input.provider;
  const userApiKey = getEnvValue(input.apiKey);
  const rawUserBaseUrl = getEnvValue(input.baseUrl);
  const rawUserModel = getEnvValue(input.model);

  const isImplicitDefaultConfig =
    !userApiKey &&
    (!rawUserBaseUrl || rawUserBaseUrl === DEFAULT_BASE_URL) &&
    (!rawUserModel || rawUserModel === DEFAULT_MODEL);

  const userBaseUrl = isImplicitDefaultConfig ? '' : rawUserBaseUrl;
  const userModel = isImplicitDefaultConfig ? '' : rawUserModel;

  const provider = userProvider || fallbackProvider || DEFAULT_PROVIDER;
  const apiKey = userApiKey || fallbackApiKey;
  const baseUrl = userBaseUrl || fallbackBaseUrl || DEFAULT_BASE_URL;
  const model = userModel || fallbackModel || DEFAULT_MODEL;

  return {
    config: { provider, apiKey, baseUrl, model },
    usesFallbackApiKey: !userApiKey && Boolean(fallbackApiKey),
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
          styles: raw.styles && typeof raw.styles === 'object' ? (raw.styles as Styles) : undefined,
        };
      }
      return null;
    })
    .filter((tag): tag is TagData => Boolean(tag && tag.text));
};

const normalizeElement = (element: unknown): CardElement | null => {
  if (!element || typeof element !== 'object') return null;
  const raw = element as Record<string, unknown>;
  const type = getSafeString(raw.type);

  if (type === 'paragraph') {
    return {
      type,
      text: getSafeString(raw.text || raw.content),
      styles: defaultStyles(raw.styles as Styles),
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
      textStyles: defaultStyles(raw.textStyles as Styles),
      styles: raw.styles && typeof raw.styles === 'object' ? (raw.styles as Styles) : undefined,
    };
  }

  if (type === 'tagSection') {
    return {
      type,
      subheading: getSafeString(raw.subheading, '标签'),
      subheadingStyles: defaultStyles(raw.subheadingStyles as Styles),
      tags: normalizeTags(raw.tags),
      tagStyles: defaultStyles((raw.tagStyles as Styles) || { fontWeight: '500', fontSize: '13' }),
      styles: raw.styles && typeof raw.styles === 'object' ? (raw.styles as Styles) : undefined,
    };
  }

  if (type === 'groupedTagSection') {
    let arcadeLabel = getSafeString(raw.arcadeLabel, '分组1:');
    let arcadeTags = normalizeTags(raw.arcade);
    let mobileLabel = getSafeString(raw.mobileLabel, '分组2:');
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
      subheading: getSafeString(raw.subheading, '分组标签'),
      subheadingStyles: defaultStyles(raw.subheadingStyles as Styles),
      arcadeLabel,
      arcadeLabelStyles: defaultStyles(raw.arcadeLabelStyles as Styles),
      arcade: arcadeTags,
      mobileLabel,
      mobileLabelStyles: defaultStyles(raw.mobileLabelStyles as Styles),
      mobile: mobileTags,
      tagStyles: defaultStyles((raw.tagStyles as Styles) || { fontWeight: '500', fontSize: '13' }),
      styles: raw.styles && typeof raw.styles === 'object' ? (raw.styles as Styles) : undefined,
    };
  }

  if (type === 'tagSectionTwo') {
    return {
      type,
      subheading: getSafeString(raw.subheading, '我的推'),
      subheadingStyles: defaultStyles(raw.subheadingStyles as Styles),
      oshis: normalizeTags(raw.oshis),
      meta: normalizeTags(raw.meta),
      styles: raw.styles && typeof raw.styles === 'object' ? (raw.styles as Styles) : undefined,
    };
  }

  return null;
};

const fallbackCardElements = (): CardElement[] => [
  {
    type: 'paragraph',
    text: '这里是 AI 生成的内容，你可以继续编辑。',
    styles: defaultStyles(),
  },
];

export const normalizeGeneratedCards = (cards: unknown): CardData[] => {
  if (!Array.isArray(cards)) return [];

  return cards
    .map((card, index) => {
      if (!card || typeof card !== 'object') return null;
      const raw = card as Record<string, unknown>;
      const id = getSafeString(raw.id) || `card_${Date.now()}_${index}`;
      const title = getSafeString(raw.title, `AI 卡片 ${index + 1}`);
      const rawElements = Array.isArray(raw.elements) ? raw.elements : [];
      const elements = rawElements.map(normalizeElement).filter((el): el is CardElement => Boolean(el));
      const layoutSpan = getSafeString(raw.layoutSpan, index === 0 ? 'profile-card-span' : index === 1 ? 'about-me-card-span' : 'oshi-card-span');

      return {
        id,
        title,
        titleStyles: raw.titleStyles && typeof raw.titleStyles === 'object' ? (raw.titleStyles as Styles) : defaultTitleStyles(),
        layoutSpan,
        elements: elements.length > 0 ? elements : fallbackCardElements(),
      };
    })
    .filter((card): card is CardData => Boolean(card));
};

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

const defaultSystemPrompt = `你是一个深谙 ACG 文化与各类青年流行文化（如二次元、游戏、虚拟主播、偶像等）的专属"个人扩列卡片"生成助手。

你的核心任务是：通过轻松、自然的引导式多轮对话，帮助用户挖掘并梳理出具有个人特色和文化属性的信息，最终调用 generate_profile_card 工具，为他们生成排版精美、信息丰富且具有社区身份认同感的扩列卡片（Profile Card）。

【对话策略与互动规范】
1. **自然亲切**：以朋友聊天的方式展开，每次围绕一个主题抛出 1-2 个具体问题，避免连珠炮式的提问（查户口）。
2. **基础与进阶并重**：不仅要收拢基础属性（昵称、地区、MBTI、核心主推或爱好），更要引导用户分享能体现资历或热爱的"进阶细节"。例如：
   - 音游玩家可询问常玩机种、自豪成绩或段位。
   - 企划/VTB厨可询问主推、是否参与线下或购买周边。
   - 竞技游戏玩家可询问区服、段位或擅长位置。
   - 适当询问是否有"雷点"、"同担拒否"等社交偏好声明，尊重个性化需求。
3. **适时收网**：当收集到的信息足以构建一张丰满的卡片，或者用户主动表示"可以生成了"、"没什么可补充的"时，果断调用 generate_profile_card 结束对话，切勿无意义地拖延。
4. **针对轻量级模型优化**：指令要清晰，避免过于复杂的逻辑推演，直接将核心要素抽取为结构化数据。

【UI 排版与数据结构生成规范（严格执行）】
优秀的卡片需要将高密度信息合理拆解并运用网格布局，请严格遵循以下卡片拆分与组件搭配规范：

- 整体配置 (userSettings)：核心必填项。mainTitle 为用户尊称/昵称，subtitle 为高度凝练的一句话签名、成分总结或个人宣言。
- Card 1【个人档案】：layoutSpan 必须为 'profile-card-span'（窄列）。主体必须为 profileInfo 类型（含昵称、性别/代名词、年龄、坐标等）。若用户有长段自我评价，可在其下追加 paragraph 组件进行展示。
- Card 2【涉猎与技能】：layoutSpan 必须为 'about-me-card-span'（中宽列）。推荐使用 tagSection 组件，将用户的游戏、副业、特长、性格标签矩阵化呈现。若类目庞杂，可拆分为多个 tagSection。
- Card 3【主推与成分】：layoutSpan 必须为 'oshi-card-span'（宽列）。强烈推荐使用 groupedTagSection 组件进行分组呈现（例如："街机 / 移动端"，"虚拟区 / 现实区"，"游戏 / 动漫"等），让核心热爱一目了然。
- Card 4【社交/扩列宣言】：（按需生成）layoutSpan 推荐 'about-me-card-span'。使用 paragraph 组件，用地道的语境写出用户期望结交怎样的同好，或展示自己的社交态度。

【优质排版数据参考示例】
- userSettings: {"mainTitle": "星之海喵", "subtitle": "探索型玩家 / 杂食党 / ISTP / 寻找周末开黑搭子"}
- Card 1 (profile-card-span): profileInfo (昵称: 星之海喵, 坐标: 线上活跃)。下方 paragraph: "主打一个随缘的杂食系玩家，除了恐怖游戏什么都愿意尝试一下，重度收集控。"
- Card 2 (about-me-card-span): tagSection "当前爱好: 音游, 摄影, 重度剧情体验", "主要阵地: Steam, Switch, PS5"
- Card 3 (oshi-card-span): groupedTagSection 分组一 "音乐游戏": ["Arcaea", "Phigros", "Cytus II"], 分组二 "长线沉迷": ["最终幻想14", "星露谷物语"]`;

// ---------------------------------------------------------------------------
// Tool schema — single source of truth
// ---------------------------------------------------------------------------

const TOOL_SCHEMA_DEF = {
  name: 'generate_profile_card',
  description: '当信息足够时，生成可直接渲染的扩列卡片数据。',
  parameters: {
    type: 'object' as const,
    properties: {
      userSettings: {
        type: 'object' as const,
        description: '页面级别的全局设置',
        properties: {
          mainTitle: { type: 'string' as const, description: '页面顶部的主标题（通常为用户昵称）' },
          subtitle: { type: 'string' as const, description: '页面顶部的副标题（通常为一句话简介或ID）' },
        },
      },
      cards: {
        type: 'array' as const,
        items: {
          type: 'object' as const,
          properties: {
            id: { type: 'string' as const },
            title: { type: 'string' as const },
            layoutSpan: { type: 'string' as const, description: '卡片宽度类名，建议：profile-card-span, about-me-card-span, oshi-card-span' },
            elements: {
              type: 'array' as const,
              items: {
                type: 'object' as const,
                properties: {
                  type: { type: 'string' as const, description: '类型：paragraph, profileInfo, tagSection, groupedTagSection, tagSectionTwo' },
                  text: { type: 'string' as const, description: 'paragraph的文本内容' },
                  nickname: { type: 'string' as const, description: 'profileInfo的昵称' },
                  gender: { type: 'string' as const, description: 'profileInfo的性别' },
                  age: { type: 'string' as const, description: 'profileInfo的年龄' },
                  location: { type: 'string' as const, description: 'profileInfo的地区/常驻' },
                  mbti: { type: 'string' as const, description: 'profileInfo的mbti/属性' },
                  items: { type: 'array' as const, items: { type: 'object' as const, properties: { label: { type: 'string' as const }, value: { type: 'string' as const } } }, description: 'profileInfo的额外自定义键值对' },
                  subheading: { type: 'string' as const, description: 'tagSection/groupedTagSection的副标题' },
                  tags: { type: 'array' as const, items: { type: 'string' as const }, description: 'tagSection的标签数组' },
                  arcadeLabel: { type: 'string' as const, description: 'groupedTagSection的街机/分组1标题' },
                  arcade: { type: 'array' as const, items: { type: 'string' as const }, description: 'groupedTagSection的分组1标签数组' },
                  mobileLabel: { type: 'string' as const, description: 'groupedTagSection的手游/分组2标题' },
                  mobile: { type: 'array' as const, items: { type: 'string' as const }, description: 'groupedTagSection的分组2标签数组' },
                  oshis: { type: 'array' as const, items: { type: 'string' as const }, description: 'tagSectionTwo的推数组' },
                  meta: { type: 'array' as const, items: { type: 'string' as const }, description: 'tagSectionTwo的附加信息数组' },
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

const isGeminiProvider = (config: AiConfig): boolean => {
  return config.provider === 'gemini' || /generativelanguage\.googleapis\.com/i.test(config.baseUrl);
};

const isAnthropicProvider = (config: AiConfig): boolean => {
  return config.provider === 'anthropic' || /anthropic\.com/i.test(config.baseUrl);
};

const buildGeminiEndpoint = (baseUrl: string, model: string, apiKey: string): string => {
  let trimmed = baseUrl.trim().replace(/\/+$/, '');

  if (!trimmed) {
    trimmed = 'https://generativelanguage.googleapis.com/v1beta';
  }

  if (/models\/.+:generateContent/i.test(trimmed)) {
    const separator = trimmed.includes('?') ? '&' : '?';
    return `${trimmed}${separator}key=${encodeURIComponent(apiKey)}`;
  }

  const withVersion = /\/v1(beta)?$/i.test(trimmed) ? trimmed : `${trimmed}/v1beta`;
  return `${withVersion}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
};

const buildAnthropicEndpoint = (baseUrl: string): string => {
  const trimmed = baseUrl.trim().replace(/\/+$/, '');
  if (!trimmed) return 'https://api.anthropic.com/v1/messages';
  if (trimmed.endsWith('/messages')) return trimmed;
  return `${trimmed}/v1/messages`;
};

// ---------------------------------------------------------------------------
// Gemini helpers
// ---------------------------------------------------------------------------

const toGeminiContents = (history: AiChatMessage[]): Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> => {
  return history.map((m) => ({
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
  return history.map((m) => ({
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
  options: { forceGenerate?: boolean },
  startedAt: number,
): Promise<AiChatResult> => {
  const endpoint = buildGeminiEndpoint(config.baseUrl, config.model, config.apiKey);
  const requestPayload = {
    systemInstruction: {
      parts: [{ text: defaultSystemPrompt }],
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
    headers: { 'Content-Type': 'application/json' },
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
        parts: [{ text: `${defaultSystemPrompt}\n\n现在不要调用函数，请直接输出 JSON 对象，格式必须是 {"cards":[...]}。` }],
      },
      contents: [
        ...toGeminiContents(history),
        { role: 'user' as const, parts: [{ text: '请直接输出最终 cards JSON。只允许返回 JSON。' }] },
      ],
      generationConfig: { responseMimeType: 'application/json' },
    };

    const fbResult = await safeFetchJson(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
        assistantText: 'MALFORMED_FUNCTION_CALL fallback succeeded.',
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
    const parsed = functionCall.args as AiChatResult['generated'];
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
  options: { forceGenerate?: boolean },
  startedAt: number,
): Promise<AiChatResult> => {
  const endpoint = buildEndpoint(config.baseUrl);
  const messages: OpenAiMessage[] = [
    { role: 'system', content: defaultSystemPrompt },
    ...history.map((m) => ({ role: m.role, content: m.content })),
  ];

  const isOpenAiOfficial = config.provider === 'openai';
  const forceToolChoice = isOpenAiOfficial
    ? { type: 'function' as const, function: { name: 'generate_profile_card' } }
    : 'auto' as const;

  const requestPayload: Record<string, unknown> = {
    model: config.model,
    messages,
    tools: buildOpenAiTools(),
    temperature: 0.7,
  };

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
    const parsed = parseToolArguments(firstToolCall.function.arguments);
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
  options: { forceGenerate?: boolean },
  startedAt: number,
): Promise<AiChatResult> => {
  const endpoint = buildAnthropicEndpoint(config.baseUrl);

  const anthropicTools = buildAnthropicTools();
  const requestPayload: Record<string, unknown> = {
    model: config.model,
    max_tokens: 4096,
    system: defaultSystemPrompt,
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
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
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

  if (toolUseBlock?.input) {
    const parsed = toolUseBlock.input as AiChatResult['generated'];
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
  options?: { forceGenerate?: boolean },
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
