import React from 'react';
import { FileCode2, Image, PlusSquare, RotateCcw, Star, X } from 'lucide-react';

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

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  onAddCardClick,
  onResetClick,
  onExportHtmlClick,
  onExportImageClick,
  displayColor,
  onColorChange,
  isAccentColorEnabled
}) => {
  // This is the line that was removed. We want the component to always be in the DOM
  // so that the CSS exit animations can play.
  // if (!isOpen) return null; 

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
          <button onClick={() => handleButtonClick(onAddCardClick)} className="sidebar-item-button">
            <PlusSquare size={20} />
            <span>添加卡片</span>
          </button>
          <button onClick={() => handleButtonClick(onResetClick)} className="sidebar-item-button">
            <RotateCcw size={20} />
            <span>重置样式</span>
          </button>
          <button onClick={() => handleButtonClick(onExportHtmlClick)} className="sidebar-item-button">
            <FileCode2 size={20} />
            <span>导出 HTML</span>
          </button>
          <button onClick={() => handleButtonClick(onExportImageClick)} className="sidebar-item-button">
            <Image size={20} />
            <span>导出图片</span>
          </button>
          <a href="https://github.com/Chizukuo/ProfileCraft" target="_blank" rel="noopener noreferrer" className="sidebar-item-button">
            <Star size={20} />
            <span>Star on GitHub</span>
          </a>
        </nav>
      </aside>
    </div>
  );
};

export default Sidebar;
