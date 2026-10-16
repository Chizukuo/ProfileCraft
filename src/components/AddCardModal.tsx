import React from 'react';
import { useProfileActions } from '../context/ProfileContext';
import { CARD_TEMPLATES } from '../utils/data';
import { CardTemplate } from '../types/data';
import { useTranslation } from '../hooks/useTranslation';
import { createCardId, fixCardLayouts } from '../utils/profileSchema';
import { DEFAULT_CARD_HEIGHT } from '../utils/gridLayout';
import Modal from './ui/Modal';
import { CardTemplateThumb } from './ui/TemplateThumb';

interface AddCardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddCardModal: React.FC<AddCardModalProps> = ({ isOpen, onClose }) => {
  const { updateProfileData } = useProfileActions();
  const { t } = useTranslation();

  const handleAddCard = (template: CardTemplate) => {
    const { width, ...data } = template.build(t);
    updateProfileData(prev => {
      const id = createCardId();
      // y 留空，由 fixCardLayouts 排到最下方
      const newCard = { ...data, id, layout: { i: id, x: 0, y: Number.NaN, w: width, h: DEFAULT_CARD_HEIGHT } };
      return { ...prev, cards: fixCardLayouts([...prev.cards, newCard]) };
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('modal.addCard')}>
      <p className="modal-intro-text">
        {t('modal.selectCardType')}
      </p>
      <div className="template-grid">
        {CARD_TEMPLATES.map((template) => {
          // 缩略图直接用模板会插入的数据来画，保证与实际效果一致
          const built = template.build(t);
          return (
          <button type="button" key={template.id} className="template-option" onClick={() => handleAddCard(template)}>
            <CardTemplateThumb width={built.width} card={built} />
            <h3 className="template-name">{t(`cardTypes.${template.id}`)}</h3>
            <p className="template-description">{t(`cardTypes.${template.id}Desc`)}</p>
          </button>
          );
        })}
      </div>
    </Modal>
  );
};

export default AddCardModal;
