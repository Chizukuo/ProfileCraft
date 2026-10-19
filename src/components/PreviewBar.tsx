import React from 'react';
import { Eye, Palette, Image, FileCode2, X, Smartphone } from 'lucide-react';
import { useProfileDataCtx, useProfileActions } from '../context/ProfileContext';
import { useEditorUI } from '../context/EditorUIContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from '../hooks/useTranslation';
import { useExportActions } from '../hooks/useExportActions';

/** 预览模式下替代底部 Dock：说明当前状态，并提供导出与退出 */
const PreviewBar: React.FC = () => {
  const { profileData } = useProfileDataCtx();
  const { replaceProfileData } = useProfileActions();
  const { setPreview, setCustomizeOpen } = useEditorUI();
  const { theme } = useTheme();
  const { t, locale } = useTranslation();
  const exportActions = useExportActions({ profileData, theme, locale, replaceProfileData });

  return (
    <div className="preview-bar" role="toolbar" aria-label={t('preview.title')}>
      <span className="preview-bar-status">
        <Eye size={16} /> {t('preview.title')}
      </span>
      <button type="button" className="preview-bar-btn" onClick={() => setCustomizeOpen(open => !open)}>
        <Palette size={15} /> <span>{t('toolbar.appearance')}</span>
      </button>
      <button type="button" className="preview-bar-btn" onClick={exportActions.handleExportImage}>
        <Image size={15} /> <span>{t('toolbar.exportImage')}</span>
      </button>
      <button type="button" className="preview-bar-btn" onClick={exportActions.handleExportImagePhone}>
        <Smartphone size={15} /> <span>{t('toolbar.exportImagePhoneShort')}</span>
      </button>
      <button type="button" className="preview-bar-btn" onClick={exportActions.handleExportHtml}>
        <FileCode2 size={15} /> <span>{t('toolbar.exportHtml')}</span>
      </button>
      <button type="button" className="preview-bar-btn is-primary" onClick={() => setPreview(false)}>
        <X size={15} /> <span>{t('preview.exit')}</span> <kbd>Esc</kbd>
      </button>
    </div>
  );
};

export default PreviewBar;
