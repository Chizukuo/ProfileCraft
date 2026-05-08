import React, { useCallback, useRef } from 'react';
import { ProfileData } from '../types/data';
import type { ThemeKey } from '../utils/themeUtils';
import type { Locale } from '../context/LocaleContext';

interface UseExportActionsProps {
  profileData: ProfileData | null;
  theme: ThemeKey;
  locale: Locale;
  updateProfileData: (updater: (prev: ProfileData) => ProfileData) => void;
}

export const useExportActions = ({
  profileData,
  theme,
  locale,
  updateProfileData
}: UseExportActionsProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportHtml = useCallback(async () => {
    if (profileData) {
      const { exportToHtml } = await import('../utils/exportUtils');
      exportToHtml(profileData, theme, locale);
    }
  }, [profileData, theme, locale]);

  const handleExportImage = useCallback(async () => {
    const container = document.getElementById('profileCardContainer');
    if (container && profileData) {
      const { exportToImage } = await import('../utils/exportUtils');
      exportToImage(container, profileData, locale, theme);
    }
  }, [profileData, locale, theme]);

  const handleExportConfig = useCallback(async () => {
    if (profileData) {
      const { exportConfig } = await import('../utils/exportUtils');
      exportConfig(profileData, locale);
    }
  }, [profileData, locale]);

  const handleImportConfigClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleImportConfig = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const { importConfig } = await import('../utils/importUtils');
      importConfig(file, locale, (data) => updateProfileData(() => data));
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [locale, updateProfileData]);

  return {
    fileInputRef,
    handleExportHtml,
    handleExportImage,
    handleExportConfig,
    handleImportConfigClick,
    handleImportConfig
  };
};
