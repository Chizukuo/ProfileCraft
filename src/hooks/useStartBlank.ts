import { useCallback } from 'react';
import { useProfileActions, useProfileDataCtx } from '../context/ProfileContext';
import { getBlankProfileData } from '../utils/data';
import { useTranslation } from './useTranslation';

/**
 * 清空内容、从空白开始：换成一张身份卡 + 一张关于我，保留当前的主题和外观。
 * 走 replaceProfileData，可以从撤销提示或 Ctrl/⌘+Z 恢复，所以不需要确认框。
 */
export const useStartBlank = () => {
  const { profileData } = useProfileDataCtx();
  const { replaceProfileData } = useProfileActions();
  const { t } = useTranslation();

  return useCallback(() => {
    if (!profileData) return;
    const blank = getBlankProfileData(t);
    const { theme, accentColor, appearance } = profileData.userSettings;
    replaceProfileData({ ...blank, userSettings: { ...blank.userSettings, theme, accentColor, ...(appearance ? { appearance } : {}) } }, 'blank');
  }, [profileData, replaceProfileData, t]);
};
