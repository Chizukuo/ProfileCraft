import React, { useState, useCallback, useRef, Suspense } from 'react';
import { useProfileDataCtx, useProfileActions } from '../context/ProfileContext';
import { FileCode2, Image, PlusSquare, RotateCcw, Star, Sparkles, Download, Upload, Palette, Languages, MoreHorizontal, Share, Settings2, Eye, BookOpen, Smartphone, FilePlus2 } from 'lucide-react';
import { useEditorUI } from '../context/EditorUIContext';
import { getGuideUrl } from '../utils/guide';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from '../hooks/useTranslation';
import localesManifest from '../config/locales.json';
import { useExportActions } from '../hooks/useExportActions';
import { useStartBlank } from '../hooks/useStartBlank';
import { useDismissable } from '../hooks/useDismissable';
import type { Locale } from '../context/LocaleContext';
import ConfirmDialog from './ui/ConfirmDialog';

const AIChatPanel = React.lazy(() => import('./AIChatPanel'));

interface NavigationProps {
  onAddCardClick: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ onAddCardClick }) => {
  const { profileData } = useProfileDataCtx();
  const { replaceProfileData, resetProfileData } = useProfileActions();
  const { theme } = useTheme();
  const { t, locale, setLocale } = useTranslation();

  const startBlank = useStartBlank();
  const [isResetModalOpen, setResetModalOpen] = useState(false);
  const [isAiModalOpen, setAiModalOpen] = useState(false);
  const [isExportMenuOpen, setExportMenuOpen] = useState(false);
  const { isCustomizeOpen, setCustomizeOpen, setPreview } = useEditorUI();

  const exportRef = useRef<HTMLDivElement>(null);

  const exportActions = useExportActions({
    profileData,
    theme,
    locale,
    replaceProfileData,
  });

  const confirmReset = useCallback(() => {
    resetProfileData();
    setResetModalOpen(false);
  }, [resetProfileData]);

  const closeExportMenu = useCallback(() => setExportMenuOpen(false), []);
  const closeAi = useCallback(() => setAiModalOpen(false), []);
  useDismissable(isExportMenuOpen, exportRef, closeExportMenu);

  if (!profileData) return null;

  const localeOptions = Object.entries(localesManifest).map(([value, info]) => ({
    value,
    label: info.nativeName
  }));

  const closeAllMenus = () => {
    setExportMenuOpen(false);
  };

  return (
    <>
      {/* Hidden file input for import */}
      <input
        type="file"
        ref={exportActions.fileInputRef}
        onChange={exportActions.handleImportConfig}
        style={{ display: 'none' }}
        accept=".json"
      />

      <div className="floating-dock-container">
        <div className="floating-dock">
          {/* Section 1: Core Action */}
          <button 
            className="dock-btn dock-btn-primary" 
            onClick={() => { closeAllMenus(); onAddCardClick(); }}
            title={t('toolbar.addCard')}
          >
            <PlusSquare size={22} strokeWidth={2.5} />
            <span className="dock-btn-label">{t('toolbar.addCard')}</span>
          </button>
          
          <button 
            className="dock-btn dock-btn-magic" 
            onClick={() => { closeAllMenus(); setCustomizeOpen(false); setAiModalOpen(true); }}
            title={t('toolbar.aiGenerate')}
          >
            <Sparkles size={22} strokeWidth={2.5} />
            <span className="dock-btn-label">{t('toolbar.aiGenerate')}</span>
          </button>

          <div className="dock-divider"></div>

          {/* Section 2: Appearance */}
          <button
            className={`dock-btn dock-btn-highlight ${isCustomizeOpen ? 'active' : ''}`}
            onClick={() => {
              closeAllMenus();
              setCustomizeOpen(open => !open);
            }}
            title={t('toolbar.appearance')}
            aria-expanded={isCustomizeOpen}
          >
            <Palette size={22} strokeWidth={2.5} />
            <span className="dock-btn-label">{t('toolbar.appearance')}</span>
          </button>

          <button
            className="dock-btn"
            onClick={() => {
              closeAllMenus();
              setPreview(true);
            }}
            title={t('toolbar.previewHint')}
          >
            <Eye size={22} strokeWidth={2.5} />
            <span className="dock-btn-label">{t('toolbar.preview')}</span>
          </button>

          <div className="dock-divider"></div>

          {/* Section 3: Export & Settings */}
          <div className="dock-popover-wrapper" ref={exportRef}>
            <button
              className={`dock-btn ${isExportMenuOpen ? 'active' : ''}`}
              onClick={() => setExportMenuOpen(open => !open)}
              title={t('toolbar.exportSettings')}
              aria-expanded={isExportMenuOpen}
              aria-haspopup="true"
            >
              <MoreHorizontal size={22} strokeWidth={2.5} />
              <span className="dock-btn-label">{t('toolbar.exportSettings')}</span>
            </button>
            
            {isExportMenuOpen && (
              <div className="dock-preferences-menu popover-export">
                
                {/* Export Options */}
                <div className="pref-group-title">
                  <Share size={14} className="pref-icon-inline" /> {t('toolbar.exportShare')}
                </div>
                <button type="button" className="pref-row pref-action" onClick={exportActions.handleExportHtml}>
                  <FileCode2 size={16} className="pref-icon" />
                  <span>{t('toolbar.exportHtml')}</span>
                </button>
                <button type="button" className="pref-row pref-action" onClick={exportActions.handleExportImage}>
                  <Image size={16} className="pref-icon" />
                  <span>{t('toolbar.exportImage')}</span>
                </button>
                <button type="button" className="pref-row pref-action" onClick={exportActions.handleExportImagePhone}>
                  <Smartphone size={16} className="pref-icon" />
                  <span>{t('toolbar.exportImagePhone')}</span>
                </button>
                <button type="button" className="pref-row pref-action" onClick={exportActions.handleExportConfig}>
                  <Download size={16} className="pref-icon" />
                  <span>{t('toolbar.exportConfig')}</span>
                </button>
                <button type="button" className="pref-row pref-action" onClick={exportActions.handleImportConfigClick}>
                  <Upload size={16} className="pref-icon" />
                  <span>{t('toolbar.importConfig')}</span>
                </button>

                <div className="pref-divider"></div>

                {/* Other Settings */}
                <div className="pref-group-title">
                  <Settings2 size={14} className="pref-icon-inline" /> {t('toolbar.settingsHelp')}
                </div>
                <div className="pref-row">
                  <Languages size={16} className="pref-icon" />
                  <span>{t('toolbar.language')}</span>
                  <select
                    value={locale}
                    onChange={e => {
                      const val = e.target.value;
                      if (val in localesManifest) setLocale(val as Locale);
                    }}
                    className="pref-select"
                  >
                    {localeOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <a className="pref-row pref-action" href={getGuideUrl(locale)} target="_blank" rel="noopener noreferrer" onClick={closeAllMenus}>
                  <BookOpen size={16} className="pref-icon" />
                  <span>{t('toolbar.userGuide')}</span>
                </a>

                <button type="button" className="pref-row pref-action" onClick={() => { startBlank(); setExportMenuOpen(false); }}>
                  <FilePlus2 size={16} className="pref-icon" />
                  <span>{t('toolbar.startBlank')}</span>
                </button>
                <button type="button" className="pref-row pref-action" onClick={() => { setResetModalOpen(true); setExportMenuOpen(false); }}>
                  <RotateCcw size={16} className="pref-icon text-red" />
                  <span className="text-red">{t('toolbar.restoreDefault')}</span>
                </button>
              </div>
            )}
          </div>

          <div className="dock-divider"></div>

          {/* Section 4: GitHub Star CTA */}
          <a 
            href="https://github.com/Chizukuo/ProfileCraft" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="dock-btn dock-btn-star tooltip-trigger"
            title={t('toolbar.starOnGithub')}
          >
            <div className="star-pulse-bg"></div>
            <Star size={24} className="star-icon bouncy" />
            <span className="dock-btn-label">{t('toolbar.starUs')}</span>
          </a>

        </div>
      </div>

      <ConfirmDialog
        isOpen={isResetModalOpen}
        onClose={() => setResetModalOpen(false)}
        onConfirm={confirmReset}
        title={t('modal.confirmReset')}
        message={t('modal.confirmResetMessage')}
        confirmText={t('modal.confirmResetButton')}
        cancelText={t('modal.cancel')}
        isDangerous={true}
      />

      <Suspense fallback={null}>
        {isAiModalOpen && <AIChatPanel isOpen={isAiModalOpen} onClose={closeAi} />}
      </Suspense>
    </>
  );
};

export default React.memo(Navigation);
