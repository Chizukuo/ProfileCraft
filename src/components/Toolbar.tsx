import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useProfile } from '../context/ProfileContext.tsx';
import { exportToHtml, exportToImage } from '../utils/exportUtils.ts';
import { FileCode2, Image, PlusSquare, RotateCcw, Star, Menu } from 'lucide-react';
import Modal from '../components/ui/Modal.tsx';
import { getThemeSettings, ThemeSettings } from '../utils/themeUtils.ts';
import Sidebar from './Sidebar.tsx';

/**
 * A custom hook to throttle a function call.
 * @param callback The function to throttle.
 * @param delay The throttle delay in milliseconds.
 * @returns A throttled version of the callback.
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
  const [isResetModalOpen, setResetModalOpen] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>({ isAccentColorEnabled: true });
  
  const [displayColor, setDisplayColor] = useState(profileData?.userSettings.accentColor || '#FFC300');

  useEffect(() => {
    setThemeSettings(getThemeSettings());
  }, []);

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

  if (!profileData) {
    return null;
  }

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setDisplayColor(newColor);
    throttledUpdateGlobalColor(newColor);
  };

  const handleReset = () => {
    setResetModalOpen(true);
  }

  const confirmReset = () => {
    resetProfileData();
    setResetModalOpen(false);
  }

  const handleExportHtml = () => {
      exportToHtml(profileData);
  }

  const handleExportImage = () => {
      const container = document.getElementById('profileCardContainer');
      if(container) {
        exportToImage(container, profileData);
      }
  }

  return (
    <>
      <header className="editor-toolbar top-toolbar">
        <div className="hamburger-menu">
            <button onClick={() => setSidebarOpen(true)} title="打开菜单">
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
                    />
                </div>
            )}
            <div className="toolbar-group">
              <button onClick={onAddCardClick} title="添加新卡片"><PlusSquare size={16} /><span className="toolbar-button-text">添加卡片</span></button>
            </div>
            <div className="toolbar-group">
              <button onClick={handleReset} title="恢复默认模板"><RotateCcw size={16} /><span className="toolbar-button-text">重置样式</span></button>
            </div>
            <div className="toolbar-group">
              <button onClick={handleExportHtml} title="导出 HTML"><FileCode2 size={16} /><span className="toolbar-button-text">导出 HTML</span></button>
              <button onClick={handleExportImage} title="导出图片"><Image size={16} /><span className="toolbar-button-text">导出图片</span></button>
            </div>
            <div className="toolbar-group toolbar-group-right">
              <a href="https://github.com/Chizukuo/ProfileCraft" target="_blank" rel="noopener noreferrer" className="toolbar-button-link" title="在 GitHub 上点个 Star">
                <Star size={16} /><span className="toolbar-button-text">Star on GitHub</span>
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
      
      <Modal isOpen={isResetModalOpen} onClose={() => setResetModalOpen(false)} title="确认重置">
        <p>您确定要重置所有内容到默认模板吗？此操作无法撤销。</p>
        <div className="modal-actions">
          <button className="modal-button-secondary" onClick={() => setResetModalOpen(false)}>取消</button>
          <button className="modal-button-primary" onClick={confirmReset}>确认重置</button>
        </div>
      </Modal>
    </>
  );
};

export default Toolbar;