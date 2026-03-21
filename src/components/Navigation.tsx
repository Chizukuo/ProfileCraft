import React, { useState, useCallback, useEffect, useRef, Suspense } from 'react';
import { useProfile } from '../context/ProfileContext';
import { FileCode2, Image, PlusSquare, RotateCcw, Star, Sparkles, Download, Upload, Share2, Palette, Paintbrush, Languages, Settings, Share, Settings2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from '../hooks/useTranslation';
import localesManifest from '../config/locales.json';
import { useThrottle } from '../hooks/useThrottle';
import ExportMenu from './ui/ExportMenu';
import { useExportActions } from '../hooks/useExportActions';

const ConfirmDialog = React.lazy(() => import('./ui/ConfirmDialog'));
const AIProfileBuilderModal = React.lazy(() => import('./AIProfileBuilderModal'));

interface NavigationProps {
  onAddCardClick: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ onAddCardClick }) => {
  const { profileData, updateProfileData, resetProfileData } = useProfile();
  const { theme, setTheme, resolvedTheme, themeOptions } = useTheme();
  const { t, locale, setLocale } = useTranslation();
  
  const [isResetModalOpen, setResetModalOpen] = useState(false);
  const [isAiModalOpen, setAiModalOpen] = useState(false);
  const [isExportMenuOpen, setExportMenuOpen] = useState(false);
  const [isAppearanceOpen, setAppearanceOpen] = useState(false);
  
  const [displayColor, setDisplayColor] = useState(profileData?.userSettings.accentColor || '#FFC300');

  const appearanceRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  
  // Custom hook for export actions
  const exportActions = useExportActions({
    profileData,
    theme,
    locale,
    updateProfileData
  });

  const accentColor = profileData?.userSettings.accentColor;
  useEffect(() => {
    if (accentColor) {
      setDisplayColor(accentColor);
    }
  }, [accentColor]);

  const throttledUpdateGlobalColor = useThrottle((newColor: string) => {
    updateProfileData(prev => ({
        ...prev!,
        userSettings: { ...prev!.userSettings, accentColor: newColor }
    }));
  }, 50);

  const handleColorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setDisplayColor(newColor);
    throttledUpdateGlobalColor(newColor);
  }, [throttledUpdateGlobalColor]);

  const confirmReset = useCallback(() => {
    resetProfileData();
    setResetModalOpen(false);
  }, [resetProfileData]);

  // Handle clicks outside for both popovers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (appearanceRef.current && !appearanceRef.current.contains(event.target as Node)) {
        setAppearanceOpen(false);
      }
      if (exportRef.current && !exportRef.current.contains(event.target as Node)) {
        setExportMenuOpen(false);
      }
    };
    
    if (isAppearanceOpen || isExportMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isAppearanceOpen, isExportMenuOpen]);

  if (!profileData) return null;

  const localeOptions = Object.entries(localesManifest).map(([value, info]) => ({
    value,
    label: info.nativeName
  }));

  const closeAllMenus = () => {
    setAppearanceOpen(false);
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
            onClick={() => { closeAllMenus(); setAiModalOpen(true); }}
            title={t('toolbar.aiGenerate')}
          >
            <Sparkles size={22} strokeWidth={2.5} />
            <span className="dock-btn-label">{t('toolbar.aiGenerate')}</span>
          </button>

          <div className="dock-divider"></div>

          {/* Section 2: Appearance (Zero Learning Cost) */}
          <div className="dock-popover-wrapper" ref={appearanceRef}>
            <button 
              className={`dock-btn dock-btn-highlight ${isAppearanceOpen ? 'active' : ''}`}
              onClick={() => {
                setAppearanceOpen(!isAppearanceOpen);
                setExportMenuOpen(false);
              }}
              title={t('toolbar.appearance')}
            >
              <Palette size={22} strokeWidth={2.5} />
              <span className="dock-btn-label">{t('toolbar.appearance')}</span>
            </button>
            
            {isAppearanceOpen && (
              <div className="dock-preferences-menu popover-appearance">
                <div className="pref-header">
                  <Palette size={18} className="pref-icon-inline" /> {t('toolbar.appearance')}
                </div>
                
                {resolvedTheme.settings.isAccentColorEnabled && (
                  <div className="pref-card">
                    <span className="pref-card-title">{t('toolbar.themeColor')}</span>
                    <div className="color-picker-container">
                       <input
                         type="color"
                         className="pref-color-input-big"
                         value={displayColor}
                         onChange={handleColorChange}
                       />
                       <span className="color-hex-value">{displayColor.toUpperCase()}</span>
                    </div>
                  </div>
                )}
                
                <div className="pref-card">
                  <span className="pref-card-title">{t('toolbar.themeStyle')}</span>
                  <div className="theme-selector-grid">
                    {themeOptions.map(opt => (
                      <button 
                        key={opt.value} 
                        className={`theme-selector-btn ${theme === opt.value ? 'selected' : ''}`}
                        onClick={() => setTheme(opt.value)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="dock-divider"></div>

          {/* Section 3: Export & Settings */}
          <div className="dock-popover-wrapper" ref={exportRef}>
            <button 
              className={`dock-btn ${isExportMenuOpen ? 'active' : ''}`}
              onClick={() => {
                setExportMenuOpen(!isExportMenuOpen);
                setAppearanceOpen(false);
              }}
              title={t('toolbar.exportSettings')}
            >
              <Settings size={22} strokeWidth={2.5} />
              <span className="dock-btn-label">{t('toolbar.exportSettings')}</span>
            </button>
            
            {isExportMenuOpen && (
              <div className="dock-preferences-menu popover-export">
                
                {/* Export Options */}
                <div className="pref-group-title">
                  <Share size={14} className="pref-icon-inline" /> {t('toolbar.exportShare')}
                </div>
                <div className="pref-row pref-action" onClick={exportActions.handleExportHtml}>
                  <FileCode2 size={16} className="pref-icon" />
                  <span>{t('toolbar.exportHtml')}</span>
                </div>
                <div className="pref-row pref-action" onClick={exportActions.handleExportImage}>
                  <Image size={16} className="pref-icon" />
                  <span>{t('toolbar.exportImage')}</span>
                </div>
                <div className="pref-row pref-action" onClick={exportActions.handleExportConfig}>
                  <Download size={16} className="pref-icon" />
                  <span>{t('toolbar.exportConfig')}</span>
                </div>
                <div className="pref-row pref-action" onClick={exportActions.handleImportConfigClick}>
                  <Upload size={16} className="pref-icon" />
                  <span>{t('toolbar.importConfig')}</span>
                </div>

                <div className="pref-divider"></div>

                {/* Other Settings */}
                <div className="pref-group-title">
                  <Settings2 size={14} className="pref-icon-inline" /> {t('toolbar.exportSettings')}
                </div>
                <div className="pref-row">
                  <Languages size={16} className="pref-icon" />
                  <span>{t('toolbar.language')}</span>
                  <select
                    value={locale}
                    onChange={e => setLocale(e.target.value as any)}
                    className="pref-select"
                  >
                    {localeOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div className="pref-row pref-action" onClick={() => { setResetModalOpen(true); setExportMenuOpen(false); }}>
                  <RotateCcw size={16} className="pref-icon text-red" />
                  <span className="text-red">{t('toolbar.restoreDefault')}</span>
                </div>
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
            <span className="dock-btn-label">Star us</span>
          </a>

        </div>
      </div>

      <Suspense fallback={null}>
        {isResetModalOpen && (
          <ConfirmDialog
            isOpen={isResetModalOpen}
            onClose={() => setResetModalOpen(false)}
            onConfirm={confirmReset}
            title={t('modal.confirmReset')}
            message={t('modal.confirmResetMessage')}
            confirmText={t('modal.confirmResetButton')}
            isDangerous={true}
          />
        )}

        {isAiModalOpen && (
          <AIProfileBuilderModal
            isOpen={isAiModalOpen}
            onClose={() => setAiModalOpen(false)}
          />
        )}
      </Suspense>
    </>
  );
};

export default React.memo(Navigation);
