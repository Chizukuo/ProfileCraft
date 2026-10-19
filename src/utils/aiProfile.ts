import { CardData, ProfileData, Styles, TagData } from '../types/data';
import { normalizeCards } from './profileSchema';
import { DEFAULT_CARD_HEIGHT, GRID_COLUMNS, getLayoutSpanFromWidth, getWidthFromLayoutSpan } from './gridLayout';
import { ACCENT_PRESETS, CARD_COLOR_NAMES, FONT_OPTIONS, cardColorByName } from './appearance';
import type { AccentName, StylePresetKey } from './appearance';
import { escapeHtml } from './html';

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

// 与 data.ts 里模板的默认字号一致，AI 生成的卡片和手动添加的看起来一样
const subheadingStyles = (): Styles => ({ fontWeight: '600', fontSize: '18', fontFamily: '' });
const labelStyles = (): Styles => ({ fontWeight: 'bold', fontSize: '15', fontFamily: '' });

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

/**
 * 模型输出的是纯文本，而卡片里的文字按 HTML 存储（EditableText 用 innerHTML 渲染）。
 * 先转义，否则“BG<GL”这类写法会被当成标签吞掉；再把允许的少量格式转成 HTML。
 */
const plainText = (value: unknown) => escapeHtml(getSafeString(value).trim());
/** 段落：支持 **重点** 加粗和换行 */
const richText = (value: unknown) =>
  plainText(value)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // 模型有时把换行写成字面的 \n（两个字符）
    .replace(/\r?\n|\\n/g, '<br>');

const normalizeTags = (value: unknown): TagData[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === 'string') return { text: plainText(item) };
      if (item && typeof item === 'object') {
        const raw = item as Record<string, unknown>;
        return { text: plainText(raw.text), type: getSafeString(raw.type) || undefined };
      }
      return null;
    })
    .filter((tag): tag is TagData => Boolean(tag && tag.text));
};

const objects = (value: unknown): Record<string, unknown>[] =>
  Array.isArray(value) ? value.filter((v): v is Record<string, unknown> => Boolean(v) && typeof v === 'object') : [];

// 这里只做 AI 输出特有的宽松兼容（字符串标签、groups 写法、文字转义、字段改名等），
// 最终结构由 profileSchema.normalizeCards 统一校验，旧版 profileInfo 也在那里拆成细分区块。
type LooseElement = Record<string, unknown>;

const normalizeElement = (element: unknown): LooseElement | null => {
  if (!element || typeof element !== 'object') return null;
  const raw = element as Record<string, unknown>;
  const type = getSafeString(raw.type);

  switch (type) {
    case 'paragraph':
      return { type, text: richText(raw.text || raw.content), styles: defaultStyles() };
    case 'heading':
      return { type, text: richText(raw.text), size: raw.size, styles: { fontWeight: '700', fontFamily: '' } };
    case 'avatar':
      return { type, size: raw.size || 'lg', shape: raw.shape };
    case 'qrCode':
      return { type };
    case 'divider':
      return { type, variant: raw.variant };
    case 'imageGallery':
      // AI 不能放图片，只能留一个空的图片墙等用户上传
      return { type, images: [], columns: raw.columns ?? 4, crop: true };
    case 'infoList':
    case 'profileInfo': {
      const items = objects(raw.items)
        .map((item) => ({ label: plainText(item.label), value: plainText(item.value) }))
        .filter((item) => item.label || item.value);
      if (type === 'profileInfo') {
        return {
          type,
          nickname: plainText(raw.nickname || raw.value),
          gender: plainText(raw.gender),
          age: plainText(raw.age),
          location: plainText(raw.location),
          mbti: plainText(raw.mbti),
          items: Array.isArray(raw.items) ? items : undefined,
          textStyles: defaultStyles(),
        };
      }
      return items.length ? { type, items, layout: raw.layout, textStyles: defaultStyles() } : null;
    }
    case 'tagSection':
      return {
        type,
        subheading: plainText(raw.subheading),
        subheadingStyles: subheadingStyles(),
        tags: normalizeTags(raw.tags),
        tagStyles: defaultStyles({ fontWeight: '500', fontSize: '13' }),
        tone: raw.tone,
      };
    case 'groupedTagSection': {
      let arcadeLabel = plainText(raw.arcadeLabel);
      let arcadeTags = normalizeTags(raw.arcade);
      let mobileLabel = plainText(raw.mobileLabel);
      let mobileTags = normalizeTags(raw.mobile);
      const groups = objects(raw.groups);
      if (groups[0]) {
        arcadeLabel = plainText(groups[0].title) || arcadeLabel;
        arcadeTags = normalizeTags(groups[0].tags);
      }
      if (groups[1]) {
        mobileLabel = plainText(groups[1].title) || mobileLabel;
        mobileTags = normalizeTags(groups[1].tags);
      }
      return {
        type,
        subheading: plainText(raw.subheading),
        subheadingStyles: subheadingStyles(),
        arcadeLabel,
        arcadeLabelStyles: labelStyles(),
        arcade: arcadeTags,
        mobileLabel,
        mobileLabelStyles: labelStyles(),
        mobile: mobileTags,
        tagStyles: defaultStyles({ fontWeight: '500', fontSize: '13' }),
      };
    }
    case 'tagSectionTwo':
      return {
        type,
        subheading: plainText(raw.subheading),
        subheadingStyles: subheadingStyles(),
        oshis: normalizeTags(raw.oshis),
        meta: normalizeTags(raw.meta),
        tone: raw.tone,
      };
    case 'checklist': {
      const source = Array.isArray(raw.options) ? raw.options : raw.items;
      const items = (Array.isArray(source) ? source : [])
        .map((o) => (typeof o === 'string' ? { text: plainText(o), checked: true } : o && typeof o === 'object' ? { text: plainText((o as Record<string, unknown>).text), checked: (o as Record<string, unknown>).checked !== false } : null))
        .filter((o): o is { text: string; checked: boolean } => Boolean(o && o.text));
      return items.length ? { type, subheading: plainText(raw.subheading), subheadingStyles: subheadingStyles(), items } : null;
    }
    case 'scale': {
      const items = objects(Array.isArray(raw.scales) ? raw.scales : raw.items)
        .map((s) => ({ left: plainText(s.left), right: plainText(s.right), value: Number(s.value) }))
        .filter((s) => s.left && s.right);
      return items.length ? { type, subheading: plainText(raw.subheading), subheadingStyles: subheadingStyles(), items } : null;
    }
    default:
      return null;
  }
};

/** 没有有效内容的区块（空标签组等）会被丢掉，免得卡片上出现只有小标题的空壳 */
const hasContent = (el: LooseElement): boolean => {
  switch (el.type) {
    case 'tagSection':
      return (el.tags as unknown[]).length > 0;
    case 'tagSectionTwo':
      return (el.oshis as unknown[]).length > 0;
    case 'groupedTagSection':
      return (el.arcade as unknown[]).length + (el.mobile as unknown[]).length > 0;
    case 'paragraph':
    case 'heading':
      return Boolean(el.text);
    default:
      return true;
  }
};

/** 估算卡片内容多少，用于模型没给宽度时的默认值 */
const estimateWidth = (elements: LooseElement[]): number => {
  const weight = elements.reduce((sum, el) => {
    const count = (key: string) => (Array.isArray(el[key]) ? (el[key] as unknown[]).length : 0);
    const text = typeof el.text === 'string' ? el.text.replace(/<[^>]*>/g, '').length : 0;
    return sum + count('tags') + count('oshis') + count('arcade') + count('mobile') + count('items') + text / 15;
  }, 0);
  return weight <= 6 ? 1 : weight <= 16 ? 2 : 3;
};

/**
 * 自动排版：按顺序把卡片放进三列的行里。放不下就换行，并把上一行剩下的列分给那一行里内容最多的卡片，
 * 保证每一行都是满的（模型自己填宽度时经常一行宽一行窄）。同一行的卡片 y 相同，高度由 useHeightSync 对齐。
 */
const packRows = <T extends { width: number; weight: number }>(cards: T[]): Array<T & { x: number; row: number }> => {
  const rows: T[][] = [];
  let row: T[] = [];
  let used = 0;
  const flush = () => {
    if (!row.length) return;
    const spare = GRID_COLUMNS - used;
    if (spare > 0) {
      const target = row.reduce((best, c) => (c.weight > best.weight ? c : best), row[0]);
      target.width += spare;
    }
    rows.push(row);
    row = [];
    used = 0;
  };
  cards.forEach((card) => {
    if (used + card.width > GRID_COLUMNS) flush();
    row.push(card);
    used += card.width;
    if (used === GRID_COLUMNS) flush();
  });
  flush();
  return rows.flatMap((r, rowIndex) => {
    let x = 0;
    return r.map((card) => {
      const placed = { ...card, x, row: rowIndex };
      x += card.width;
      return placed;
    });
  });
};

export const normalizeGeneratedCards = (cards: unknown): CardData[] => {
  if (!Array.isArray(cards)) return [];

  const prepared = cards
    .map((card, index) => {
      if (!card || typeof card !== 'object') return null;
      const raw = card as Record<string, unknown>;
      const elements = (Array.isArray(raw.elements) ? raw.elements : [])
        .map(normalizeElement)
        .filter((el): el is LooseElement => Boolean(el) && hasContent(el!));
      // 没有任何区块的卡片直接丢弃，不塞占位文字
      if (elements.length === 0) return null;
      // 只有一个带小标题的区块时，小标题和卡片标题是两层重复的表头（如「避雷针 / NG」），只留卡片标题
      const titled = elements.filter((el) => typeof el.subheading === 'string' && el.subheading);
      if (plainText(raw.title) && raw.hideTitle !== true && titled.length === 1) titled[0].subheading = '';

      const hint = Number(raw.width);
      const width = Number.isFinite(hint) && hint >= 1
        ? Math.min(GRID_COLUMNS, Math.round(hint))
        : raw.layoutSpan ? getWidthFromLayoutSpan(getSafeString(raw.layoutSpan)) : estimateWidth(elements);
      const bgColor = raw.color && raw.color !== 'default' ? cardColorByName(raw.color) : undefined;
      const style = {
        ...(bgColor ? { bgColor } : {}),
        ...(raw.align === 'center' ? { textAlign: 'center' as const } : {}),
        ...(raw.hideTitle === true ? { hideTitle: true } : {}),
      };
      return {
        id: `card_${Date.now()}_${index}`,
        title: plainText(raw.title),
        elements,
        style,
        width,
        weight: estimateWidth(elements) + elements.length * 0.01,
      };
    })
    .filter((c): c is NonNullable<typeof c> => c !== null);

  // 统一走 profileSchema：去重 id、校验并拆分区块；布局已经排好，fixCardLayouts 会原样保留
  return normalizeCards(packRows(prepared).map((card) => ({
    id: card.id,
    title: card.title,
    titleStyles: defaultTitleStyles(),
    layoutSpan: getLayoutSpanFromWidth(card.width),
    layout: { i: card.id, x: card.x, y: card.row * DEFAULT_CARD_HEIGHT, w: card.width, h: DEFAULT_CARD_HEIGHT },
    style: card.style,
    elements: card.elements,
  })));
};

/** 模型选择的整体外观：只能从网站现成的风格 / 色板 / 字体里选 */
export interface GeneratedLook {
  style?: StylePresetKey;
  accentColor?: string;
  fontFamily?: string;
}

const LOOK_STYLES: StylePresetKey[] = ['classic', 'glass', 'minimal', 'journal', 'night'];
const LOOK_FONTS = FONT_OPTIONS.map((f) => f.key).filter((key) => key && key !== 'mono');

export const normalizeGeneratedLook = (look: unknown): GeneratedLook => {
  if (!look || typeof look !== 'object') return {};
  const raw = look as Record<string, unknown>;
  const result: GeneratedLook = {};
  if (LOOK_STYLES.includes(raw.style as StylePresetKey)) result.style = raw.style as StylePresetKey;
  if (typeof raw.accent === 'string' && raw.accent in ACCENT_PRESETS) result.accentColor = ACCENT_PRESETS[raw.accent as AccentName];
  if (typeof raw.font === 'string' && LOOK_FONTS.includes(raw.font)) result.fontFamily = raw.font;
  return result;
};

/**
 * 快捷回复：提示词要求模型在提问时，最后一行写 [[选项A | 选项B | 选项C]]。
 * 显示时去掉这一行，把选项做成可以点的按钮。
 */
export const splitQuickReplies = (text: string): { text: string; options: string[] } => {
  const lines = text.trimEnd().split('\n');
  const match = lines[lines.length - 1]?.trim().match(/^\[\[(.+)\]\]$/);
  if (!match) return { text, options: [] };
  const options = match[1]
    .split(/[|｜]/)
    .map((o) => o.trim())
    .filter((o) => o && o.length <= 20)
    .slice(0, 6);
  return { text: lines.slice(0, -1).join('\n').trimEnd(), options };
};

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

// 结构按扩列条常见的写法组织：
// 身份行“生日 | MBTI | IP”、大字标语、按圈子分组的标签、推分档、属性 / CP 立场、NG、扩列请 + 二维码。
const BASE_SYSTEM_PROMPT = `你是「芝士扩列条」的采访助手，熟悉二次元、游戏、音游、虚拟主播、偶像、追星、cos 等兴趣圈和圈内说法。你通过轻松的多轮聊天了解用户，然后调用 generate_profile_card 工具生成一张扩列条（在社群里介绍自己、找同好的个人卡片）。

【聊天方式】
- 像朋友聊天：每次只问 1～2 个具体问题，回复简短（一般不超过 60 字），可以先对用户的回答真诚地回应一句再提问。
- 回复只用纯文本，不要用 Markdown（不要 **加粗**、# 标题、列表符号）。
- 提问时，在回复的最后单独一行给出 2～5 个快捷选项，格式严格为 [[选项1 | 选项2 | 选项3]]，每个选项不超过 10 个字，用用户的语言；适合时包含一个“跳过”类的选项。不提问时不要加这一行。
- 按下面的顺序了解，用户不想说的就跳过，不要追问：
  1. 怎么称呼（cn），可选：生日或星座、MBTI、IP（城市或“线上”）
  2. 主要的圈子，以及具体在玩 / 在追的作品
  3. 推：问清楚哪些是最喜欢的（心肝 / 本命），哪些是一般喜欢（好感）
  4. 属性与雷点：CP 立场（BG / BL / GL / 无 CP / 杂食 / 洁癖）、同担（拒否 / 不拒）、雷点；没提到的不要替用户决定
  5. 想找什么样的朋友，以及加好友的规矩（在线时间、回复快慢、加好友要不要备注）
  6. 想要什么感觉的卡片（可爱 / 清爽 / 极简 / 手账 / 夜间），选项用快捷回复给出
- 聊了 3～5 轮、已经有足够内容时，主动问用户要不要现在生成；用户说可以、或者点了「直接生成」时，立即调用工具。

【真实与隐私（必须遵守）】
- 只使用用户明确说过的信息。用户没提到的内容（年龄、性别、生日、MBTI、属性、CP 立场、雷点等）直接省略，绝不编造或猜测。可以精简措辞，但不能改变事实。
- 即使用户说“随便编”“帮我编得厉害点”，也不要编造兴趣、作品、推、经历或头衔：聊天时用一句话说明卡片只写真实信息，并问一两个简单问题；如果已经要求直接生成，就只生成有内容的部分，信息很少时卡片少一点没关系。
- subtitle 只能概括用户说过的内容，不加用户没说过的头衔或形容词；信息太少时用“正在扩列中”这类中性的话。
- 不主动询问真实姓名、手机号、QQ 号、微信号、具体住址、学校或公司全称、证件信息。用户自己提到时也不要写进卡片，联系方式由用户自己上传二维码。
- 如果用户给的称呼看起来像真实全名（例如“王小明”），聊天时问一次要不要换成昵称；用户坚持或已经要求直接生成时，照用户说的写。
- 不生成歧视、骚扰、色情或针对他人的内容；用户要求时礼貌拒绝。

【写法：要像真正的扩列条】
- 简短、像属性表，不写长句。并列的信息用竖线 | 分隔；作品名可以加《》；保留用户和圈内的说法（cn、IP、同担拒否、杂食、洁癖、梦女等），作品名、角色名保留用户的原始写法。
- 标签每个不超过 10 个字，每组不超过 12 个；段落不超过 60 字，可以用 **重点** 标出一两个关键词。
- 一张卡片里有两个以上标签组 / 清单 / 滑杆时，每个都写小标题（如「心肝」「好感」）；只有一个时不写小标题，卡片标题已经说明了。
- userSettings.mainTitle：用户的称呼。userSettings.subtitle：成分式的一句话，用 ｜ 分隔，不超过 30 字，例如“音游人｜ISTP｜周末搭子募集中”。
- 大字标语（heading，size "lg"）只在用户自己说过某种态度或优先级时才写，并且要用用户的原话或几乎原话，例如用户说“聊得来最重要” → “聊得来 > 一切”。不要自己总结或发明口号（比如凭空写一句英文 slogan 或给用户安头衔），用户没说过就不写标语。

【卡片结构（按信息挑选，没有对应信息的卡片不要生成）】
每张卡片写 width（建议宽度 1～3 列，网站会自动凑满每一行）。卡片标题 2～6 个字，可以用圈内常见写法（About me、推し、NG 等），使用用户的语言。
1. 身份卡（width 1，align "center"，hideTitle true）：avatar（size "lg"）+ infoList（layout "inline"，items 的 value 直接写“05.20”“INTP”“IP 上海”这样的短内容，label 写对应名称）+ 可选的大字标语 heading。称呼已经是页面大标题，这里不要重复。
2. 在玩 / 在追（width 2）：一个或多个 tagSection，小标题用用户的说法（如「在玩」「在追」「音游」）；同类内容分两组时用 groupedTagSection。
3. 推（width 2）：最喜欢的用 tagSection，tone "strong"（小标题如「心肝」「本命」）；一般喜欢的用 tagSection，tone "outline"（小标题如「好感」）；不分档时用一个 tagSectionTwo。用户提到推时，在这张卡最后加一个 imageGallery（columns 4），留给用户自己上传推图。
4. 属性（width 1）：tagSection 列出用户说过的 CP 立场、同担态度、梦向等。游戏向用户可以用 checklist（options：用户的偏好，checked 为 true；用户明确说不要的写 checked false）和 scale（用户说过程度时，如“佛系一点”→ left "佛系"、right "硬核"、value 25）。
5. NG（width 1）：tagSection，tone "ng"，每个雷点一个短标签；用户说过踩雷后的态度（如“会拉黑”）时，再加一个 paragraph。
6. 扩列请（width 1）：一个 paragraph 写想找什么样的朋友和加好友的规矩（每条一行），最后加一个 qrCode 区块（二维码由用户自己上传）。
- color：大多数卡片不填。最多给 1～2 张想突出的卡片设底色，例如 NG 卡用 "pink"。

【外观（look）】
- style 按用户想要的感觉选：可爱 / 少女 / 梦幻 → "glass"；简洁 / 冷淡 / 黑白 → "minimal"；手账 / 复古 / 温柔 → "journal"；酷 / 暗色 / 夜猫子 → "night"；没说 → "classic"。
- accent：用户说过喜欢的颜色、推的应援色（用户提到时）或与风格相配的颜色。
- font 只用于标题（只适合中文内容，其他语言不填）：可爱 → "zcoolKuaiLe"；文艺 → "notoSerif"；古风 → "maShanZheng"；手写感 → "longCang"；不确定就不填。

【示例】
用户说过：叫我星之海，ISTP，IP 上海；在打 Arcaea 和 Phigros，也追《葬送的芙莉莲》；最喜欢初音未来，镜音铃也喜欢；不拒同担，雷 KY 和刷屏；想找周末一起打音游的，加我请备注来意；想要清爽一点。
可以生成：mainTitle "星之海"，subtitle "音游人｜ISTP｜周末搭子募集中"，look { style "glass", accent "mint" }；
身份卡：avatar + infoList inline [MBTI=ISTP, IP=IP 上海]；
在玩：tagSection「音游」[Arcaea, Phigros]，tagSection「在追」[《葬送的芙莉莲》]；
推：tagSection「心肝」tone strong [初音未来]，tagSection「好感」tone outline [镜音铃]，imageGallery；
属性：tagSection「属性」[不拒同担]；
NG：tagSection tone ng [KY, 刷屏]；
扩列请：paragraph "想找周末一起打音游的朋友\\n加我请备注来意" + qrCode。
（用户没说年龄、性别、生日、CP 立场，所以都不写。）`;

const LANGUAGE_NAMES: Record<string, string> = { 'zh-CN': '简体中文', 'en-US': 'English', 'ja-JP': '日本語', 'ko-KR': '한국어' };

/**
 * 实际发送的系统提示 = 基础提示 + 当前对话上下文。
 * 界面上的欢迎语不在消息历史里（Anthropic 要求第一条消息必须来自用户），所以在这里告诉模型它已经问过什么。
 */
const buildSystemPrompt = (locale?: string) => {
  const language = (locale && LANGUAGE_NAMES[locale]) || LANGUAGE_NAMES['zh-CN'];
  return `${BASE_SYSTEM_PROMPT}

【当前对话上下文】
- 界面已经替你发出了开场白：问用户怎么称呼、平时主要混哪些圈子。用户的第一条消息就是对它的回答，不要再重复同样的问题。
- 用户界面语言是 ${language}。聊天回复、快捷选项和卡片内容都使用用户实际使用的语言；无法判断时使用 ${language}。示例只是格式参考，不要照抄示例的语言或内容。`;
};

// ---------------------------------------------------------------------------
// Tool schema — single source of truth
// ---------------------------------------------------------------------------

const stringArray = (description: string) => ({ type: 'array' as const, items: { type: 'string' as const }, description });
const enumString = (values: readonly string[], description: string) => ({ type: 'string' as const, enum: [...values], description });

const TOOL_SCHEMA_DEF = {
  name: 'generate_profile_card',
  description: '信息足够时调用，生成扩列条数据。只填用户明确提供过的信息，没有的字段省略。',
  parameters: {
    type: 'object' as const,
    properties: {
      userSettings: {
        type: 'object' as const,
        description: '页面顶部的标题区',
        properties: {
          mainTitle: { type: 'string' as const, description: '主标题，即用户的称呼' },
          subtitle: { type: 'string' as const, description: '成分式的一句话，用 ｜ 分隔，不超过 30 字' },
        },
      },
      look: {
        type: 'object' as const,
        description: '整体外观，只能从给定选项里选',
        properties: {
          style: enumString(LOOK_STYLES, '整体风格'),
          accent: enumString(Object.keys(ACCENT_PRESETS), '主题色'),
          font: enumString(LOOK_FONTS, '字体（只适合中文内容，可省略）'),
        },
      },
      cards: {
        type: 'array' as const,
        description: '卡片列表，按展示顺序排列',
        items: {
          type: 'object' as const,
          properties: {
            title: { type: 'string' as const, description: '卡片标题，2～6 个字' },
            width: { type: 'integer' as const, description: '建议宽度：1、2 或 3 列' },
            align: enumString(['left', 'center'], '对齐方式，默认 left'),
            hideTitle: { type: 'boolean' as const, description: '是否隐藏卡片标题（身份卡用 true）' },
            color: enumString(CARD_COLOR_NAMES, '卡片底色，大多数卡片省略'),
            elements: {
              type: 'array' as const,
              description: '卡片里的区块，按从上到下的顺序',
              items: {
                type: 'object' as const,
                properties: {
                  type: enumString(
                    ['avatar', 'heading', 'infoList', 'paragraph', 'tagSection', 'tagSectionTwo', 'groupedTagSection', 'checklist', 'scale', 'imageGallery', 'qrCode', 'divider'],
                    '区块类型：avatar 头像、heading 大字标语、infoList 信息、paragraph 段落、tagSection 标签组、tagSectionTwo 推、groupedTagSection 两组标签、checklist 勾选清单、scale 倾向滑杆、imageGallery 空图片墙（推图）、qrCode 二维码、divider 分割线',
                  ),
                  text: { type: 'string' as const, description: 'paragraph / heading 的文字。paragraph 不超过 60 字，换行用 \\n，可用 **重点**' },
                  size: enumString(['sm', 'md', 'lg'], 'avatar / heading 的大小'),
                  layout: enumString(['list', 'inline'], 'infoList 排列：inline 为“05.20 | INTP | IP 上海”式的单行'),
                  items: {
                    type: 'array' as const,
                    description: 'infoList 的信息，只放用户提供过的',
                    items: { type: 'object' as const, properties: { label: { type: 'string' as const, description: '如：生日、MBTI、IP' }, value: { type: 'string' as const } } },
                  },
                  subheading: { type: 'string' as const, description: '小标题（用用户的语言）。卡片里有多个标签组 / 清单 / 滑杆时写，只有一个时省略' },
                  tags: stringArray('tagSection 的标签，每个不超过 10 个字，最多 12 个'),
                  tone: enumString(['default', 'strong', 'outline', 'ng'], 'tagSection / tagSectionTwo 的配色：strong 最喜欢、outline 一般喜欢、ng 雷点'),
                  oshis: stringArray('tagSectionTwo 的推（角色、声优、偶像、主播等）'),
                  meta: stringArray('tagSectionTwo 的补充说明标签，如 "and more…"，可省略'),
                  arcadeLabel: { type: 'string' as const, description: 'groupedTagSection 第一组的组名' },
                  arcade: stringArray('groupedTagSection 第一组的标签'),
                  mobileLabel: { type: 'string' as const, description: 'groupedTagSection 第二组的组名' },
                  mobile: stringArray('groupedTagSection 第二组的标签'),
                  options: {
                    type: 'array' as const,
                    description: 'checklist 的选项',
                    items: { type: 'object' as const, properties: { text: { type: 'string' as const }, checked: { type: 'boolean' as const } } },
                  },
                  scales: {
                    type: 'array' as const,
                    description: 'scale 的每一行：两端文字和位置（0～100，越大越靠右）',
                    items: { type: 'object' as const, properties: { left: { type: 'string' as const }, right: { type: 'string' as const }, value: { type: 'integer' as const } } },
                  },
                  variant: enumString(['line', 'dashed', 'space'], 'divider 的样式'),
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
