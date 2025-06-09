import React from 'react';
import { ELEMENT_TEMPLATES } from '../utils/data';
import { CardElement, ElementTemplate } from '../types/data';
import Modal from './ui/Modal';

interface AddElementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddElement: (element: CardElement) => void;
}

const AddElementModal: React.FC<AddElementModalProps> = ({ isOpen, onClose, onAddElement }) => {
  
  const handleAddElement = (template: ElementTemplate) => {
    onAddElement(template.data);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="选择要添加的区块类型">
      <div className="template-grid">
        {ELEMENT_TEMPLATES.map((template) => (
          <div key={template.name} className="template-option" onClick={() => handleAddElement(template)}>
            <h3 className="template-name">{template.name}</h3>
            <p className="template-description">{template.description}</p>
          </div>
        ))}
      </div>
    </Modal>
  );
};

export default AddElementModal;