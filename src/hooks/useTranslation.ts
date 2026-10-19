import { useState, useEffect, useMemo } from 'react';
import { useLocale } from '../context/LocaleContext';
import { loadTranslations, createT, getCachedTranslations } from '../utils/i18n';

/**
 * 使用翻译的自定义 Hook
 * @returns { t: 翻译函数, locale: 当前语言, isLoading: 是否正在加载 }
 */
export const useTranslation = () => {
  const { locale, setLocale } = useLocale();
  const [translations, setTranslations] = useState<any>(() => getCachedTranslations(locale) ?? {});
  const [isLoading, setIsLoading] = useState(() => !getCachedTranslations(locale));

  useEffect(() => {
    let cancelled = false;
    const cached = getCachedTranslations(locale);
    if (cached) {
      setTranslations(cached);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    loadTranslations(locale).then((data) => {
      if (cancelled) return;
      setTranslations(data);
      setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [locale]);

  const t = useMemo(() => createT(translations), [translations]);

  return {
    t,
    locale,
    setLocale,
    isLoading
  };
};
