import React, { useRef, useEffect } from 'react';
import { FileCode2, Image, Download, Upload, Share2 } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

interface ExportMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onExportHtml: () => void;
  onExportImage: () => void;
  onExportConfig: () => void;
  onImportConfig: () => void;
}

const ExportMenu: React.FC<ExportMenuProps> = ({ 
  isOpen, 
  onClose, 
  onExportHtml, 
  onExportImage, 
  onExportConfig, 
  onImportConfig 
}) => {
  const { t } = useTranslation();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="popover-menu" ref={menuRef}>
      <div className="popover-item" onClick={onExportHtml}>
        <FileCode2 size={16} />
        <span>{t('toolbar.exportHtml')}</span>
      </div>
      <div className="popover-item" onClick={onExportImage}>
        <Image size={16} />
        <span>{t('toolbar.exportImage')}</span>
      </div>
      <div className="popover-item" onClick={onExportConfig}>
        <Download size={16} />
        <span>{t('toolbar.exportConfig')}</span>
      </div>
      <div className="popover-item" onClick={onImportConfig}>
        <Upload size={16} />
        <span>{t('toolbar.importConfig')}</span>
      </div>
    </div>
  );
};

export default ExportMenu;
