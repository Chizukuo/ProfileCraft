import { useState, useEffect } from 'react';
import { useLocale } from '../context/LocaleContext';
import { loadTranslations, createT } from '../utils/i18n';

/**
 * 使用翻译的自定义 Hook
 * @returns { t: 翻译函数, locale: 当前语言, isLoading: 是否正在加载 }
 */
export const useTranslation = () => {
  const { locale, setLocale } = useLocale();
  const [translations, setTranslations] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadLanguage = async () => {
      setIsLoading(true);
      console.log('[useTranslation] 正在加载语言:', locale);
      const data = await loadTranslations(locale);
      console.log('[useTranslation] 加载的翻译数据:', data);
      setTranslations(data);
      setIsLoading(false);
    };

    loadLanguage();
  }, [locale]);

  return {
    t: createT(translations),
    locale,
    setLocale,
    isLoading
  };
};
