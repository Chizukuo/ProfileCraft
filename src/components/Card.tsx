import React, { useState, useCallback } from 'react';
import { useProfile } from '../context/ProfileContext';
import { CardData, CardElement } from '../types/data';
import { useTranslation } from '../hooks/useTranslation';
import EditableText from './ui/EditableText';
import ActionButton from './ui/ActionButton';
import ConfirmDialog from './ui/ConfirmDialog';
import { X, PlusCircle, GripVertical } from 'lucide-react';
import ProfileInfoBlock from './blocks/ProfileInfoBlock';
import ParagraphBlock from './blocks/ParagraphBlock';
import TagSectionBlock from './blocks/TagSectionBlock';
import OshiSectionBlock from './blocks/OshiSectionBlock';
import GroupedTagSectionBlock from './blocks/GroupedTagSectionBlock';
import AddElementModal from './AddElementModal';

interface CardProps {
  cardData: CardData;
  cardIndex: number;
}

const Card: React.FC<CardProps> = ({ cardData, cardIndex }) => {
  const { updateProfileData } = useProfile();
  const { t } = useTranslation();
  const [isAddElementModalOpen, setAddElementModalOpen] = useState(false);
  const [isHoveringDelete, setIsHoveringDelete] = useState(false);
  const [isCardHovered, setIsCardHovered] = useState(false);
  const [deleteCardConfirm, setDeleteCardConfirm] = useState(false);
  const [deleteElementIndex, setDeleteElementIndex] = useState<number | null>(null);

  const handleUpdateCard = useCallback((field: keyof CardData, value: any) => {
    updateProfileData(prev => ({
        ...prev!,
        cards: prev!.cards.map((card, i) => i === cardIndex ? { ...card, [field]: value } : card)
    }));
  }, [cardIndex, updateProfileData]);
  
  const deleteCard = useCallback(() => {
    updateProfileData(prev => ({
      ...prev!,
      cards: prev!.cards.filter((_, i) => i !== cardIndex)
    }));
  }, [cardIndex, updateProfileData]);

  const addElement = useCallback((element: CardElement) => {
    handleUpdateCard('elements', [...cardData.elements, element]);
  }, [cardData.elements, handleUpdateCard]);
  
  const confirmDeleteElement = useCallback(() => {
    if (deleteElementIndex !== null) {
      handleUpdateCard('elements', cardData.elements.filter((_, i) => i !== deleteElementIndex));
      setDeleteElementIndex(null);
    }
  }, [deleteElementIndex, cardData.elements, handleUpdateCard]);

  const renderElement = useCallback((element: CardElement, elementIndex: number) => {
    const key = `${cardData.id}-el-${elementIndex}`;
    const commonProps = {
        cardIndex,
        elementIndex,
        onDelete: () => setDeleteElementIndex(elementIndex)
    };
    
    switch (element.type) {
      case 'profileInfo':
        return <ProfileInfoBlock key={key} element={element} {...commonProps} />;
      case 'paragraph':
        return <ParagraphBlock key={key} element={element} {...commonProps} />;
      case 'tagSection':
        return <TagSectionBlock key={key} element={element} {...commonProps} />;
      case 'tagSectionTwo':
        return <OshiSectionBlock key={key} element={element} {...commonProps} />;
      case 'groupedTagSection':
        return <GroupedTagSectionBlock key={key} element={element} {...commonProps} />;
      default:
        return null;
    }
  }, [cardData.id, cardIndex]);

  return (
    <>
      <div 
        className={`ui-card ${cardData.layoutSpan} ${isHoveringDelete ? 'is-deleting' : ''}`} 
        data-card-id={cardData.id}
        onMouseEnter={() => setIsCardHovered(true)}
        onMouseLeave={() => setIsCardHovered(false)}
      >
        <div 
          className={`drag-handle ${isCardHovered ? 'is-visible' : ''}`}
          title={t('card.dragHandle')}
        >
          <GripVertical size={18} />
        </div>
        <ActionButton 
          icon={<X size={14} />} 
          title={t('card.deleteCard')}
          onClick={() => setDeleteCardConfirm(true)}
          variant="delete"
          className={isCardHovered ? 'is-visible' : ''}
          onMouseEnter={() => setIsHoveringDelete(true)}
          onMouseLeave={() => setIsHoveringDelete(false)}
        />
        <div className="section-title-container">
          <EditableText
            as="h2"
            className="section-title"
            html={cardData.title}
            styles={cardData.titleStyles}
            onUpdate={(html) => handleUpdateCard('title', html)}
            onStyleUpdate={(styles) => handleUpdateCard('titleStyles', styles)}
          />
        </div>
        <div className="card-content-wrapper">
          {cardData.elements.map(renderElement)}
        </div>
        <button onClick={() => setAddElementModalOpen(true)} className="action-button-text-with-icon" title={t('card.addNewBlock')}>
              <PlusCircle size={18} /> {t('card.addNewBlock')}
        </button>
      </div>
      
      <AddElementModal 
        isOpen={isAddElementModalOpen}
        onClose={() => setAddElementModalOpen(false)}
        onAddElement={addElement}
      />
      
      <ConfirmDialog
        isOpen={deleteCardConfirm}
        onClose={() => setDeleteCardConfirm(false)}
        onConfirm={deleteCard}
        title={t('modal.confirmDeleteCard')}
        message={t('modal.confirmDeleteCardMessage', { title: cardData.title.replace(/<[^>]*>/g, '') })}
        confirmText={t('modal.delete')}
        isDangerous={true}
      />
      
      <ConfirmDialog
        isOpen={deleteElementIndex !== null}
        onClose={() => setDeleteElementIndex(null)}
        onConfirm={confirmDeleteElement}
        title={t('modal.confirmDeleteBlock')}
        message={t('modal.confirmDeleteBlockMessage')}
        confirmText={t('modal.delete')}
        isDangerous={true}
      />
    </>
  );
};

export default React.memo(Card);