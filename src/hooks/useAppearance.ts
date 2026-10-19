import { useCallback } from 'react';
import { useProfileActions } from '../context/ProfileContext';
import type { AppearanceSettings, ProfileData } from '../types/data';
import { DEFAULT_APPEARANCE, resolveAppearance } from '../utils/appearance';

/** 按分组更新外观设置：updateAppearance('card', { radius: 12 }) */
export const useAppearanceActions = () => {
  const { updateProfileData } = useProfileActions();

  const updateAppearance = useCallback(<K extends keyof AppearanceSettings>(section: K, patch: Partial<AppearanceSettings[K]>) => {
    updateProfileData((prev: ProfileData) => {
      const current = resolveAppearance(prev.userSettings.appearance);
      return {
        ...prev,
        userSettings: {
          ...prev.userSettings,
          appearance: { ...current, [section]: { ...current[section], ...patch } },
        },
      };
    });
  }, [updateProfileData]);

  const resetAppearance = useCallback((section?: keyof AppearanceSettings) => {
    updateProfileData((prev: ProfileData) => {
      const current = resolveAppearance(prev.userSettings.appearance);
      const next = section ? { ...current, [section]: DEFAULT_APPEARANCE[section] } : DEFAULT_APPEARANCE;
      return { ...prev, userSettings: { ...prev.userSettings, appearance: next } };
    });
  }, [updateProfileData]);

  return { updateAppearance, resetAppearance };
};
