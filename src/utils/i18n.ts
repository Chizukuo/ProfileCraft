import { Locale } from '../context/LocaleContext';

// 翻译文本类型
type TranslationObject = {
  [key: string]: string | TranslationObject;
};

// 缓存已加载的翻译文件
const translationCache: Map<Locale, TranslationObject> = new Map();

/**
 * 加载指定语言的翻译文件
 * @param locale 语言代码
 * @returns 翻译对象
 */
export const loadTranslations = async (locale: Locale): Promise<TranslationObject> => {
  // 如果已缓存,直接返回
  if (translationCache.has(locale)) {
    console.log('[i18n] 从缓存加载翻译:', locale);
    return translationCache.get(locale)!;
  }

  try {
    console.log('[i18n] 尝试加载翻译文件:', locale);
    // 使用 import.meta.env.BASE_URL 获取正确的 base 路径
    const basePath = import.meta.env.BASE_URL || '/';
    const url = `${basePath}locales/${locale}.json`;
    console.log('[i18n] 请求 URL:', url);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const translations = await response.json();
    console.log('[i18n] 成功加载翻译:', locale, translations);
    translationCache.set(locale, translations);
    return translations;
  } catch (error) {
    console.error(`[i18n] 加载翻译失败: ${locale}`, error);
    // 如果加载失败，尝试加载默认语言（简体中文）
    if (locale !== 'zh-CN') {
      console.log('[i18n] 回退到默认语言: zh-CN');
      return loadTranslations('zh-CN');
    }
    return {};
  }
};

/**
 * 从嵌套对象中获取翻译文本
 * @param obj 翻译对象
 * @param path 路径，使用点号分隔，如 'toolbar.addCard'
 * @returns 翻译文本
 */
const getNestedValue = (obj: TranslationObject, path: string): string => {
  const keys = path.split('.');
  let current: any = obj;
  
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return path; // 如果找不到，返回原始路径作为后备
    }
  }
  
  return typeof current === 'string' ? current : path;
};

/**
 * 翻译函数
 * @param translations 翻译对象
 * @param key 翻译键，使用点号分隔，如 'toolbar.addCard'
 * @param params 可选的参数对象，用于替换翻译文本中的占位符
 * @returns 翻译后的文本
 */
export const t = (
  translations: TranslationObject, 
  key: string, 
  params?: Record<string, string | number>
): string => {
  let text = getNestedValue(translations, key);
  
  // 替换参数
  if (params) {
    Object.keys(params).forEach(paramKey => {
      text = text.replace(`{${paramKey}}`, String(params[paramKey]));
    });
  }
  
  return text;
};

/**
 * 创建一个绑定了翻译对象的 t 函数
 * @param translations 翻译对象
 * @returns 绑定后的 t 函数
 */
export const createT = (translations: TranslationObject) => {
  return (key: string, params?: Record<string, string | number>) => {
    const result = t(translations, key, params);
    // 只在翻译键没有找到时打印调试信息
    if (result === key) {
      console.warn('[i18n] 翻译键未找到:', key);
    }
    return result;
  };
};
