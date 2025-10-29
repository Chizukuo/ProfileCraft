import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useProfile } from '../context/ProfileContext.tsx';
import { exportToHtml, exportToImage } from '../utils/exportUtils.ts';
import { FileCode2, Image, PlusSquare, RotateCcw, Star, Menu, Globe } from 'lucide-react';
import Modal from '../components/ui/Modal.tsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.tsx';
import { getThemeSettings, ThemeSettings } from '../utils/themeUtils.ts';
import Sidebar from './Sidebar.tsx';
import { useTheme } from '../context/ThemeContext.tsx';
import { useTranslation } from '../hooks/useTranslation.ts';
import themesManifest from '../config/themes.json';
import localesManifest from '../config/locales.json';

/**
 * 限制函数调用频率的自定义 Hook
 * @param callback 需要限制频率的函数
 * @param delay 限制的延迟时间（毫秒）
 * @returns 经过限制的函数
 */
const useThrottle = (callback: (...args: any[]) => void, delay: number) => {
    const isThrottled = useRef(false);
    const timeoutRef = useRef<number | null>(null);
  
    const throttledCallback = useCallback((...args: any[]) => {
      if (isThrottled.current) return;
      callback(...args);
      isThrottled.current = true;
      timeoutRef.current = window.setTimeout(() => {
        isThrottled.current = false;
      }, delay);
    }, [callback, delay]);
  
    useEffect(() => {
      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    }, []);
  
    return throttledCallback;
};

interface ToolbarProps {
  onAddCardClick: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ onAddCardClick }) => {
  const { profileData, updateProfileData, resetProfileData } = useProfile();
  const { theme, setTheme } = useTheme();
  const { t, locale, setLocale } = useTranslation();
  const [isResetModalOpen, setResetModalOpen] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>({ isAccentColorEnabled: true });
  const [displayColor, setDisplayColor] = useState(profileData?.userSettings.accentColor || '#FFC300');

  useEffect(() => {
      (async () => {
        const settings = await getThemeSettings(theme);
        setThemeSettings(settings);
      })();
    }, [theme]);

  useEffect(() => {
    if (profileData) {
      setDisplayColor(profileData.userSettings.accentColor);
    }
  }, [profileData?.userSettings.accentColor]);

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

  const handleReset = useCallback(() => {
    setResetModalOpen(true);
  }, []);

  const confirmReset = useCallback(() => {
    resetProfileData();
    setResetModalOpen(false);
  }, [resetProfileData]);

  const handleExportHtml = useCallback(() => {
      exportToHtml(profileData!, theme, locale); 
  }, [profileData, theme, locale]);

  const handleExportImage = useCallback(() => {
      const container = document.getElementById('profileCardContainer');
      if (container) {
        exportToImage(container, profileData, locale);
      }
  }, [profileData, locale]);

  if (!profileData) {
    return null;
  }

  // 动态生成主题选项
  const themeOptions = Object.entries(themesManifest).map(([value, info]) => ({
    value,
    label: info.name
  }));

  // 动态生成语言选项
  const localeOptions = Object.entries(localesManifest).map(([value, info]) => ({
    value,
    label: info.nativeName
  }));

  return (
    <>
      <header className="editor-toolbar top-toolbar">
        <div className="hamburger-menu">
            <button onClick={() => setSidebarOpen(true)} title={t('toolbar.openMenu')} aria-label={t('toolbar.openMenu')}>
                <Menu size={24} />
            </button>
        </div>

        <div className="desktop-toolbar-content">
            {themeSettings.isAccentColorEnabled && (
                <div className="toolbar-group">
                    <label htmlFor="accentColorPicker">{t('toolbar.themeColor')}:</label>
                    <input
                        type="color"
                        id="accentColorPicker"
                        value={displayColor}
                        onChange={handleColorChange}
                        aria-label={t('toolbar.selectThemeColor')}
                    />
                </div>
            )}
            <div className="toolbar-group">
              <button onClick={onAddCardClick} title={t('toolbar.addNewCard')} aria-label={t('toolbar.addNewCard')}>
                <PlusSquare size={16} />
                <span className="toolbar-button-text">{t('toolbar.addCard')}</span>
              </button>
            </div>
            <div className="toolbar-group">
              <button onClick={handleReset} title={t('toolbar.restoreDefault')} aria-label={t('toolbar.restoreDefault')}>
                <RotateCcw size={16} />
                <span className="toolbar-button-text">{t('toolbar.resetStyle')}</span>
              </button>
            </div>
            <div className="toolbar-group">
              <button onClick={handleExportHtml} title={t('toolbar.exportHtml')} aria-label={t('toolbar.exportHtml')}>
                <FileCode2 size={16} />
                <span className="toolbar-button-text">{t('toolbar.exportHtml')}</span>
              </button>
              <button onClick={handleExportImage} title={t('toolbar.exportImage')} aria-label={t('toolbar.exportImage')}>
                <Image size={16} />
                <span className="toolbar-button-text">{t('toolbar.exportImage')}</span>
              </button>
            </div>
            <div className="toolbar-group">
              <label htmlFor="themeSwitcher">{t('toolbar.themeStyle')}:</label>
              <select
                id="themeSwitcher"
                value={theme}
                onChange={e => setTheme(e.target.value as any)}
                style={{ marginLeft: 4 }}
                aria-label={t('toolbar.selectTheme')}
              >
                {themeOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="toolbar-group">
              <label htmlFor="localeSwitcher">{t('toolbar.language')}:</label>
              <select
                id="localeSwitcher"
                value={locale}
                onChange={e => setLocale(e.target.value as any)}
                style={{ marginLeft: 4 }}
                aria-label={t('toolbar.selectLanguage')}
              >
                {localeOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="toolbar-group toolbar-group-right">
              <a 
                href="https://github.com/Chizukuo/ProfileCraft" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="toolbar-button-link" 
                title={t('toolbar.starOnGithub')}
                aria-label={t('toolbar.starOnGithub')}
              >
                <Star size={16} />
                <span className="toolbar-button-text">{t('toolbar.github')}</span>
              </a>
            </div>
        </div>
      </header>
      
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onAddCardClick={onAddCardClick}
        onResetClick={handleReset}
        onExportHtmlClick={handleExportHtml}
        onExportImageClick={handleExportImage}
        displayColor={displayColor}
        onColorChange={handleColorChange}
        isAccentColorEnabled={themeSettings.isAccentColorEnabled}
      />
      
      <ConfirmDialog
        isOpen={isResetModalOpen}
        onClose={() => setResetModalOpen(false)}
        onConfirm={confirmReset}
        title={t('modal.confirmReset')}
        message={t('modal.confirmResetMessage')}
        confirmText={t('modal.confirmResetButton')}
        isDangerous={true}
      />
    </>
  );
};

export default React.memo(Toolbar);
