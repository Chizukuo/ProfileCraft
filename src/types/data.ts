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
}

export interface TagData {
  text: string;
  styles?: Styles;
  type?: string;
}

interface BaseElement {
  type: string;
  styles?: Styles;
}

export interface ParagraphElement extends BaseElement {
  type: 'paragraph';
  text: string;
}

export interface ProfileInfoElement extends BaseElement {
  type: 'profileInfo';
  nickname: string;
  gender: string;
  age: string;
  location: string;
  mbti: string;
  textStyles: Styles;
}

export interface TagSectionElement extends BaseElement {
  type: 'tagSection';
  subheading: string;
  subheadingStyles: Styles;
  tags: TagData[];
  tagStyles: Styles;
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
}

export type CardElement =
  | ParagraphElement
  | ProfileInfoElement
  | TagSectionElement
  | GroupedTagSectionElement
  | OshiSectionElement;

export interface CardLayout {
    i: string;
    x: number;
    y: number;
    w: number;
    h: number;
}

export interface CardData {
  id: string;
  title: string;
  titleStyles: Styles;
  layoutSpan: string;
  layout?: CardLayout;
  elements: CardElement[];
}

export interface ProfileData {
  userSettings: UserSettings;
  cards: CardData[];
}

// ---- Templates ----
export interface CardTemplate {
    name: string;
    description: string;
    data: Omit<CardData, 'id'>;
}

export interface ElementTemplate {
    name: string;
    description: string;
    data: CardElement;
}
