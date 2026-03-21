import React, { useCallback, useRef } from 'react';
import { ProfileData } from '../types/data';

interface UseExportActionsProps {
  profileData: ProfileData | null;
  theme: string;
  locale: string;
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
      exportToHtml(profileData, theme as any, locale as any);
    }
  }, [profileData, theme, locale]);

  const handleExportImage = useCallback(async () => {
    const container = document.getElementById('profileCardContainer');
    if (container && profileData) {
      const { exportToImage } = await import('../utils/exportUtils');
      exportToImage(container, profileData, locale as any, theme as any);
    }
  }, [profileData, locale, theme]);

  const handleExportConfig = useCallback(async () => {
    if (profileData) {
      const { exportConfig } = await import('../utils/exportUtils');
      exportConfig(profileData, locale as any);
    }
  }, [profileData, locale]);

  const handleImportConfigClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleImportConfig = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const { importConfig } = await import('../utils/importUtils');
      importConfig(file, locale as any, (data) => updateProfileData(() => data));
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
