import React, { useEffect, useState } from 'react';
import { BookOpen, X } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { safeGetItem, safeSetItem } from '../../utils/storage';
import { getGuideUrl } from '../../utils/guide';
import { useStartBlank } from '../../hooks/useStartBlank';

const DISMISSED_KEY = 'profilecraft-guide-hint-dismissed';
const SHOW_DELAY_MS = 1200;

/** 首次访问时在 Dock 上方提示一次：看使用指南，或者清掉示例从空白开始；关闭或点过之后不再出现 */
const GuideHint: React.FC = () => {
  const { t, locale } = useTranslation();
  const [visible, setVisible] = useState(false);
  const startBlank = useStartBlank();

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
      <button type="button" className="guide-hint-action" onClick={() => { startBlank(); dismiss(); }}>
        {t('guideHint.startBlank')}
      </button>
      <button type="button" onClick={dismiss} aria-label={t('common.close')}>
        <X size={14} />
      </button>
    </div>
  );
};

export default GuideHint;
