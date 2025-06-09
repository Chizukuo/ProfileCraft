import React, { useState } from 'react';
import { useProfile } from '../../context/ProfileContext';
import { OshiSectionElement, TagData, Styles } from '../../types/data'; // 引入 Styles
import EditableText from '../ui/EditableText';
import ActionButton from '../ui/ActionButton';
import { X, Plus } from 'lucide-react';
import Tag from '../ui/Tag';

interface OshiSectionBlockProps {
    element: OshiSectionElement;
    cardIndex: number;
    elementIndex: number;
    onDelete: () => void;
}

const OshiSectionBlock: React.FC<OshiSectionBlockProps> = ({ element, cardIndex, elementIndex, onDelete }) => {
    const { updateProfileData } = useProfile();
    const [newOshiText, setNewOshiText] = useState('');
    const [isHoveringDelete, setIsHoveringDelete] = useState(false);
    const [isContainerHovered, setIsContainerHovered] = useState(false);

    const handleUpdateElement = (field: keyof OshiSectionElement, value: any) => {
        updateProfileData(prev => ({
            ...prev,
            cards: prev.cards.map((card, i) => {
                if (i === cardIndex) {
                    return { ...card, elements: card.elements.map((el, j) => j === elementIndex ? { ...el, [field]: value } : el) };
                }
                return card;
            })
        }));
    };

    const addOshi = () => {
        if(newOshiText.trim()){
            const newOshi: TagData = { text: newOshiText.trim(), type: 'oshi-tag' };
            handleUpdateElement('oshis', [...element.oshis, newOshi]);
            setNewOshiText('');
        }
    };
    
    const updateTag = (group: 'oshis' | 'meta', tagIndex: number, newTagData: Partial<TagData>) => {
        const newTags = element[group].map((tag, i) => i === tagIndex ? { ...tag, ...newTagData } : tag);
        handleUpdateElement(group, newTags);
    };
    
    const deleteTag = (group: 'oshis' | 'meta', tagIndex: number) => {
        handleUpdateElement(group, element[group].filter((_, i) => i !== tagIndex));
    };

    // --- FIX START: 增加处理样式更新的函数 ---
    const handleTagStyleUpdate = (group: 'oshis' | 'meta', tagIndex: number, newStyles: Styles) => {
        const newTags = element[group].map((tag, i) => (
            i === tagIndex ? { ...tag, styles: newStyles } : tag
        ));
        handleUpdateElement(group, newTags);
    };
    // --- FIX END ---
    
    return (
        <div 
            className={`element-container ${isHoveringDelete ? 'is-deleting' : ''}`}
            onMouseEnter={() => setIsContainerHovered(true)}
            onMouseLeave={() => setIsContainerHovered(false)}
        >
            <EditableText
                as="h3"
                className="card-content-subheading"
                html={element.subheading}
                styles={element.subheadingStyles}
                onUpdate={(html) => handleUpdateElement('subheading', html)}
                onStyleUpdate={(styles) => handleUpdateElement('subheadingStyles', styles)}
            />
            <div className="oshi-tag-container">
                 {element.oshis.map((tag, i) => (
                    <Tag 
                        key={`oshi-${i}`} 
                        tagData={tag}
                        defaultStyles={{ fontWeight: '400', fontSize: '14.4' }}
                        onUpdate={(d) => updateTag('oshis', i, d)}
                        onDelete={() => deleteTag('oshis', i)}
                        // --- FIX START: 传入样式更新函数 ---
                        onStyleUpdate={(styles) => handleTagStyleUpdate('oshis', i, styles)}
                        // --- FIX END ---
                    />
                ))}
                {element.meta.map((tag, i) => (
                     <Tag 
                        key={`meta-${i}`} 
                        tagData={tag}
                        defaultStyles={{ fontWeight: '400', fontSize: '14' }} 
                        onUpdate={(d) => updateTag('meta', i, d)}
                        onDelete={() => deleteTag('meta', i)}
                        // --- FIX START: 传入样式更新函数 ---
                        onStyleUpdate={(styles) => handleTagStyleUpdate('meta', i, styles)}
                        // --- FIX END ---
                    />
                ))}
                 <div className="add-tag-button-container">
                     <input 
                        type="text" 
                        className="add-tag-input"
                        placeholder="新标签名"
                        value={newOshiText}
                        onChange={(e) => setNewOshiText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addOshi()}
                    />
                    <ActionButton icon={<Plus size={16} />} title="添加标签" onClick={addOshi} />
                </div>
            </div>
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

export default OshiSectionBlock;
