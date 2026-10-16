import { useCallback } from 'react';
import { useProfileActions } from '../context/ProfileContext';
import { useTranslation } from './useTranslation';
import { compressImage, IMAGE_PRESETS } from '../utils/image';
import { showNotification } from '../utils/notify';

type Field = 'avatarSrc' | 'qrCodeImage';
const PRESET: Record<Field, keyof typeof IMAGE_PRESETS> = { avatarSrc: 'avatar', qrCodeImage: 'qrCode' };

/** 头像 / 二维码图片是全局设置（userSettings），所有头像区块、二维码区块共用 */
export const useSettingsImageUpload = (field: Field) => {
  const { updateProfileData } = useProfileActions();
  const { t } = useTranslation();

  return useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // 允许再次选择同一文件时仍触发 onChange
    e.target.value = '';
    if (!file) return;
    try {
      const src = await compressImage(file, IMAGE_PRESETS[PRESET[field]]);
      updateProfileData(prev => ({ ...prev, userSettings: { ...prev.userSettings, [field]: src } }));
    } catch (error) {
      console.error('Image upload failed:', error);
      showNotification(t('notification.imageError'), 'error');
    }
  }, [field, t, updateProfileData]);
};
