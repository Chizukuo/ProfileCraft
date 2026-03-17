import { CardData, CardElement, ProfileData, Styles, TagData } from '../types/data';

type ChatRole = 'system' | 'user' | 'assistant';

export interface AiChatMessage {
  role: Exclude<ChatRole, 'system'>;
  content: string;
}

export interface AiConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export interface AiConfigResolution {
  config: AiConfig;
  usesFallbackApiKey: boolean;
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

export interface AiChatResult {
  assistantText?: string;
  generated?: Partial<ProfileData> & { cards?: unknown };
  debug?: AiDebugTrace;
}

export interface AiDebugTrace {
  provider: 'gemini' | 'openai-compatible';
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
}

export const AI_LOCAL_STORAGE_KEY = 'profilecraft-ai-config';
const DEFAULT_BASE_URL = 'https://api.siliconflow.cn/v1';
const DEFAULT_MODEL = 'Qwen/Qwen2.5-7B-Instruct';

const getEnvValue = (value: string | boolean | undefined): string => {
  return typeof value === 'string' ? value.trim() : '';
};

export const resolveAiConfig = (input: Partial<AiConfig>): AiConfigResolution => {
  const fallbackApiKey = getEnvValue(import.meta.env.VITE_AI_FALLBACK_API_KEY);
  const fallbackBaseUrl = getEnvValue(import.meta.env.VITE_AI_FALLBACK_BASE_URL);
  const fallbackModel = getEnvValue(import.meta.env.VITE_AI_FALLBACK_MODEL);

  const userApiKey = getEnvValue(input.apiKey);
  const rawUserBaseUrl = getEnvValue(input.baseUrl);
  const rawUserModel = getEnvValue(input.model);

  // Treat UI defaults as "not explicitly set" when user has no own key,
  // so environment fallback (e.g. Gemini) can take effect.
  const isImplicitDefaultConfig =
    !userApiKey &&
    (!rawUserBaseUrl || rawUserBaseUrl === DEFAULT_BASE_URL) &&
    (!rawUserModel || rawUserModel === DEFAULT_MODEL);

  const userBaseUrl = isImplicitDefaultConfig ? '' : rawUserBaseUrl;
  const userModel = isImplicitDefaultConfig ? '' : rawUserModel;

  const apiKey = userApiKey || fallbackApiKey;
  const baseUrl = userBaseUrl || fallbackBaseUrl || DEFAULT_BASE_URL;
  const model = userModel || fallbackModel || DEFAULT_MODEL;

  return {
    config: { apiKey, baseUrl, model },
    usesFallbackApiKey: !userApiKey && Boolean(fallbackApiKey),
  };
};

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

const defaultSystemPrompt = `你是一个贴心、懂二次元和亚文化（特别是地下偶像、音游、声优厨、VTB、二游等圈子）的扩列卡片生成助手。

你的最终目标是：通过引导式的多轮对话，帮用户挖掘出他们身上的“硬核/亚文化”属性，并调用 generate_profile_card 工具，为他们生成一张排版精美、信息密度高、且具有“圈内人味”的扩列卡片。

【对话策略与行为要求】
1. 像朋友一样自然对话，每次只抛出 1-2 个具体的问题，不要查户口。
2. 基础信息兜底：确保收集到昵称、性别/年龄（可选）、坐标/常驻地、以及核心爱好/推。
3. **硬核挖掘（核心！）**：绝不满足于“我玩音游”或“我喜欢LL”这种表面回答。你必须主动追问圈内黑话或细节。
   - 比如：玩什么音游？段位多少？主打街机还是移动端？
   - 比如：推哪个企划的谁？是单推、箱推还是CP？跑过线下Live吗？
   - 比如：打瓦（Valorant）主玩什么位置？什么段位？
   - 比如：自我介绍有没有“雷点”、“同担拒否”、“梦女”或“只扩不列”等特殊声明？
4. 只有当用户的信息足够“硬核、丰满”，或者用户明确说“够了/直接生成”时，才调用 generate_profile_card，切勿过早结束对话。

【UI 排版与数据结构要求（极其重要！）】
生成的扩列卡片绝不能把所有信息挤在一起，必须将信息拆分到多个不同的 Card (卡片) 中，充分利用网格布局。

强制的卡片拆分与组件搭配规范：
- userSettings：必须填充。mainTitle 设为用户昵称，subtitle 设为用户的一句话签名、成分总结或ID（例如：纯良 / メンヘラ / 低能 / 东横）。
- Card 1【个人档案】：layoutSpan 必须填 'profile-card-span'（窄列）。必须包含 profileInfo（昵称、性别、年龄、坐标等）。可以在 profileInfo 下方追加一个 paragraph 组件，用一段具有个人色彩的文字做自我介绍。
- Card 2【爱好/涉猎/属性】：layoutSpan 必须填 'about-me-card-span'（中等宽列）。推荐使用 tagSection 来罗列用户的游戏、爱好、特长、甚至 MBTI/性格标签。如果标签多，可以分成多个 tagSection（如“常玩游戏”、“个人属性”）。
- Card 3【推/企划/成分】：layoutSpan 必须填 'oshi-card-span'（宽列）。当用户有大量喜欢的角色、企划、或者区分“街机/手游”时，强烈推荐使用 groupedTagSection（分组展示，例如“女声优”一组，“二次元”一组）。或者使用 tagSectionTwo。
- Card 4【扩列宣言/寻友启事】（可选但推荐）：layoutSpan 填 'profile-card-span' 或 'about-me-card-span'。使用 paragraph，用极具圈内风格的语言写出用户想找什么样的同好。

【优质排版参考示例】
（此为结构参考，文案需根据用户实际输入进行创作）：
- userSettings: {"mainTitle": "兲武/てんご", "subtitle": "纯良 / メンヘラ / 大脑左右互搏派 / 东横 / 借金100万"}
- Card 1 (profile-card-span): profileInfo 组件列出基础信息。下方跟 paragraph：“二三次不分号。成分不算复杂，主要是二偶和女声优相关，倾向于现场派（？），比起吃谷更偏向跑活...”
- Card 2 (about-me-card-span): tagSection 罗列“爱好: 音游, 光棒, 跑活”和“主要涉猎: Love Live!, Project Sekai, BanG Dream!”
- Card 3 (oshi-card-span): groupedTagSection 分组一 "街机音游": ["舞萌DX", "中二节奏(手台)"]，分组二 "移动端": ["BanG Dream!", "Arcaea"]。或者分“女声优”和“二次元”两组推。`;

const tools = [
  {
    type: 'function',
    function: {
      name: 'generate_profile_card',
      description: '当信息足够时，生成可直接渲染的扩列卡片数据。',
      parameters: {
        type: 'object',
        properties: {
          userSettings: {
            type: 'object',
            description: '页面级别的全局设置',
            properties: {
              mainTitle: { type: 'string', description: '页面顶部的主标题（通常为用户昵称）' },
              subtitle: { type: 'string', description: '页面顶部的副标题（通常为一句话简介或ID）' }
            }
          },
          cards: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                layoutSpan: { type: 'string', description: '卡片宽度类名，建议：profile-card-span, about-me-card-span, oshi-card-span' },
                elements: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      type: { type: 'string', description: '类型：paragraph, profileInfo, tagSection, groupedTagSection, tagSectionTwo' },
                      text: { type: 'string', description: 'paragraph的文本内容' },
                      nickname: { type: 'string', description: 'profileInfo的昵称' },
                      gender: { type: 'string', description: 'profileInfo的性别' },
                      age: { type: 'string', description: 'profileInfo的年龄' },
                      location: { type: 'string', description: 'profileInfo的地区/常驻' },
                      mbti: { type: 'string', description: 'profileInfo的mbti/属性' },
                      items: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, value: { type: 'string' } } }, description: 'profileInfo的额外自定义键值对' },
                      subheading: { type: 'string', description: 'tagSection/groupedTagSection的副标题' },
                      tags: { type: 'array', items: { type: 'string' }, description: 'tagSection的标签数组' },
                      arcadeLabel: { type: 'string', description: 'groupedTagSection的街机/分组1标题' },
                      arcade: { type: 'array', items: { type: 'string' }, description: 'groupedTagSection的分组1标签数组' },
                      mobileLabel: { type: 'string', description: 'groupedTagSection的手游/分组2标题' },
                      mobile: { type: 'array', items: { type: 'string' }, description: 'groupedTagSection的分组2标签数组' },
                      oshis: { type: 'array', items: { type: 'string' }, description: 'tagSectionTwo的推数组' },
                      meta: { type: 'array', items: { type: 'string' }, description: 'tagSectionTwo的附加信息数组' }
                    },
                    required: ['type'],
                  },
                },
              },
              required: ['title', 'elements'],
            },
          },
        },
        required: ['cards'],
      },
    },
  },
];

const geminiTools = [
  {
    functionDeclarations: [
      {
        name: 'generate_profile_card',
        description: '当信息足够时，生成可直接渲染的扩列卡片数据。',
        parameters: {
          type: 'OBJECT',
          properties: {
            userSettings: {
              type: 'OBJECT',
              description: '页面级别的全局设置',
              properties: {
                mainTitle: { type: 'STRING', description: '页面顶部的主标题（通常为用户昵称）' },
                subtitle: { type: 'STRING', description: '页面顶部的副标题（通常为一句话简介或ID）' }
              }
            },
            cards: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  id: { type: 'STRING' },
                  title: { type: 'STRING' },
                  layoutSpan: { type: 'STRING', description: '卡片宽度类名，建议：profile-card-span, about-me-card-span, oshi-card-span' },
                  elements: {
                    type: 'ARRAY',
                    items: {
                      type: 'OBJECT',
                      properties: {
                        type: { type: 'STRING', description: '支持: paragraph, profileInfo, tagSection, groupedTagSection, tagSectionTwo' },
                        text: { type: 'STRING', description: 'paragraph 类型的文本' },
                        nickname: { type: 'STRING', description: 'profileInfo 类型的昵称' },
                        gender: { type: 'STRING', description: 'profileInfo 类型的性别' },
                        age: { type: 'STRING', description: 'profileInfo 类型的年龄' },
                        location: { type: 'STRING', description: 'profileInfo 类型的地区' },
                        mbti: { type: 'STRING', description: 'profileInfo 类型的MBTI' },
                        items: { type: 'ARRAY', items: { type: 'OBJECT', properties: { label: { type: 'STRING' }, value: { type: 'STRING' } } }, description: 'profileInfo 的其他信息' },
                        subheading: { type: 'STRING', description: '标签区块副标题' },
                        tags: { type: 'ARRAY', items: { type: 'STRING' }, description: 'tagSection 的标签' },
                        arcadeLabel: { type: 'STRING', description: 'groupedTagSection 第一组标题' },
                        arcade: { type: 'ARRAY', items: { type: 'STRING' }, description: 'groupedTagSection 第一组标签' },
                        mobileLabel: { type: 'STRING', description: 'groupedTagSection 第二组标题' },
                        mobile: { type: 'ARRAY', items: { type: 'STRING' }, description: 'groupedTagSection 第二组标签' },
                        oshis: { type: 'ARRAY', items: { type: 'STRING' }, description: 'tagSectionTwo 的推' },
                        meta: { type: 'ARRAY', items: { type: 'STRING' }, description: 'tagSectionTwo 的补充' }
                      },
                      required: ['type'],
                    },
                  },
                },
                required: ['title', 'elements'],
              },
            },
          },
          required: ['cards'],
        },
      },
    ],
  },
];

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

const isGeminiBaseUrl = (baseUrl: string): boolean => {
  return /generativelanguage\.googleapis\.com/i.test(baseUrl);
};

const buildGeminiEndpoint = (baseUrl: string, model: string, apiKey: string): string => {
  const trimmed = baseUrl.trim().replace(/\/+$/, '');

  if (/models\/.+:generateContent/i.test(trimmed)) {
    const separator = trimmed.includes('?') ? '&' : '?';
    return `${trimmed}${separator}key=${encodeURIComponent(apiKey)}`;
  }

  const withVersion = /\/v1(beta)?$/i.test(trimmed) ? trimmed : `${trimmed}/v1beta`;
  return `${withVersion}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
};

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

export const callAiInterviewer = async (
  config: AiConfig,
  history: AiChatMessage[],
  options?: { forceGenerate?: boolean }
): Promise<AiChatResult> => {
  const startedAt = Date.now();
  const resolved = resolveAiConfig(config).config;
  if (!resolved.apiKey) {
    throw new Error('缺少 API Key，请在设置中填写或配置 VITE_AI_FALLBACK_API_KEY');
  }

  if (isGeminiBaseUrl(resolved.baseUrl)) {
    const endpoint = buildGeminiEndpoint(resolved.baseUrl, resolved.model, resolved.apiKey);
    const requestPayload = {
      systemInstruction: {
        parts: [{ text: defaultSystemPrompt }],
      },
      contents: toGeminiContents(history),
      tools: geminiTools,
      toolConfig: options?.forceGenerate
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

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload),
    });

    const data: GeminiResponse = await response.json();
    if (!response.ok) {
      return {
        debug: {
          provider: 'gemini',
          endpoint: sanitizeEndpoint(endpoint),
          model: resolved.model,
          historyLength: history.length,
          forceGenerate: Boolean(options?.forceGenerate),
          requestPayload: safePreview(requestPayload),
          responsePayload: safePreview(data),
          elapsedMs: Date.now() - startedAt,
          error: data?.error?.message || 'Gemini 服务请求失败',
        },
      };
    }

    const firstCandidate = data.candidates?.[0];
    const isMalformedFunctionCall = firstCandidate?.finishReason === 'MALFORMED_FUNCTION_CALL';

    if (isMalformedFunctionCall && options?.forceGenerate) {
      const fallbackPayload = {
        systemInstruction: {
          parts: [{ text: `${defaultSystemPrompt}\n\n现在不要调用函数，请直接输出 JSON 对象，格式必须是 {"cards":[...]}。` }],
        },
        contents: [
          ...toGeminiContents(history),
          {
            role: 'user' as const,
            parts: [{ text: '请直接输出最终 cards JSON。只允许返回 JSON。' }],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
        },
      };

      const fallbackResponse = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fallbackPayload),
      });

      const fallbackData: GeminiResponse = await fallbackResponse.json();
      const fallbackContent = fallbackData.candidates?.[0]?.content;
      const fallbackText = extractTextFromGemini(fallbackContent);
      const parsedFromText = parseJsonObjectFromText(fallbackText);
      const parsedFromObject = parseGeneratedObject(
        (() => {
          try {
            return fallbackText ? JSON.parse(fallbackText) : undefined;
          } catch {
            return undefined;
          }
        })()
      );
      const parsed = parsedFromObject || parsedFromText;

      if (fallbackResponse.ok && parsed) {
        return {
          assistantText: '已自动修复函数调用异常并完成生成。',
          generated: parsed,
          debug: {
            provider: 'gemini',
            endpoint: sanitizeEndpoint(endpoint),
            model: resolved.model,
            historyLength: history.length,
            forceGenerate: true,
            requestPayload: safePreview({ primary: requestPayload, fallback: fallbackPayload }),
            responsePayload: safePreview({ primary: data, fallback: fallbackData }),
            assistantText: fallbackText,
            parsedGeneratedPreview: safePreview(parsed),
            elapsedMs: Date.now() - startedAt,
          },
        };
      }

      return {
        debug: {
          provider: 'gemini',
          endpoint: sanitizeEndpoint(endpoint),
          model: resolved.model,
          historyLength: history.length,
          forceGenerate: true,
          requestPayload: safePreview({ primary: requestPayload, fallback: fallbackPayload }),
          responsePayload: safePreview({ primary: data, fallback: fallbackData }),
          elapsedMs: Date.now() - startedAt,
          error:
            firstCandidate?.finishMessage ||
            fallbackData?.error?.message ||
            'Gemini 函数调用格式错误，且自动 JSON 兜底解析失败。',
        },
      };
    }

    if (isMalformedFunctionCall) {
      return {
        debug: {
          provider: 'gemini',
          endpoint: sanitizeEndpoint(endpoint),
          model: resolved.model,
          historyLength: history.length,
          forceGenerate: Boolean(options?.forceGenerate),
          requestPayload: safePreview(requestPayload),
          responsePayload: safePreview(data),
          elapsedMs: Date.now() - startedAt,
          error: firstCandidate?.finishMessage || 'Gemini 函数调用格式错误，请重试或切换模型。',
        },
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
          endpoint: sanitizeEndpoint(endpoint),
          model: resolved.model,
          historyLength: history.length,
          forceGenerate: Boolean(options?.forceGenerate),
          requestPayload: safePreview(requestPayload),
          responsePayload: safePreview(data),
          assistantText: extractTextFromGemini(content) || undefined,
          toolCall: {
            name: functionCall.name,
            argumentsPreview: safePreview(functionCall.args),
          },
          parsedGeneratedPreview: safePreview(parsed),
          elapsedMs: Date.now() - startedAt,
        },
      };
    }

    const text = extractTextFromGemini(content);
    if (options?.forceGenerate) {
      const parsed = parseJsonObjectFromText(text);
      if (parsed) {
        return {
          assistantText: text,
          generated: parsed,
          debug: {
            provider: 'gemini',
            endpoint: sanitizeEndpoint(endpoint),
            model: resolved.model,
            historyLength: history.length,
            forceGenerate: Boolean(options?.forceGenerate),
            requestPayload: safePreview(requestPayload),
            responsePayload: safePreview(data),
            assistantText: text,
            parsedGeneratedPreview: safePreview(parsed),
            elapsedMs: Date.now() - startedAt,
          },
        };
      }
    }

    return {
      assistantText: text,
      debug: {
        provider: 'gemini',
        endpoint: sanitizeEndpoint(endpoint),
        model: resolved.model,
        historyLength: history.length,
        forceGenerate: Boolean(options?.forceGenerate),
        requestPayload: safePreview(requestPayload),
        responsePayload: safePreview(data),
        assistantText: text,
        elapsedMs: Date.now() - startedAt,
      },
    };
  }

  const endpoint = buildEndpoint(resolved.baseUrl);

  const messages: OpenAiMessage[] = [
    { role: 'system', content: defaultSystemPrompt },
    ...history.map((m) => ({ role: m.role, content: m.content })),
  ];

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${resolved.apiKey}`,
    },
    body: JSON.stringify({
      model: resolved.model,
      messages,
      tools,
      tool_choice: options?.forceGenerate
        ? { type: 'function', function: { name: 'generate_profile_card' } }
        : 'auto',
      temperature: 0.7,
    }),
  });

  const data: OpenAiResponse = await response.json();
  if (!response.ok) {
    return {
      debug: {
        provider: 'openai-compatible',
        endpoint: sanitizeEndpoint(endpoint),
        model: resolved.model,
        historyLength: history.length,
        forceGenerate: Boolean(options?.forceGenerate),
        requestPayload: safePreview({
          model: resolved.model,
          messages,
          tools,
          tool_choice: options?.forceGenerate
            ? { type: 'function', function: { name: 'generate_profile_card' } }
            : 'auto',
          temperature: 0.7,
        }),
        responsePayload: safePreview(data),
        elapsedMs: Date.now() - startedAt,
        error: data?.error?.message || 'AI 服务请求失败',
      },
    };
  }

  const message = data.choices?.[0]?.message;
  if (!message) {
    return {
      debug: {
        provider: 'openai-compatible',
        endpoint: sanitizeEndpoint(endpoint),
        model: resolved.model,
        historyLength: history.length,
        forceGenerate: Boolean(options?.forceGenerate),
        requestPayload: safePreview({
          model: resolved.model,
          messages,
          tools,
          tool_choice: options?.forceGenerate
            ? { type: 'function', function: { name: 'generate_profile_card' } }
            : 'auto',
          temperature: 0.7,
        }),
        responsePayload: safePreview(data),
        elapsedMs: Date.now() - startedAt,
        error: 'AI 返回为空，请重试',
      },
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
        endpoint: sanitizeEndpoint(endpoint),
        model: resolved.model,
        historyLength: history.length,
        forceGenerate: Boolean(options?.forceGenerate),
        requestPayload: safePreview({
          model: resolved.model,
          messages,
          tools,
          tool_choice: options?.forceGenerate
            ? { type: 'function', function: { name: 'generate_profile_card' } }
            : 'auto',
          temperature: 0.7,
        }),
        responsePayload: safePreview(data),
        assistantText: message.content || undefined,
        toolCall: {
          name: firstToolCall.function.name,
          argumentsPreview: safePreview(firstToolCall.function.arguments),
        },
        parsedGeneratedPreview: safePreview(parsed),
        elapsedMs: Date.now() - startedAt,
      },
    };
  }

  return {
    assistantText: message.content || '',
    debug: {
      provider: 'openai-compatible',
      endpoint: sanitizeEndpoint(endpoint),
      model: resolved.model,
      historyLength: history.length,
      forceGenerate: Boolean(options?.forceGenerate),
      requestPayload: safePreview({
        model: resolved.model,
        messages,
        tools,
        tool_choice: options?.forceGenerate
          ? { type: 'function', function: { name: 'generate_profile_card' } }
          : 'auto',
        temperature: 0.7,
      }),
      responsePayload: safePreview(data),
      assistantText: message.content || '',
      elapsedMs: Date.now() - startedAt,
    },
  };
};
