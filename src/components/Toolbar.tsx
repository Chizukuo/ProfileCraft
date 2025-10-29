import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useProfile } from '../context/ProfileContext.tsx';
import { exportToHtml, exportToImage } from '../utils/exportUtils.ts';
import { FileCode2, Image, PlusSquare, RotateCcw, Star, Menu } from 'lucide-react';
import Modal from '../components/ui/Modal.tsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.tsx';
import { getThemeSettings, ThemeSettings } from '../utils/themeUtils.ts';
import Sidebar from './Sidebar.tsx';
import { useTheme } from '../context/ThemeContext.tsx';
import themesManifest from '../config/themes.json';

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
      exportToHtml(profileData!, theme); 
  }, [profileData, theme]);

  const handleExportImage = useCallback(() => {
      const container = document.getElementById('profileCardContainer');
      if(container) {
        exportToImage(container, profileData);
      }
  }, [profileData]);

  if (!profileData) {
    return null;
  }

  // 动态生成主题选项
  const themeOptions = Object.entries(themesManifest).map(([value, info]) => ({
    value,
    label: info.name
  }));

  return (
    <>
      <header className="editor-toolbar top-toolbar">
        <div className="hamburger-menu">
            <button onClick={() => setSidebarOpen(true)} title="打开菜单" aria-label="打开菜单">
                <Menu size={24} />
            </button>
        </div>

        <div className="desktop-toolbar-content">
            {themeSettings.isAccentColorEnabled && (
                <div className="toolbar-group">
                    <label htmlFor="accentColorPicker">主题色:</label>
                    <input
                        type="color"
                        id="accentColorPicker"
                        value={displayColor}
                        onChange={handleColorChange}
                        aria-label="选择主题色"
                    />
                </div>
            )}
            <div className="toolbar-group">
              <button onClick={onAddCardClick} title="添加新卡片" aria-label="添加新卡片">
                <PlusSquare size={16} />
                <span className="toolbar-button-text">添加卡片</span>
              </button>
            </div>
            <div className="toolbar-group">
              <button onClick={handleReset} title="恢复默认模板" aria-label="恢复默认模板">
                <RotateCcw size={16} />
                <span className="toolbar-button-text">重置样式</span>
              </button>
            </div>
            <div className="toolbar-group">
              <button onClick={handleExportHtml} title="导出 HTML" aria-label="导出 HTML">
                <FileCode2 size={16} />
                <span className="toolbar-button-text">导出 HTML</span>
              </button>
              <button onClick={handleExportImage} title="导出图片" aria-label="导出图片">
                <Image size={16} />
                <span className="toolbar-button-text">导出图片</span>
              </button>
            </div>
            <div className="toolbar-group">
              <label htmlFor="themeSwitcher">主题风格:</label>
              <select
                id="themeSwitcher"
                value={theme}
                onChange={e => setTheme(e.target.value as any)}
                style={{ marginLeft: 4 }}
                aria-label="选择主题风格"
              >
                {themeOptions.map(opt => (
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
                title="在 GitHub 上点个 Star"
                aria-label="在 GitHub 上点个 Star"
              >
                <Star size={16} />
                <span className="toolbar-button-text">Github</span>
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
        title="确认重置"
        message="您确定要重置所有内容到默认模板吗？此操作无法撤销。"
        confirmText="确认重置"
        isDangerous={true}
      />
    </>
  );
};

export default React.memo(Toolbar);
