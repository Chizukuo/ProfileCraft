import type { CSSProperties } from 'react';
import type { AppearanceSettings, BackgroundSettings, CardAppearance, LayoutAppearance, UserSettings, VisibilitySettings } from '../types/data';

// 默认值与改版前的视觉效果保持一致，老数据没有 appearance 字段时看起来不变
export const DEFAULT_APPEARANCE: AppearanceSettings = {
  background: {
    type: 'theme',
    color: '#FFFDF5',
    gradientFrom: '#FFF1C1',
    gradientTo: '#FFD6E7',
    gradientAngle: 135,
    image: '',
    imageFit: 'cover',
    overlayColor: '#FFFFFF',
    overlayOpacity: 0,
  },
  card: {
    bgColor: '',
    opacity: 1,
    radius: 20,
    shadow: 'soft',
    border: true,
    textColor: '',
  },
  layout: {
    gapX: 24,
    gapY: 32,
    padding: 24,
    lineHeight: 1.7,
    fontScale: 1,
    fontFamily: '',
  },
  visibility: {
    subtitle: true,
    footer: true,
  },
};

export const APPEARANCE_LIMITS = {
  gapX: { min: 0, max: 48, step: 2 },
  gapY: { min: 0, max: 64, step: 2 },
  padding: { min: 12, max: 40, step: 2 },
  lineHeight: { min: 1.3, max: 2.2, step: 0.05 },
  fontScale: { min: 0.85, max: 1.3, step: 0.05 },
  radius: { min: 0, max: 32, step: 1 },
  opacity: { min: 0.2, max: 1, step: 0.05 },
  overlayOpacity: { min: 0, max: 0.9, step: 0.05 },
  gradientAngle: { min: 0, max: 360, step: 5 },
} as const;

export const CARD_COLOR_PRESETS = ['#FFFFFF', '#FFF7E0', '#FFE9EF', '#EAF4FF', '#E9F8EF', '#F1EAFF', '#F3F3F3', '#2B2B30'];

export interface FontOption {
  key: string;
  stack: string;
  /** Google Fonts（loli.net 镜像）样式表，系统字体则为空 */
  cssUrl?: string;
}

// 标签文字走 i18n：appearance.fonts.<key>
export const FONT_OPTIONS: FontOption[] = [
  { key: '', stack: '' },
  { key: 'zcoolKuaiLe', stack: '"ZCOOL KuaiLe", sans-serif', cssUrl: 'https://fonts.loli.net/css2?family=ZCOOL+KuaiLe&display=swap' },
  { key: 'zcoolXiaoWei', stack: '"ZCOOL XiaoWei", serif', cssUrl: 'https://fonts.loli.net/css2?family=ZCOOL+XiaoWei&display=swap' },
  { key: 'notoSerif', stack: '"Noto Serif SC", "Songti SC", "SimSun", serif', cssUrl: 'https://fonts.loli.net/css2?family=Noto+Serif+SC:wght@400;600;700&display=swap' },
  { key: 'maShanZheng', stack: '"Ma Shan Zheng", cursive', cssUrl: 'https://fonts.loli.net/css2?family=Ma+Shan+Zheng&display=swap' },
  { key: 'longCang', stack: '"Long Cang", cursive', cssUrl: 'https://fonts.loli.net/css2?family=Long+Cang&display=swap' },
  { key: 'mono', stack: 'ui-monospace, "SF Mono", "Cascadia Mono", Consolas, monospace' },
];

export const getFontOption = (key: string): FontOption | undefined => FONT_OPTIONS.find((f) => f.key === key && key !== '');

const clamp = (value: unknown, min: number, max: number, fallback: number) => {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
};

const isHexColor = (value: unknown): value is string => typeof value === 'string' && /^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(value);
const pickColor = (value: unknown, fallback: string) => (isHexColor(value) ? value : fallback);
const pickOptionalColor = (value: unknown) => (isHexColor(value) ? value : '');
const pickEnum = <T extends string>(value: unknown, options: readonly T[], fallback: T): T =>
  (options as readonly unknown[]).includes(value) ? (value as T) : fallback;

/** 把可能残缺 / 来自导入文件的 appearance 合并成完整、合法的设置 */
export const resolveAppearance = (input?: Partial<AppearanceSettings> | null): AppearanceSettings => {
  const d = DEFAULT_APPEARANCE;
  const bg = (input?.background ?? {}) as Partial<BackgroundSettings>;
  const card = (input?.card ?? {}) as Partial<CardAppearance>;
  const layout = (input?.layout ?? {}) as Partial<LayoutAppearance>;
  const vis = (input?.visibility ?? {}) as Partial<VisibilitySettings>;
  const L = APPEARANCE_LIMITS;

  return {
    background: {
      type: pickEnum(bg.type, ['theme', 'color', 'gradient', 'image'] as const, d.background.type),
      color: pickColor(bg.color, d.background.color),
      gradientFrom: pickColor(bg.gradientFrom, d.background.gradientFrom),
      gradientTo: pickColor(bg.gradientTo, d.background.gradientTo),
      gradientAngle: clamp(bg.gradientAngle, L.gradientAngle.min, L.gradientAngle.max, d.background.gradientAngle),
      image: typeof bg.image === 'string' ? bg.image : '',
      imageFit: pickEnum(bg.imageFit, ['cover', 'contain', 'repeat'] as const, d.background.imageFit),
      overlayColor: pickColor(bg.overlayColor, d.background.overlayColor),
      overlayOpacity: clamp(bg.overlayOpacity, L.overlayOpacity.min, L.overlayOpacity.max, d.background.overlayOpacity),
    },
    card: {
      bgColor: pickOptionalColor(card.bgColor),
      opacity: clamp(card.opacity, L.opacity.min, L.opacity.max, d.card.opacity),
      radius: clamp(card.radius, L.radius.min, L.radius.max, d.card.radius),
      shadow: pickEnum(card.shadow, ['none', 'soft', 'strong'] as const, d.card.shadow),
      border: typeof card.border === 'boolean' ? card.border : d.card.border,
      textColor: pickOptionalColor(card.textColor),
    },
    layout: {
      gapX: clamp(layout.gapX, L.gapX.min, L.gapX.max, d.layout.gapX),
      gapY: clamp(layout.gapY, L.gapY.min, L.gapY.max, d.layout.gapY),
      padding: clamp(layout.padding, L.padding.min, L.padding.max, d.layout.padding),
      lineHeight: clamp(layout.lineHeight, L.lineHeight.min, L.lineHeight.max, d.layout.lineHeight),
      fontScale: clamp(layout.fontScale, L.fontScale.min, L.fontScale.max, d.layout.fontScale),
      fontFamily: typeof layout.fontFamily === 'string' && FONT_OPTIONS.some((f) => f.key === layout.fontFamily) ? layout.fontFamily : '',
    },
    visibility: {
      subtitle: typeof vis.subtitle === 'boolean' ? vis.subtitle : d.visibility.subtitle,
      footer: typeof vis.footer === 'boolean' ? vis.footer : d.visibility.footer,
    },
  };
};

export const getAppearance = (settings?: UserSettings | null) => resolveAppearance(settings?.appearance);

export const hexToRgba = (hex: string, alpha: number) => {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${Number(alpha.toFixed(3))})`;
};

export const getLuminance = (hex: string) => {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return (r * 299 + g * 587 + b * 114) / 1000;
};

/** 深色页面背景上，标题 / 副标题 / 页脚改用浅色文字；无法判断（主题或浅色）时返回 '' */
export const getPageTextColor = (bg: BackgroundSettings): string => {
  let base = '';
  if (bg.type === 'color') base = bg.color;
  else if (bg.type === 'gradient') base = getLuminance(bg.gradientFrom) < getLuminance(bg.gradientTo) ? bg.gradientFrom : bg.gradientTo;
  else if (bg.type === 'image' && bg.image && bg.overlayOpacity >= 0.4) base = bg.overlayColor;
  return base && getLuminance(base) < 110 ? '#F5F5F7' : '';
};

/**
 * 单卡自定义底色时，保证文字可读：深底色用浅字；浅底色但全局文字是浅色时，
 * 用 'initial' 让 var(--pc-card-text, 主题色) 回落到主题默认的深色文字。
 */
export const getCardTextOverride = (appearance: AppearanceSettings, cardColor?: string): string | undefined => {
  if (!isHexColor(cardColor)) return undefined;
  if (getLuminance(cardColor) < 110) return '#F5F5F7';
  const globalText = appearance.card.textColor;
  return globalText && getLuminance(globalText) >= 110 ? 'initial' : undefined;
};

const SHADOWS: Record<AppearanceSettings['card']['shadow'], string> = {
  none: 'none',
  soft: '0 4px 12px rgba(0, 0, 0, 0.05)',
  strong: '0 12px 32px rgba(0, 0, 0, 0.16)',
};

/** 卡片背景色：单卡颜色 > 全局颜色 > 白色（仅在需要透明度时） */
export const getCardBackground = (appearance: AppearanceSettings, cardColor?: string) => {
  const color = pickOptionalColor(cardColor) || appearance.card.bgColor;
  if (!color && appearance.card.opacity >= 1) return '';
  return hexToRgba(color || '#FFFFFF', appearance.card.opacity);
};

/**
 * 外观 → CSS 变量，挂在 #profileCardContainer 上。
 * 导出 HTML/PNG 时克隆的就是这个节点，内联变量会随之带走。
 * 卡片相关的变量只在偏离默认值时输出，未定制时保持主题自身的样式。
 */
export const getAppearanceCssVars = (appearance: AppearanceSettings): CSSProperties => {
  const { card, layout } = appearance;
  const d = DEFAULT_APPEARANCE.card;
  const vars: Record<string, string> = {
    '--pc-gap-x': `${layout.gapX}px`,
    '--pc-gap-y': `${layout.gapY}px`,
    '--pc-card-padding': `${layout.padding}px`,
    '--pc-line-height': String(layout.lineHeight),
    '--pc-font-scale': String(layout.fontScale),
  };
  const font = getFontOption(layout.fontFamily);
  if (font) vars['--pc-font-family'] = font.stack;

  const cardBg = getCardBackground(appearance);
  if (cardBg) vars['--pc-card-bg'] = cardBg;
  if (card.radius !== d.radius) vars['--pc-card-radius'] = `${card.radius}px`;
  if (card.shadow !== d.shadow) vars['--pc-card-shadow'] = SHADOWS[card.shadow];
  if (!card.border) vars['--pc-card-border'] = 'transparent';
  if (card.textColor) vars['--pc-card-text'] = card.textColor;
  if (card.opacity < 1) vars['--pc-card-blur'] = 'blur(12px)';
  const pageText = getPageTextColor(appearance.background);
  if (pageText) vars['--pc-page-text'] = pageText;
  return vars as CSSProperties;
};

const cssUrl = (url: string) => `url("${url.replace(/["\\\n\r]/g, (c) => encodeURIComponent(c))}")`;

export interface PageBackgroundStyle {
  backgroundColor: string;
  backgroundImage: string;
  backgroundSize: string;
  backgroundRepeat: string;
  backgroundPosition: string;
  backgroundAttachment: string;
}

/** 页面背景 → body 内联样式；'theme' 返回 null，表示交给主题 CSS */
export const getPageBackgroundStyle = (bg: BackgroundSettings): PageBackgroundStyle | null => {
  if (bg.type === 'color') {
    return { backgroundColor: bg.color, backgroundImage: 'none', backgroundSize: '', backgroundRepeat: '', backgroundPosition: '', backgroundAttachment: '' };
  }
  if (bg.type === 'gradient') {
    return {
      backgroundColor: bg.gradientFrom,
      backgroundImage: `linear-gradient(${bg.gradientAngle}deg, ${bg.gradientFrom}, ${bg.gradientTo})`,
      backgroundSize: '100% 100%',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
    };
  }
  if (bg.type === 'image' && bg.image) {
    const layers: string[] = [];
    const sizes: string[] = [];
    const repeats: string[] = [];
    if (bg.overlayOpacity > 0) {
      const overlay = hexToRgba(bg.overlayColor, bg.overlayOpacity);
      layers.push(`linear-gradient(${overlay}, ${overlay})`);
      sizes.push('100% 100%');
      repeats.push('no-repeat');
    }
    layers.push(cssUrl(bg.image));
    sizes.push(bg.imageFit === 'repeat' ? 'auto' : bg.imageFit);
    repeats.push(bg.imageFit === 'repeat' ? 'repeat' : 'no-repeat');
    return {
      backgroundColor: bg.color,
      backgroundImage: layers.join(', '),
      backgroundSize: sizes.join(', '),
      backgroundRepeat: repeats.join(', '),
      backgroundPosition: 'center top',
      backgroundAttachment: 'fixed',
    };
  }
  return null;
};
