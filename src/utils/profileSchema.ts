import type { CardData, CardElement, CardLayout, CardStyle, ProfileData, Styles, TagData, UserSettings } from '../types/data';
import { getDefaultProfileData } from './data';
import { DEFAULT_CARD_HEIGHT, GRID_COLUMNS, getLayoutSpanFromWidth, getWidthFromLayoutSpan } from './gridLayout';

// 所有进入应用状态的数据（localStorage、导入文件、AI 输出）都要过这里：
// 补齐缺失字段、丢弃未知元素类型、修正布局，避免一份坏数据让渲染崩溃并被持久化。

type Raw = Record<string, unknown>;

const isObject = (v: unknown): v is Raw => Boolean(v) && typeof v === 'object' && !Array.isArray(v);
const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : typeof v === 'number' ? String(v) : fallback);
const styles = (v: unknown, fallback: Styles = {}): Styles => (isObject(v) ? (v as Styles) : { ...fallback });
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

export const createCardId = () => `card_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

const normalizeTags = (v: unknown, type?: string): TagData[] => {
  if (!Array.isArray(v)) return [];
  return v
    .map((t): TagData | null => {
      if (typeof t === 'string') return { text: t, ...(type ? { type } : {}) };
      if (!isObject(t)) return null;
      return {
        text: str(t.text),
        ...(t.type || type ? { type: str(t.type, type) } : {}),
        ...(isObject(t.styles) ? { styles: t.styles as Styles } : {}),
        ...(t.placeholder === true ? { placeholder: true } : {}),
      };
    })
    .filter((t): t is TagData => t !== null);
};

const DEFAULT_TEXT: Styles = { fontWeight: '400', fontSize: '15', fontFamily: '' };
const DEFAULT_SUBHEADING: Styles = { fontWeight: '600', fontSize: '18', fontFamily: '' };
const DEFAULT_TAG: Styles = { fontWeight: '500', fontSize: '13', fontFamily: '' };
const DEFAULT_LABEL: Styles = { fontWeight: 'bold', fontSize: '15', fontFamily: '' };
const DEFAULT_HEADING: Styles = { fontWeight: '700', fontFamily: '' };
const SIZES = ['sm', 'md', 'lg'] as const;
const TONES = ['default', 'strong', 'outline', 'ng'] as const;

const pick = <T extends string>(v: unknown, options: readonly T[], fallback: T): T =>
  (options as readonly unknown[]).includes(v) ? (v as T) : fallback;

/** 可选的枚举字段：值合法且不是默认值时才写入，保持旧数据 / 导出 JSON 干净 */
const optional = <K extends string, T extends string>(key: K, v: unknown, options: readonly T[], defaultValue: T) =>
  ((options as readonly unknown[]).includes(v) && v !== defaultValue ? { [key]: v as T } : {}) as Partial<Record<K, T>>;

const normalizeItems = (raw: Raw) =>
  Array.isArray(raw.items)
    ? raw.items.filter(isObject).map((i) => ({ label: str(i.label), value: str(i.value) }))
    // 最早的版本只有固定字段、没有 items（旧数据本就是中文标签）
    : [
        { label: '昵称', value: str(raw.nickname) || '你的昵称' },
        { label: '性别', value: str(raw.gender) || '保密' },
        { label: '年龄', value: str(raw.age) || '18' },
        { label: '常驻', value: str(raw.location) || '虚拟世界' },
        { label: 'MBTI', value: str(raw.mbti) || 'INFP' },
      ];

/** 迁移旧数据时需要的上下文：旧版外观设置里可能关掉了头像 / 二维码 */
export interface MigrationOptions {
  showAvatar?: boolean;
  showQrCode?: boolean;
}

/**
 * 规范化一个元素。返回数组，因为旧版 profileInfo 会被拆成多个细分区块
 * （头像 + 信息列表 + 二维码）；未知类型返回空数组（丢弃）。
 */
export const expandElement = (raw: unknown, options: MigrationOptions = {}): CardElement[] => {
  if (!isObject(raw)) return [];
  const base = isObject(raw.styles) ? { styles: raw.styles as Styles } : {};

  switch (raw.type) {
    case 'paragraph':
      return [{ type: 'paragraph', text: str(raw.text), styles: styles(raw.styles, DEFAULT_TEXT) }];
    case 'heading':
      return [{ type: 'heading', text: str(raw.text), size: pick(raw.size, SIZES, 'md'), styles: styles(raw.styles, DEFAULT_HEADING) }];
    case 'avatar':
      return [{ ...base, type: 'avatar', size: pick(raw.size, SIZES, 'md'), shape: pick(raw.shape, ['circle', 'rounded'] as const, 'circle') }];
    case 'infoList':
      return [{ ...base, type: 'infoList', items: normalizeItems(raw), textStyles: styles(raw.textStyles, DEFAULT_TEXT), ...optional('layout', raw.layout, ['list', 'inline'] as const, 'list') }];
    case 'qrCode':
      return [{ ...base, type: 'qrCode' }];
    case 'divider':
      return [{ ...base, type: 'divider', variant: pick(raw.variant, ['line', 'dashed', 'space'] as const, 'line') }];
    case 'profileInfo': {
      const parts: CardElement[] = [];
      if (options.showAvatar !== false) parts.push({ type: 'avatar', size: 'md', shape: 'circle' });
      parts.push({ type: 'infoList', items: normalizeItems(raw), textStyles: styles(raw.textStyles, DEFAULT_TEXT) });
      if (options.showQrCode !== false) parts.push({ type: 'qrCode' });
      return parts;
    }
    case 'tagSection':
      return [{
        ...base,
        type: 'tagSection',
        subheading: str(raw.subheading),
        subheadingStyles: styles(raw.subheadingStyles, DEFAULT_SUBHEADING),
        tags: normalizeTags(raw.tags),
        tagStyles: styles(raw.tagStyles, DEFAULT_TAG),
        ...optional('tone', raw.tone, TONES, 'default'),
      }];
    case 'groupedTagSection':
      return [{
        ...base,
        type: 'groupedTagSection',
        subheading: str(raw.subheading),
        subheadingStyles: styles(raw.subheadingStyles, DEFAULT_SUBHEADING),
        arcadeLabel: str(raw.arcadeLabel),
        arcadeLabelStyles: styles(raw.arcadeLabelStyles, DEFAULT_LABEL),
        arcade: normalizeTags(raw.arcade),
        mobileLabel: str(raw.mobileLabel),
        mobileLabelStyles: styles(raw.mobileLabelStyles, DEFAULT_LABEL),
        mobile: normalizeTags(raw.mobile),
        tagStyles: styles(raw.tagStyles, DEFAULT_TAG),
      }];
    case 'tagSectionTwo':
      return [{
        ...base,
        type: 'tagSectionTwo',
        subheading: str(raw.subheading),
        subheadingStyles: styles(raw.subheadingStyles, DEFAULT_SUBHEADING),
        oshis: normalizeTags(raw.oshis, 'oshi-tag'),
        meta: normalizeTags(raw.meta, 'oshi-meta-tag'),
        ...optional('tone', raw.tone, TONES, 'default'),
      }];
    case 'checklist':
      return [{
        ...base,
        type: 'checklist',
        subheading: str(raw.subheading),
        subheadingStyles: styles(raw.subheadingStyles, DEFAULT_SUBHEADING),
        items: Array.isArray(raw.items)
          ? raw.items
              .map((i) => (typeof i === 'string' ? { text: i, checked: true } : isObject(i) ? { text: str(i.text), checked: i.checked !== false } : null))
              .filter((i): i is { text: string; checked: boolean } => Boolean(i && i.text))
          : [],
        ...optional('layout', raw.layout, ['grid', 'compact'] as const, 'grid'),
      }];
    case 'scale':
      return [{
        ...base,
        type: 'scale',
        subheading: str(raw.subheading),
        subheadingStyles: styles(raw.subheadingStyles, DEFAULT_SUBHEADING),
        items: Array.isArray(raw.items)
          ? raw.items.filter(isObject).map((i) => ({
              left: str(i.left),
              right: str(i.right),
              ...(typeof i.middle === 'string' && i.middle ? { middle: i.middle } : {}),
              value: finite(i.value) ? Math.min(100, Math.max(0, Math.round(i.value))) : 50,
            }))
          : [],
        ...(raw.showMiddle === true ? { showMiddle: true } : {}),
      }];
    case 'imageGallery':
      return [{
        ...base,
        type: 'imageGallery',
        images: Array.isArray(raw.images)
          ? raw.images
              .filter(isObject)
              .map((img) => ({ src: str(img.src), ...(typeof img.caption === 'string' ? { caption: img.caption } : {}) }))
              .filter((img) => img.src)
          : [],
        columns: finite(raw.columns) ? Math.min(4, Math.max(1, Math.round(raw.columns))) : 2,
        ...(raw.crop === true ? { crop: true } : {}),
      }];
    default:
      return [];
  }
};

const normalizeCardStyle = (v: unknown): CardStyle | undefined => {
  if (!isObject(v)) return undefined;
  const style: CardStyle = {};
  if (typeof v.bgColor === 'string' && v.bgColor) style.bgColor = v.bgColor;
  if (v.textAlign === 'left' || v.textAlign === 'center') style.textAlign = v.textAlign;
  if (v.hideTitle === true) style.hideTitle = true;
  return Object.keys(style).length ? style : undefined;
};

/**
 * 修正卡片布局：保证 id 唯一、layout 数值合法、layoutSpan 与宽度一致。
 * 缺少有效 y 的卡片（新卡片、JSON 里被序列化成 null 的 Infinity）依次排到最下方。
 */
export const fixCardLayouts = (cards: CardData[]): CardData[] => {
  const seen = new Set<string>();
  const valid = (l?: CardLayout) => Boolean(l && finite(l.y) && finite(l.h));
  let bottom = cards.reduce((max, c) => (valid(c.layout) ? Math.max(max, c.layout!.y + c.layout!.h) : max), 0);

  return cards.map((card) => {
    let id = card.id;
    if (!id || seen.has(id)) id = createCardId();
    seen.add(id);

    const l = card.layout;
    const w = finite(l?.w) ? Math.min(GRID_COLUMNS, Math.max(1, Math.round(l!.w))) : getWidthFromLayoutSpan(card.layoutSpan);
    const h = finite(l?.h) && l!.h > 0 ? l!.h : DEFAULT_CARD_HEIGHT;
    const x = finite(l?.x) ? Math.min(GRID_COLUMNS - w, Math.max(0, Math.round(l!.x))) : 0;
    let y: number;
    if (finite(l?.y) && l!.y >= 0) {
      y = l!.y;
    } else {
      y = bottom;
      bottom += h;
    }

    return { ...card, id, layoutSpan: getLayoutSpanFromWidth(w, card.layoutSpan), layout: { i: id, x, y, w, h } };
  });
};

export const normalizeCard = (raw: unknown, options: MigrationOptions = {}): CardData | null => {
  if (!isObject(raw)) return null;
  const elements = Array.isArray(raw.elements) ? raw.elements.flatMap((el) => expandElement(el, options)) : [];
  const layout = isObject(raw.layout) ? (raw.layout as unknown as CardLayout) : undefined;
  return {
    id: str(raw.id),
    title: str(raw.title),
    titleStyles: styles(raw.titleStyles, { fontWeight: '600', fontSize: '22', fontFamily: '' }),
    layoutSpan: str(raw.layoutSpan, 'profile-card-span'),
    layout,
    style: normalizeCardStyle(raw.style),
    elements,
  };
};

export const normalizeCards = (raw: unknown, options: MigrationOptions = {}): CardData[] =>
  fixCardLayouts(Array.isArray(raw) ? raw.map((c) => normalizeCard(c, options)).filter((c): c is CardData => c !== null) : []);

export const isProfileCraftShape = (raw: unknown): raw is Raw =>
  isObject(raw) && isObject(raw.userSettings) && Array.isArray(raw.cards);

/** 返回合法的 ProfileData；不是 ProfileCraft 结构时返回 null */
export const normalizeProfileData = (raw: unknown): ProfileData | null => {
  if (!isProfileCraftShape(raw)) return null;
  const defaults = getDefaultProfileData().userSettings;
  const us = raw.userSettings as Raw;

  // 旧版外观里的“显示头像 / 二维码”开关：迁移成“有没有对应区块”，然后从设置里去掉
  const appearance = isObject(us.appearance) ? { ...(us.appearance as Raw) } : undefined;
  const legacyVisibility = isObject(appearance?.visibility) ? { ...(appearance!.visibility as Raw) } : undefined;
  const migration: MigrationOptions = {
    showAvatar: legacyVisibility?.avatar !== false,
    showQrCode: legacyVisibility?.qrCode !== false,
  };
  if (appearance && legacyVisibility) {
    delete legacyVisibility.avatar;
    delete legacyVisibility.qrCode;
    appearance.visibility = legacyVisibility;
  }

  const userSettings: UserSettings = {
    accentColor: /^#[0-9a-f]{6}$/i.test(str(us.accentColor)) ? str(us.accentColor) : defaults.accentColor,
    avatarSrc: str(us.avatarSrc, defaults.avatarSrc),
    qrCodeLink: str(us.qrCodeLink),
    mainTitle: str(us.mainTitle),
    mainTitleStyles: styles(us.mainTitleStyles, defaults.mainTitleStyles),
    subtitle: str(us.subtitle),
    subtitleStyles: styles(us.subtitleStyles, defaults.subtitleStyles),
    footerText: str(us.footerText, defaults.footerText),
    theme: str(us.theme, defaults.theme),
    ...(typeof us.qrCodeImage === 'string' && us.qrCodeImage ? { qrCodeImage: us.qrCodeImage } : {}),
    ...(appearance ? { appearance: appearance as UserSettings['appearance'] } : {}),
  };

  return { userSettings, cards: normalizeCards(raw.cards, migration) };
};
