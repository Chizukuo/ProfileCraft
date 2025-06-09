import React, { useState } from 'react';
import { useProfile } from '../../context/ProfileContext';
import { GroupedTagSectionElement, TagData, Styles } from '../../types/data'; // 引入 Styles
import EditableText from '../ui/EditableText';
import ActionButton from '../ui/ActionButton';
import { X, Plus } from 'lucide-react';
import Tag from '../ui/Tag';

interface GroupedTagSectionBlockProps {
    element: GroupedTagSectionElement;
    cardIndex: number;
    elementIndex: number;
    onDelete: () => void;
}

const GroupedTagSectionBlock: React.FC<GroupedTagSectionBlockProps> = ({ element, cardIndex, elementIndex, onDelete }) => {
    const { updateProfileData } = useProfile();
    const [newArcadeTag, setNewArcadeTag] = useState('');
    const [newMobileTag, setNewMobileTag] = useState('');
    const [isHoveringDelete, setIsHoveringDelete] = useState(false);
    const [isContainerHovered, setIsContainerHovered] = useState(false);

    const handleUpdateElement = (field: keyof GroupedTagSectionElement, value: any) => {
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

    const addTag = (group: 'arcade' | 'mobile') => {
        const text = group === 'arcade' ? newArcadeTag : newMobileTag;
        if(text.trim()){
            const newTag: TagData = { text: text.trim() };
            handleUpdateElement(group, [...element[group], newTag]);
            group === 'arcade' ? setNewArcadeTag('') : setNewMobileTag('');
        }
    };
    
    const updateTag = (group: 'arcade' | 'mobile', tagIndex: number, newTagData: Partial<TagData>) => {
        const newTags = element[group].map((tag, i) => i === tagIndex ? { ...tag, ...newTagData } : tag);
        handleUpdateElement(group, newTags);
    };

    const deleteTag = (group: 'arcade' | 'mobile', tagIndex: number) => {
        handleUpdateElement(group, element[group].filter((_, i) => i !== tagIndex));
    };

    // --- FIX START: 增加处理样式更新的函数 ---
    const handleTagStyleUpdate = (group: 'arcade' | 'mobile', tagIndex: number, newStyles: Styles) => {
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
            
            <div className="music-game-category">
                 <EditableText as="span" className="music-game-label" html={element.arcadeLabel} styles={element.arcadeLabelStyles} onUpdate={(html) => handleUpdateElement('arcadeLabel', html)} onStyleUpdate={(styles) => handleUpdateElement('arcadeLabelStyles', styles)} />
                {element.arcade.map((tag, i) => 
                    <Tag key={i} tagData={tag} defaultStyles={element.tagStyles} 
                        onUpdate={(d) => updateTag('arcade', i, d)} 
                        onDelete={() => deleteTag('arcade', i)}
                        // --- FIX START: 传入样式更新函数 ---
                        onStyleUpdate={(styles) => handleTagStyleUpdate('arcade', i, styles)}
                        // --- FIX END ---
                    />
                )}
                 <div className="add-tag-button-container">
                     <input type="text" className="add-tag-input" value={newArcadeTag} onChange={(e) => setNewArcadeTag(e.target.value)} placeholder="新标签名" onKeyDown={(e) => e.key === 'Enter' && addTag('arcade')} />
                     <ActionButton icon={<Plus size={16} />} title="添加" onClick={() => addTag('arcade')} />
                 </div>
            </div>

            <div className="music-game-category">
                 <EditableText as="span" className="music-game-label" html={element.mobileLabel} styles={element.mobileLabelStyles} onUpdate={(html) => handleUpdateElement('mobileLabel', html)} onStyleUpdate={(styles) => handleUpdateElement('mobileLabelStyles', styles)} />
                {element.mobile.map((tag, i) => 
                    <Tag key={i} tagData={tag} defaultStyles={element.tagStyles} 
                        onUpdate={(d) => updateTag('mobile', i, d)} 
                        onDelete={() => deleteTag('mobile', i)}
                        // --- FIX START: 传入样式更新函数 ---
                        onStyleUpdate={(styles) => handleTagStyleUpdate('mobile', i, styles)}
                        // --- FIX END ---
                    />
                )}
                 <div className="add-tag-button-container">
                     <input type="text" className="add-tag-input" value={newMobileTag} onChange={(e) => setNewMobileTag(e.target.value)} placeholder="新标签名" onKeyDown={(e) => e.key === 'Enter' && addTag('mobile')} />
                     <ActionButton icon={<Plus size={16} />} title="添加" onClick={() => addTag('mobile')} />
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
};

export default GroupedTagSectionBlock;
