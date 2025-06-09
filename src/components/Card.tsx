import React, { useState } from 'react';
import { useProfile } from '../context/ProfileContext';
import { CardData, CardElement } from '../types/data';
import EditableText from './ui/EditableText';
import ActionButton from './ui/ActionButton';
import { X, PlusCircle } from 'lucide-react';
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
  const [isAddElementModalOpen, setAddElementModalOpen] = useState(false);
  const [isHoveringDelete, setIsHoveringDelete] = useState(false);
  const [isCardHovered, setIsCardHovered] = useState(false);

  const handleUpdateCard = (field: keyof CardData, value: any) => {
    updateProfileData(prev => ({
        ...prev!,
        cards: prev!.cards.map((card, i) => i === cardIndex ? { ...card, [field]: value } : card)
    }));
  };
  
  const deleteCard = () => {
    // TODO: Replace with a custom modal confirmation
    if (window.confirm(`确定要删除卡片 "${cardData.title}" 吗？`)) {
      updateProfileData(prev => ({
        ...prev!,
        cards: prev!.cards.filter((_, i) => i !== cardIndex)
      }));
    }
  };

  const addElement = (element: CardElement) => {
    handleUpdateCard('elements', [...cardData.elements, element]);
  };
  
  const deleteElement = (elementIndex: number) => {
    // TODO: Replace with a custom modal confirmation
     if (window.confirm(`确定要删除此区块吗？`)) {
        handleUpdateCard('elements', cardData.elements.filter((_, i) => i !== elementIndex));
    }
  };

  // --- FIX START: 修改 renderElement 函数 ---
  // 这里是修复 `key` 属性警告的关键部分。
  // 我们将 `key` 属性从 `commonProps` 中分离出来，并直接传递给组件。
  const renderElement = (element: CardElement, elementIndex: number) => {
    // 1. 为每个列表项创建一个唯一的 key。
    const key = `${cardData.id}-el-${elementIndex}`;

    // 2. 创建一个不包含 `key` 的 props 对象。
    const commonProps = {
        cardIndex,
        elementIndex,
        onDelete: () => deleteElement(elementIndex)
    };
    
    // 3. 在渲染组件时，直接传递 `key` 属性，然后传递 `element` 数据，最后展开 `commonProps`。
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
  };
  // --- FIX END ---

  return (
    <>
      <div 
        className={`ui-card ${cardData.layoutSpan} ${isHoveringDelete ? 'is-deleting' : ''}`} 
        data-card-id={cardData.id}
        onMouseEnter={() => setIsCardHovered(true)}
        onMouseLeave={() => setIsCardHovered(false)}
      >
        <ActionButton 
          icon={<X size={14} />} 
          title="删除此卡片" 
          onClick={deleteCard} 
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
        <button onClick={() => setAddElementModalOpen(true)} className="action-button-text-with-icon">
              <PlusCircle size={18} /> 添加新区块到此卡片
        </button>
      </div>
      <AddElementModal 
        isOpen={isAddElementModalOpen}
        onClose={() => setAddElementModalOpen(false)}
        onAddElement={addElement}
      />
    </>
  );
};

export default Card;