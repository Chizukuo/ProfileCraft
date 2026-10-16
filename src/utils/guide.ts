import type { Locale } from '../context/LocaleContext';

/** 使用指南是 public/guide/ 下的静态页面；中文以外的语言统一用英文版 */
export const getGuideUrl = (locale: Locale) =>
  `${import.meta.env.BASE_URL}guide/${locale === 'zh-CN' ? 'index' : 'en'}.html`;
