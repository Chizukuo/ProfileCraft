export interface Styles {
  fontWeight?: string;
  fontSize?: string;
  fontFamily?: string; // 新增：支持自定义字体
  [key: string]: any;
}

export interface UserSettings {
  accentColor: string;
  avatarSrc: string;
  qrCodeLink: string;
  mainTitle: string;
  mainTitleStyles: Styles;
  subtitle: string;
  subtitleStyles: Styles;
  footerText: string;
  theme: string; // 新增：支持主题选择
  qrCodeImage?: string; // 上传的二维码图片（data URL），优先于 qrCodeLink 生成的二维码
  appearance?: Partial<AppearanceSettings>; // 外观定制，缺省字段回落到 DEFAULT_APPEARANCE
}

// ---- 外观定制 ----
export type BackgroundType = 'theme' | 'color' | 'gradient' | 'image';
export type BackgroundFit = 'cover' | 'contain' | 'repeat';
export type CardShadow = 'none' | 'soft' | 'strong';
/** 叠在纯色 / 渐变 / 主题背景上的图案 */
export type BackgroundPattern = 'none' | 'dots' | 'stripes' | 'grid';

export interface BackgroundSettings {
  type: BackgroundType;
  color: string;
  gradientFrom: string;
  gradientTo: string;
  gradientAngle: number;
  image: string;
  imageFit: BackgroundFit;
  overlayColor: string;
  overlayOpacity: number; // 0 ~ 0.9，叠在背景图上方的纯色蒙版
  pattern: BackgroundPattern;
}

export interface CardAppearance {
  bgColor: string; // '' 表示跟随主题
  opacity: number; // 0.2 ~ 1
  radius: number; // px
  shadow: CardShadow;
  border: boolean;
  textColor: string; // '' 表示跟随主题
}

export interface LayoutAppearance {
  gapX: number;
  gapY: number;
  padding: number;
  lineHeight: number;
  fontScale: number;
  fontFamily: string; // FONT_OPTIONS 的 key，'' 表示默认
}

// 头像 / 二维码已是独立区块（删掉即隐藏），这里只控制页面级元素
export interface VisibilitySettings {
  subtitle: boolean;
  footer: boolean;
}

export interface AppearanceSettings {
  background: BackgroundSettings;
  card: CardAppearance;
  layout: LayoutAppearance;
  visibility: VisibilitySettings;
}

export interface TagData {
  text: string;
  styles?: Styles;
  type?: string;
  /** 模板里的示例标签：编辑器里灰色虚线显示，预览 / 导出时隐藏；改过文字或添加第一个真标签后就消失 */
  placeholder?: boolean;
}

interface BaseElement {
  type: string;
  styles?: Styles;
}

export interface ParagraphElement extends BaseElement {
  type: 'paragraph';
  text: string;
}

export interface ProfileItem {
  label: string;
  value: string;
}

/**
 * 旧版“个人信息”复合区块（头像 + 信息 + 二维码）。只作为输入格式存在：
 * 读取旧数据 / 导入 / AI 输出时由 profileSchema 拆成 avatar + infoList + qrCode。
 */
export interface LegacyProfileInfoElement extends BaseElement {
  type: 'profileInfo';
  nickname?: string;
  gender?: string;
  age?: string;
  location?: string;
  mbti?: string;
  items?: ProfileItem[];
  textStyles: Styles;
}

// ---- 细分区块 ----
export type BlockSize = 'sm' | 'md' | 'lg';

/** 头像：显示 userSettings.avatarSrc（个人头像只有一个，多个头像区块显示同一张） */
export interface AvatarElement extends BaseElement {
  type: 'avatar';
  size: BlockSize;
  shape: 'circle' | 'rounded';
}

/** 标题：一行大字，比如昵称 */
export interface HeadingElement extends BaseElement {
  type: 'heading';
  text: string;
  size: BlockSize;
}

/** 信息列表：“标签: 内容”若干行；单行模式只显示内容，用竖线隔开（如 05.20 | INTP | IP 成都） */
export interface InfoListElement extends BaseElement {
  type: 'infoList';
  items: ProfileItem[];
  textStyles: Styles;
  layout?: 'list' | 'inline';
}

/** 二维码：使用 userSettings.qrCodeLink / qrCodeImage */
export interface QrCodeElement extends BaseElement {
  type: 'qrCode';
}

export interface DividerElement extends BaseElement {
  type: 'divider';
  variant: 'line' | 'dashed' | 'space';
}

/** 标签配色：默认 / 醒目（心肝、本命）/ 描边（好感、轻度）/ 雷点 */
export type TagTone = 'default' | 'strong' | 'outline' | 'ng';

export interface TagSectionElement extends BaseElement {
  type: 'tagSection';
  subheading: string;
  subheadingStyles: Styles;
  tags: TagData[];
  tagStyles: Styles;
  tone?: TagTone;
}

export interface GroupedTagSectionElement extends BaseElement {
    type: 'groupedTagSection';
    subheading: string;
    subheadingStyles: Styles;
    arcadeLabel: string;
    arcadeLabelStyles: Styles;
    arcade: TagData[];
    mobileLabel: string;
    mobileLabelStyles: Styles;
    mobile: TagData[];
    tagStyles: Styles;
}


export interface OshiSectionElement extends BaseElement {
  type: 'tagSectionTwo';
  subheading: string;
  subheadingStyles: Styles;
  oshis: TagData[];
  meta: TagData[];
  tone?: TagTone;
}

export interface ChecklistItem {
  text: string;
  checked: boolean;
}

/** 勾选清单：☑ / ☐ 选项，如“我偏好：☑ 一起上分 ☐ 语音” */
export interface ChecklistElement extends BaseElement {
  type: 'checklist';
  subheading: string;
  subheadingStyles: Styles;
  items: ChecklistItem[];
  /** compact：一个挨一个排成一行（适合“周一 周二 …”这种短选项）；默认按列对齐 */
  layout?: 'grid' | 'compact';
}

export interface ScaleItem {
  left: string;
  right: string;
  /** 轨道中间下方的文字，如“新手 / 中坚 / 大佬”里的“中坚”；只在区块开启 showMiddle 时显示 */
  middle?: string;
  value: number; // 0 ~ 100，越大越靠右
}

/** 倾向滑杆：如“佛系 ←●→ 硬核” */
export interface ScaleElement extends BaseElement {
  type: 'scale';
  subheading: string;
  subheadingStyles: Styles;
  items: ScaleItem[];
  showMiddle?: boolean;
}

export interface GalleryImage {
  src: string;
  caption?: string;
}

export interface ImageGalleryElement extends BaseElement {
  type: 'imageGallery';
  images: GalleryImage[];
  columns: number; // 1 ~ 4
  crop?: boolean; // 统一裁成正方形
}

export type CardElement =
  | HeadingElement
  | ParagraphElement
  | AvatarElement
  | InfoListElement
  | QrCodeElement
  | DividerElement
  | ImageGalleryElement
  | TagSectionElement
  | GroupedTagSectionElement
  | OshiSectionElement
  | ChecklistElement
  | ScaleElement;

export interface CardLayout {
    i: string;
    x: number;
    y: number;
    w: number;
    h: number;
}

export interface CardStyle {
  bgColor?: string; // 单卡背景色，'' / 缺省表示跟随全局
  textAlign?: 'left' | 'center';
  hideTitle?: boolean;
}

export interface CardData {
  id: string;
  title: string;
  titleStyles: Styles;
  layoutSpan: string;
  layout?: CardLayout;
  style?: CardStyle;
  elements: CardElement[];
}

export interface ProfileData {
  userSettings: UserSettings;
  cards: CardData[];
}

// ---- Templates ----
export type TemplateTranslate = (key: string) => string;

export interface CardTemplate {
    id: string; // 对应 i18n 键 cardTypes.<id> / cardTypes.<id>Desc
    build: (t: TemplateTranslate) => Omit<CardData, 'id' | 'layout'> & { width: number };
}

/** 添加区块面板里的分组，对应 i18n 键 blockGroups.<group> */
export type ElementTemplateGroup = 'text' | 'profile' | 'tags' | 'media';

export interface ElementTemplate {
    id: string; // 对应 i18n 键 blockTypes.<id> / blockTypes.<id>Desc
    group: ElementTemplateGroup;
    build: (t: TemplateTranslate) => CardElement;
}
