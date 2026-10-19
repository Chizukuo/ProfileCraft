import React, { useEffect, useState } from 'react';
import { BookOpen, X } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { safeGetItem, safeSetItem } from '../../utils/storage';
import { getGuideUrl } from '../../utils/guide';

const DISMISSED_KEY = 'profilecraft-guide-hint-dismissed';
const SHOW_DELAY_MS = 1200;

/** 首次访问时在 Dock 上方提示一次使用指南；关闭或点开后不再出现 */
const GuideHint: React.FC = () => {
  const { t, locale } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (safeGetItem(DISMISSED_KEY)) return;
    const timer = window.setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    safeSetItem(DISMISSED_KEY, '1');
    setVisible(false);
  };

  return (
    <div className="guide-hint" role="note">
      <BookOpen size={16} />
      <span>{t('guideHint.text')}</span>
      <a href={getGuideUrl(locale)} target="_blank" rel="noopener noreferrer" onClick={dismiss}>
        {t('guideHint.open')}
      </a>
      <button type="button" onClick={dismiss} aria-label={t('common.close')}>
        <X size={14} />
      </button>
    </div>
  );
};

export default GuideHint;
