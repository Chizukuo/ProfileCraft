import React from 'react';
import { ELEMENT_TEMPLATES } from '../utils/data';
import { CardElement, ElementTemplate, ElementTemplateGroup } from '../types/data';
import { useTranslation } from '../hooks/useTranslation';
import Modal from './ui/Modal';
import { BlockTemplateThumb } from './ui/TemplateThumb';

interface AddElementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddElement: (element: CardElement) => void;
}

const GROUP_ORDER: ElementTemplateGroup[] = ['text', 'profile', 'tags', 'media'];

const AddElementModal: React.FC<AddElementModalProps> = ({ isOpen, onClose, onAddElement }) => {
  const { t } = useTranslation();

  const handleAddElement = (template: ElementTemplate) => {
    onAddElement(template.build(t));
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('modal.addElement')}>
      <p className="modal-intro-text">
        {t('modal.selectElementType')}
      </p>
      {GROUP_ORDER.map(group => (
        <section key={group} className="template-group">
          <h3 className="template-group-title">{t(`blockGroups.${group}`)}</h3>
          <div className="template-grid">
            {ELEMENT_TEMPLATES.filter(tpl => tpl.group === group).map((template) => (
              <button type="button" key={template.id} className="template-option" onClick={() => handleAddElement(template)}>
                {/* 缩略图直接画模板会插入的元素，保证与实际效果一致 */}
                <BlockTemplateThumb element={template.build(t)} />
                <h3 className="template-name">{t(`blockTypes.${template.id}`)}</h3>
                <p className="template-description">{t(`blockTypes.${template.id}Desc`)}</p>
              </button>
            ))}
          </div>
        </section>
      ))}
    </Modal>
  );
};

export default AddElementModal;
