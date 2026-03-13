import React from 'react';
import { FileCode2, Image, PlusSquare, RotateCcw, Star, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from '../hooks/useTranslation';
import { useLocale } from '../context/LocaleContext';
import locales from '../config/locales.json'; // 引入语言配置文件

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCardClick: () => void;
  onResetClick: () => void;
  onExportHtmlClick: () => void;
  onExportImageClick: () => void;
  displayColor: string;
  onColorChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isAccentColorEnabled: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onAddCardClick, onResetClick, onExportHtmlClick, onExportImageClick, displayColor, onColorChange, isAccentColorEnabled }) => {
  const { theme, setTheme, resolvedTheme, themeOptions } = useTheme();
  const { t } = useTranslation();
  const { locale, setLocale } = useLocale();

  const handleButtonClick = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <div className={`sidebar-container ${isOpen ? 'is-open' : ''}`}>
      <div className="sidebar-overlay" onClick={onClose}></div>
      <aside className="sidebar-menu">
        <div className="sidebar-header">
          <h3>{t('sidebar.menu')}</h3>
          <button onClick={onClose} className="sidebar-close-btn" title={t('sidebar.close')} aria-label={t('sidebar.close')}>
            <X size={24} />
          </button>
        </div>
        <nav className="sidebar-nav">
          {isAccentColorEnabled && (
            <div className="sidebar-item">
              <label htmlFor="sidebarAccentColorPicker">{t('toolbar.themeColor')}</label>
              <input
                type="color"
                id="sidebarAccentColorPicker"
                value={displayColor}
                onChange={onColorChange}
                aria-label={t('toolbar.selectThemeColor')}
              />
            </div>
          )}
          <button onClick={() => handleButtonClick(onAddCardClick)} className="button-style sidebar-item-button">
            <PlusSquare size={20} />
            <span>{t('toolbar.addCard')}</span>
          </button>
          <button onClick={() => handleButtonClick(onResetClick)} className="button-style sidebar-item-button">
            <RotateCcw size={20} />
            <span>{t('toolbar.resetStyle')}</span>
          </button>
          <button onClick={() => handleButtonClick(onExportHtmlClick)} className="button-style sidebar-item-button">
            <FileCode2 size={20} />
            <span>{t('toolbar.exportHtml')}</span>
          </button>
          <button onClick={() => handleButtonClick(onExportImageClick)} className="button-style sidebar-item-button" title={`${t('toolbar.exportImage')} Beta`} aria-label={`${t('toolbar.exportImage')} Beta`}>
            <Image size={20} />
            <span>
              {t('toolbar.exportImage')}
              <span className="feature-beta-badge">Beta</span>
            </span>
          </button>
          <a href="https://github.com/Chizukuo/ProfileCraft" target="_blank" rel="noopener noreferrer" className="button-style sidebar-item-button">
            <Star size={20} />
            <span>{t('toolbar.starOnGithub')}</span>
          </a>
          <div className="sidebar-item">
            <label htmlFor="sidebarThemeSwitcher">{t('toolbar.themeStyle')}</label>
            <select
              id="sidebarThemeSwitcher"
              value={theme}
              onChange={e => setTheme(e.target.value)}
              className="select-inline-offset"
              aria-label={t('toolbar.selectTheme')}
              title={resolvedTheme.description}
            >
              {themeOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className="sidebar-item">
            <label htmlFor="sidebarLocaleSwitcher">{t('toolbar.language')}</label>
            <select
              id="sidebarLocaleSwitcher"
              value={locale}
              onChange={e => setLocale(e.target.value as any)}
              className="select-inline-offset"
              aria-label={t('toolbar.selectLanguage')}
            >
              {Object.entries(locales).map(([key, value]) => (
                <option key={key} value={key}>{value.nativeName}</option>
              ))}
            </select>
          </div>
        </nav>
      </aside>
    </div>
  );
};

export default Sidebar;
