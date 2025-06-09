import React from 'react';
import { useProfile } from '../context/ProfileContext';
import { CARD_TEMPLATES } from '../utils/data';
import { CardTemplate } from '../types/data';
import Modal from './ui/Modal';

interface AddCardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddCardModal: React.FC<AddCardModalProps> = ({ isOpen, onClose }) => {
  const { updateProfileData } = useProfile();

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
    <Modal isOpen={isOpen} onClose={onClose} title="选择一个卡片模板">
      <div className="template-grid">
        {CARD_TEMPLATES.map((template) => (
          <div key={template.name} className="template-option" onClick={() => handleAddCard(template)}>
            <h3 className="template-name">{template.name}</h3>
            <p className="template-description">{template.description}</p>
          </div>
        ))}
      </div>
    </Modal>
  );
};

export default AddCardModal;