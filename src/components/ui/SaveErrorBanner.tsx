import React, { useState } from 'react';
import { AlertTriangle, Download, X } from 'lucide-react';
import { useProfileDataCtx } from '../../context/ProfileContext';
import { useTranslation } from '../../hooks/useTranslation';
import { BACKUP_KEY } from '../../hooks/useProfileData';
import { safeGetItem } from '../../utils/storage';

const downloadText = (text: string, filename: string) => {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

/**
 * 数据安全相关的常驻提示：
 * - 写入 localStorage 失败（否则用户刷新后才会发现修改全没了）
 * - 启动时旧数据读不出来、已原样备份（让用户能把它下载下来）
 */
const SaveErrorBanner: React.FC = () => {
  const { saveError, unreadableBackup, profileData } = useProfileDataCtx();
  const { t, locale } = useTranslation();
  const [backupDismissed, setBackupDismissed] = useState(false);

  if (saveError) {
    const handleBackup = async () => {
      const { exportConfig } = await import('../../utils/exportUtils');
      exportConfig(profileData, locale);
    };
    return (
      <div className="save-error-banner" role="alert">
        <AlertTriangle size={16} />
        <span>{t('notification.saveFailed')}</span>
        <button type="button" onClick={handleBackup}>
          <Download size={14} /> {t('notification.downloadBackup')}
        </button>
      </div>
    );
  }

  if (unreadableBackup && !backupDismissed) {
    const raw = safeGetItem(BACKUP_KEY);
    return (
      <div className="save-error-banner" role="alert">
        <AlertTriangle size={16} />
        <span>{t('notification.unreadableData')}</span>
        {raw && (
          <button type="button" onClick={() => downloadText(raw, `profilecraft-unreadable_${new Date().toISOString().slice(0, 10)}.json`)}>
            <Download size={14} /> {t('notification.downloadBackup')}
          </button>
        )}
        <button type="button" onClick={() => setBackupDismissed(true)} aria-label={t('common.close')}>
          <X size={14} />
        </button>
      </div>
    );
  }

  return null;
};

export default SaveErrorBanner;
