import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import localesManifest from '../config/locales.json';

export type Locale = keyof typeof localesManifest;

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export const LocaleProvider = ({ children }: { children: ReactNode }) => {
  // 默认语言设为简体中文，或根据浏览器语言自动检测
  const getDefaultLocale = (): Locale => {
    // 首先检查 localStorage
    const savedLocale = localStorage.getItem('profilecraft-locale') as Locale;
    if (savedLocale && Object.keys(localesManifest).includes(savedLocale)) {
      return savedLocale;
    }

    // 如果没有保存的语言，使用浏览器语言
    const browserLang = navigator.language;
    const supportedLocales = Object.keys(localesManifest) as Locale[];
    
    // 尝试完全匹配
    if (supportedLocales.includes(browserLang as Locale)) {
      return browserLang as Locale;
    }
    
    // 尝试语言代码匹配（例如 'en' 匹配 'en-US'）
    const langCode = browserLang.split('-')[0];
    const matchedLocale = supportedLocales.find(locale => 
      locale.startsWith(langCode)
    );
    
    if (matchedLocale) {
      return matchedLocale;
    }
    
    return 'zh-CN';
  };

  const [locale, setLocale] = useState<Locale>(getDefaultLocale);

  useEffect(() => {
    // 更新 HTML lang 属性
    document.documentElement.lang = locale;
    
    // 设置语言数据属性，用于 CSS 字体选择
    document.documentElement.setAttribute('data-locale', locale);
    
    // 保存到 localStorage
    localStorage.setItem('profilecraft-locale', locale);
  }, [locale]);

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
};

export const useLocale = () => {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
};
