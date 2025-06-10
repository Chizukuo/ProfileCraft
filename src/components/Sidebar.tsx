import React, { useEffect, useState } from 'react';
import { FileCode2, Image, PlusSquare, RotateCcw, Star, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import themes from '../config/themes.json'; // 引入主题配置文件

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
  const { theme, setTheme } = useTheme();

  const handleButtonClick = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <div className={`sidebar-container ${isOpen ? 'is-open' : ''}`}>
      <div className="sidebar-overlay" onClick={onClose}></div>
      <aside className="sidebar-menu">
        <div className="sidebar-header">
          <h3>菜单</h3>
          <button onClick={onClose} className="sidebar-close-btn" title="关闭菜单"><X size={24} /></button>
        </div>
        <nav className="sidebar-nav">
          {isAccentColorEnabled && (
            <div className="sidebar-item">
              <label htmlFor="sidebarAccentColorPicker">主题色</label>
              <input
                type="color"
                id="sidebarAccentColorPicker"
                value={displayColor}
                onChange={onColorChange}
              />
            </div>
          )}
          <button onClick={() => handleButtonClick(onAddCardClick)} className="button-style sidebar-item-button">
            <PlusSquare size={20} />
            <span>添加卡片</span>
          </button>
          <button onClick={() => handleButtonClick(onResetClick)} className="button-style sidebar-item-button">
            <RotateCcw size={20} />
            <span>重置样式</span>
          </button>
          <button onClick={() => handleButtonClick(onExportHtmlClick)} className="button-style sidebar-item-button">
            <FileCode2 size={20} />
            <span>导出 HTML</span>
          </button>
          <button onClick={() => handleButtonClick(onExportImageClick)} className="button-style sidebar-item-button">
            <Image size={20} />
            <span>导出图片</span>
          </button>
          <a href="https://github.com/Chizukuo/ProfileCraft" target="_blank" rel="noopener noreferrer" className="button-style sidebar-item-button">
            <Star size={20} />
            <span>Star on GitHub</span>
          </a>
          <div className="sidebar-item">
            <label htmlFor="sidebarThemeSwitcher">主题风格</label>
            <select
              id="sidebarThemeSwitcher"
              value={theme}
              onChange={e => setTheme(e.target.value as any)}
              style={{ marginLeft: 4 }}
            >
              {Object.entries(themes).map(([key, value]) => (
                <option key={key} value={key}>{value.name}</option>
              ))}
            </select>
          </div>
        </nav>
      </aside>
    </div>
  );
};

export default Sidebar;
