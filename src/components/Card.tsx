import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useProfile } from '../context/ProfileContext';
import { CardData, CardElement, ProfileData } from '../types/data';
import { useTranslation } from '../hooks/useTranslation';
import EditableText from './ui/EditableText';
import ActionButton from './ui/ActionButton';
import ConfirmDialog from './ui/ConfirmDialog';
import { X, PlusCircle, GripHorizontal, Columns } from 'lucide-react';
import ProfileInfoBlock from './blocks/ProfileInfoBlock';
import ParagraphBlock from './blocks/ParagraphBlock';
import TagSectionBlock from './blocks/TagSectionBlock';
import OshiSectionBlock from './blocks/OshiSectionBlock';
import GroupedTagSectionBlock from './blocks/GroupedTagSectionBlock';
import AddElementModal from './AddElementModal';
import { getWidthFromLayoutSpan } from '../hooks/useGridLayout';

// 策略模式：元素类型 → 渲染组件映射表，新增元素类型只需在此注册
const ELEMENT_RENDERERS: Record<CardElement['type'], React.ComponentType<any>> = {
  profileInfo: ProfileInfoBlock,
  paragraph: ParagraphBlock,
  tagSection: TagSectionBlock,
  tagSectionTwo: OshiSectionBlock,
  groupedTagSection: GroupedTagSectionBlock,
};

interface CardProps {
  cardData: CardData;
  cardIndex: number;
  onHeightChange?: (height: number) => void;
}

const Card: React.FC<CardProps> = ({ cardData, cardIndex, onHeightChange }) => {
  const { updateProfileData } = useProfile();
  const { t } = useTranslation();
  const [isAddElementModalOpen, setAddElementModalOpen] = useState(false);
  const [isHoveringDelete, setIsHoveringDelete] = useState(false);
  const [isCardHovered, setIsCardHovered] = useState(false);
  const [deleteCardConfirm, setDeleteCardConfirm] = useState(false);
  const [deleteElementIndex, setDeleteElementIndex] = useState<number | null>(null);
  const [isWidthMenuOpen, setIsWidthMenuOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const widthControlRef = useRef<HTMLDivElement>(null);

  const currentWidth = cardData.layout?.w ?? getWidthFromLayoutSpan(cardData.layoutSpan);

  useEffect(() => {
      if (!cardRef.current || !onHeightChange) return;
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
              const element = entry.target as HTMLElement;
              // Use scrollHeight to ensure we capture all content
              // Add padding (24px * 2) + border (2px) + minimal buffer (10px) = 58px
              onHeightChange(element.scrollHeight + 58);
          }
      });
      // Observe the content wrapper instead of the card itself
      const contentWrapper = cardRef.current.querySelector('.card-inner-content');
      if (contentWrapper) {
          resizeObserver.observe(contentWrapper);
      }
      return () => resizeObserver.disconnect();
  }, [onHeightChange]);

  const handleUpdateCard = useCallback((field: keyof CardData, value: any) => {
    updateProfileData((prev: ProfileData) => ({
      ...prev,
      cards: prev.cards.map((card, i) => i === cardIndex ? { ...card, [field]: value } : card)
    }));
  }, [cardIndex, updateProfileData]);

  const setWidth = (width: number) => {
      updateProfileData((prev: ProfileData) => {
          const newCards = prev.cards.map(c => {
              if (c.id === cardData.id) {
                  let newLayoutSpan = c.layoutSpan;
                  if (width === 1) newLayoutSpan = 'profile-card-span';
                  else if (width === 2) newLayoutSpan = 'about-me-card-span';
                  else if (width === 3) newLayoutSpan = 'full-width-card-span';

                  return {
                      ...c,
                      layoutSpan: newLayoutSpan,
                      layout: {
                          ...(c.layout || { i: c.id, x: 0, y: 0, h: 10 }),
                          w: width
                      }
                  };
              }
              return c;
          });
          return { ...prev, cards: newCards };
      });
      setIsWidthMenuOpen(false);
  };

  useEffect(() => {
    if (!isWidthMenuOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (!widthControlRef.current) return;
      const target = event.target as Node;
      if (!widthControlRef.current.contains(target)) {
        setIsWidthMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsWidthMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside, { passive: true });
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isWidthMenuOpen]);
  
  const deleteCard = useCallback(() => {
    updateProfileData((prev: ProfileData) => ({
      ...prev,
      cards: prev.cards.filter((_, i) => i !== cardIndex)
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
      onDelete: () => setDeleteElementIndex(elementIndex),
    };

    const Renderer = ELEMENT_RENDERERS[element.type];
    return Renderer ? <Renderer key={key} element={element} {...commonProps} /> : null;
  }, [cardData.id, cardIndex]);

  return (
    <>
      <div
        ref={cardRef}
        className={`ui-card ${cardData.layoutSpan} ${isHoveringDelete ? 'is-deleting' : ''}`}
        data-card-id={cardData.id}
        onMouseEnter={() => setIsCardHovered(true)}
        onMouseLeave={() => setIsCardHovered(false)}
      >
        <div className="card-inner-content">
          <div className={`card-top-controls ${isCardHovered || isWidthMenuOpen ? 'is-visible' : ''}`}>
            <div className={`width-control-container ${isWidthMenuOpen ? 'is-open' : ''}`} ref={widthControlRef}>
              <button
                className="width-control-btn"
                title={t('card.adjustWidth')}
                aria-haspopup="menu"
                aria-expanded={isWidthMenuOpen}
                onClick={() => setIsWidthMenuOpen(prev => !prev)}
              >
                <Columns size={16} />
              </button>
              <div className="width-dropdown">
                <button onClick={() => setWidth(1)} className={`width-dropdown-item ${currentWidth === 1 ? 'is-active' : ''}`}>{t('card.width1')}</button>
                <button onClick={() => setWidth(2)} className={`width-dropdown-item ${currentWidth === 2 ? 'is-active' : ''}`}>{t('card.width2')}</button>
                <button onClick={() => setWidth(3)} className={`width-dropdown-item ${currentWidth === 3 ? 'is-active' : ''}`}>{t('card.width3')}</button>
              </div>
            </div>

            <div className="drag-handle">
              <GripHorizontal size={20} />
            </div>

            <ActionButton
              icon={<X size={14} />}
              title={t('card.deleteCard')}
              onClick={() => setDeleteCardConfirm(true)}
              variant="delete"
              className={`card-delete-btn ${isCardHovered ? 'is-visible' : ''}`}
              onMouseEnter={() => setIsHoveringDelete(true)}
              onMouseLeave={() => setIsHoveringDelete(false)}
            />
          </div>

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