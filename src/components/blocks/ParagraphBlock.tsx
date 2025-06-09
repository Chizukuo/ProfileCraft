import React, { useState } from 'react';
import { useProfile } from '../../context/ProfileContext';
import { ParagraphElement } from '../../types/data';
import EditableText from '../ui/EditableText';
import ActionButton from '../ui/ActionButton';
import { X } from 'lucide-react';


interface ParagraphBlockProps {
    element: ParagraphElement;
    cardIndex: number;
    elementIndex: number;
    onDelete: () => void;
}

const ParagraphBlock: React.FC<ParagraphBlockProps> = ({ element, cardIndex, elementIndex, onDelete }) => {
    const { updateProfileData } = useProfile();
    const [isHoveringDelete, setIsHoveringDelete] = useState(false);
    const [isContainerHovered, setIsContainerHovered] = useState(false);
    
    const handleUpdate = (field: keyof ParagraphElement, value: any) => {
        updateProfileData(prev => ({
            ...prev,
            cards: prev.cards.map((card, i) => {
                if (i === cardIndex) {
                    const newElements = card.elements.map((el, j) => {
                        if (j === elementIndex) {
                            return { ...el, [field]: value };
                        }
                        return el;
                    });
                    return { ...card, elements: newElements };
                }
                return card;
            })
        }));
    };
    
    return (
        <div 
            className={`element-container ${isHoveringDelete ? 'is-deleting' : ''}`}
            onMouseEnter={() => setIsContainerHovered(true)}
            onMouseLeave={() => setIsContainerHovered(false)}
        >
             <EditableText
                as="p"
                className="content-text"
                html={element.text}
                styles={element.styles}
                onUpdate={(html) => handleUpdate('text', html)}
                onStyleUpdate={(styles) => handleUpdate('styles', styles)}
            />
            <ActionButton 
              icon={<X size={12} />} 
              title="删除此区块" 
              onClick={onDelete} 
              variant="delete" 
              className={isContainerHovered ? 'is-visible' : ''}
              onMouseEnter={() => setIsHoveringDelete(true)}
              onMouseLeave={() => setIsHoveringDelete(false)}
            />
        </div>
    );
}

export default ParagraphBlock;