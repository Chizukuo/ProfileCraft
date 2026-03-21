import { CardData, CardElement, ProfileData, Styles, TagData } from '../types/data';

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
const DEFAULT_PROVIDER = 'gemini';
const DEFAULT_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
const DEFAULT_MODEL = 'gemini-2.5-flash-lite';

const getEnvValue = (value: string | boolean | undefined): string => {
  return typeof value === 'string' ? value.trim() : '';
};

export const resolveAiConfig = (input: Partial<AiConfig>): AiConfigResolution => {
  const fallbackProvider = getEnvValue(import.meta.env.VITE_AI_FALLBACK_PROVIDER) as AiConfig['provider'] || '';
  const fallbackApiKey = getEnvValue(import.meta.env.VITE_AI_FALLBACK_API_KEY);
  const fallbackBaseUrl = getEnvValue(import.meta.env.VITE_AI_FALLBACK_BASE_URL);
  const fallbackModel = getEnvValue(import.meta.env.VITE_AI_FALLBACK_MODEL);

  const userProvider = input.provider;
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

  const provider = userProvider || fallbackProvider || DEFAULT_PROVIDER;
  const apiKey = userApiKey || fallbackApiKey;
  const baseUrl = userBaseUrl || fallbackBaseUrl || DEFAULT_BASE_URL;
  const model = userModel || fallbackModel || DEFAULT_MODEL;

  return {
    config: { provider, apiKey, baseUrl, model },
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

const defaultSystemPrompt = `你是一个深谙 ACG 文化与各类青年流行文化（如二次元、游戏、虚拟主播、偶像等）的专属“个人扩列卡片”生成助手。

你的核心任务是：通过轻松、自然的引导式多轮对话，帮助用户挖掘并梳理出具有个人特色和文化属性的信息，最终调用 generate_profile_card 工具，为他们生成排版精美、信息丰富且具有社区身份认同感的扩列卡片（Profile Card）。

【对话策略与互动规范】
1. **自然亲切**：以朋友聊天的方式展开，每次围绕一个主题抛出 1-2 个具体问题，避免连珠炮式的提问（查户口）。
2. **基础与进阶并重**：不仅要收拢基础属性（昵称、地区、MBTI、核心主推或爱好），更要引导用户分享能体现资历或热爱的“进阶细节”。例如：
   - 音游玩家可询问常玩机种、自豪成绩或段位。
   - 企划/VTB厨可询问主推、是否参与线下或购买周边。
   - 竞技游戏玩家可询问区服、段位或擅长位置。
   - 适当询问是否有“雷点”、“同担拒否”等社交偏好声明，尊重个性化需求。
3. **适时收网**：当收集到的信息足以构建一张丰满的卡片，或者用户主动表示“可以生成了”、“没什么可补充的”时，果断调用 generate_profile_card 结束对话，切勿无意义地拖延。
4. **针对轻量级模型优化**：指令要清晰，避免过于复杂的逻辑推演，直接将核心要素抽取为结构化数据。

【UI 排版与数据结构生成规范（严格执行）】
优秀的卡片需要将高密度信息合理拆解并运用网格布局，请严格遵循以下卡片拆分与组件搭配规范：

- 整体配置 (userSettings)：核心必填项。mainTitle 为用户尊称/昵称，subtitle 为高度凝练的一句话签名、成分总结或个人宣言。
- Card 1【个人档案】：layoutSpan 必须为 'profile-card-span'（窄列）。主体必须为 profileInfo 类型（含昵称、性别/代名词、年龄、坐标等）。若用户有长段自我评价，可在其下追加 paragraph 组件进行展示。
- Card 2【涉猎与技能】：layoutSpan 必须为 'about-me-card-span'（中宽列）。推荐使用 tagSection 组件，将用户的游戏、副业、特长、性格标签矩阵化呈现。若类目庞杂，可拆分为多个 tagSection。
- Card 3【主推与成分】：layoutSpan 必须为 'oshi-card-span'（宽列）。强烈推荐使用 groupedTagSection 组件进行分组呈现（例如：“街机 / 移动端”，“虚拟区 / 现实区”，“游戏 / 动漫”等），让核心热爱一目了然。
- Card 4【社交/扩列宣言】：（按需生成）layoutSpan 推荐 'about-me-card-span'。使用 paragraph 组件，用地道的语境写出用户期望结交怎样的同好，或展示自己的社交态度。

【优质排版数据参考示例】
- userSettings: {"mainTitle": "星之海喵", "subtitle": "探索型玩家 / 杂食党 / ISTP / 寻找周末开黑搭子"}
- Card 1 (profile-card-span): profileInfo (昵称: 星之海喵, 坐标: 线上活跃)。下方 paragraph: “主打一个随缘的杂食系玩家，除了恐怖游戏什么都愿意尝试一下，重度收集控。”
- Card 2 (about-me-card-span): tagSection “当前爱好: 音游, 摄影, 重度剧情体验”, “主要阵地: Steam, Switch, PS5”
- Card 3 (oshi-card-span): groupedTagSection 分组一 "音乐游戏": ["Arcaea", "Phigros", "Cytus II"], 分组二 "长线沉迷": ["最终幻想14", "星露谷物语"]`;

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
        required: ['cards', 'userSettings'],
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
          required: ['cards', 'userSettings'],
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

const isGeminiProvider = (config: AiConfig): boolean => {
  return config.provider === 'gemini' || /generativelanguage\.googleapis\.com/i.test(config.baseUrl);
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
  if (!resolved.apiKey && resolved.provider !== 'custom') {
    throw new Error('缺少 API Key，请在设置中填写或配置 VITE_AI_FALLBACK_API_KEY');
  }

  if (isGeminiProvider(resolved)) {
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

  // Handle Anthropic or others explicitly here if needed, defaults to openai-compatible
  const isAnthropic = resolved.provider === 'anthropic' || /anthropic\.com/i.test(resolved.baseUrl);
  
  if (isAnthropic) {
    throw new Error('Anthropic API 格式暂未完整支持，敬请期待。请使用 OpenAI 兼容或 Gemini 格式。');
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
      response_format: options?.forceGenerate ? { type: 'json_object' } : undefined,
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
          response_format: options?.forceGenerate ? { type: 'json_object' } : undefined,
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
