import React from 'react';
import { useProfile } from '../context/ProfileContext';
import { CARD_TEMPLATES } from '../utils/data';
import { CardTemplate } from '../types/data';
import { useTranslation } from '../hooks/useTranslation';
import Modal from './ui/Modal';

interface AddCardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddCardModal: React.FC<AddCardModalProps> = ({ isOpen, onClose }) => {
  const { updateProfileData } = useProfile();
  const { t } = useTranslation();

  // 翻译键映射
  const cardTypeKeys: Record<string, string> = {
    '常规卡片': 'cardTypes.profileCard',
    '双栏卡片': 'cardTypes.aboutMeCard',
    '三栏卡片': 'cardTypes.oshiCard'
  };

  const cardDescKeys: Record<string, string> = {
    '常规卡片': 'cardTypes.profileCardDesc',
    '双栏卡片': 'cardTypes.aboutMeCardDesc',
    '三栏卡片': 'cardTypes.oshiCardDesc'
  };

  const handleAddCard = (template: CardTemplate) => {
    updateProfileData(prev => {
      const newCard = {
        ...template.data,
        id: `card_${Date.now()}`,
      };
      return { ...prev!, cards: [...prev!.cards, newCard] };
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('modal.addCard')}>
      <p style={{ marginBottom: '16px', color: 'var(--text-color)', opacity: 0.8 }}>
        {t('modal.selectCardType')}
      </p>
      <div className="template-grid">
        {CARD_TEMPLATES.map((template) => (
          <div key={template.name} className="template-option" onClick={() => handleAddCard(template)}>
            <h3 className="template-name">{t(cardTypeKeys[template.name] || template.name)}</h3>
            <p className="template-description">{t(cardDescKeys[template.name] || template.description)}</p>
          </div>
        ))}
      </div>
    </Modal>
  );
};

export default AddCardModal;