import React from 'react';
import { ELEMENT_TEMPLATES } from '../utils/data';
import { CardElement, ElementTemplate } from '../types/data';
import { useTranslation } from '../hooks/useTranslation';
import Modal from './ui/Modal';

interface AddElementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddElement: (element: CardElement) => void;
}

const AddElementModal: React.FC<AddElementModalProps> = ({ isOpen, onClose, onAddElement }) => {
  const { t } = useTranslation();

  // 翻译键映射
  const blockTypeKeys: Record<string, string> = {
    '段落': 'blockTypes.paragraph',
    '标签区块': 'blockTypes.tagSection',
    '标签区块2': 'blockTypes.oshiSection',
    '分组标签区块': 'blockTypes.groupedTagSection'
  };

  const blockDescKeys: Record<string, string> = {
    '段落': 'blockTypes.paragraphDesc',
    '标签区块': 'blockTypes.tagSectionDesc',
    '标签区块2': 'blockTypes.oshiSectionDesc',
    '分组标签区块': 'blockTypes.groupedTagSectionDesc'
  };
  
  const handleAddElement = (template: ElementTemplate) => {
    onAddElement(template.data);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('modal.addElement')}>
      <p style={{ marginBottom: '16px', color: 'var(--text-color)', opacity: 0.8 }}>
        {t('modal.selectElementType')}
      </p>
      <div className="template-grid">
        {ELEMENT_TEMPLATES.map((template) => (
          <div key={template.name} className="template-option" onClick={() => handleAddElement(template)}>
            <h3 className="template-name">{t(blockTypeKeys[template.name] || template.name)}</h3>
            <p className="template-description">{t(blockDescKeys[template.name] || template.description)}</p>
          </div>
        ))}
      </div>
    </Modal>
  );
};

export default AddElementModal;