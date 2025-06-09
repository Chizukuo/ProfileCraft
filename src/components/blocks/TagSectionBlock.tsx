import React, { useState } from 'react';
import { useProfile } from '../../context/ProfileContext';
import { TagSectionElement, TagData, Styles } from '../../types/data'; // 引入 Styles
import EditableText from '../ui/EditableText';
import ActionButton from '../ui/ActionButton';
import { X, Plus } from 'lucide-react';
import Tag from '../ui/Tag';

interface TagSectionBlockProps {
    element: TagSectionElement;
    cardIndex: number;
    elementIndex: number;
    onDelete: () => void;
}

const TagSectionBlock: React.FC<TagSectionBlockProps> = ({ element, cardIndex, elementIndex, onDelete }) => {
    const { updateProfileData } = useProfile();
    const [newTagText, setNewTagText] = useState('');
    const [isHoveringDelete, setIsHoveringDelete] = useState(false);
    const [isContainerHovered, setIsContainerHovered] = useState(false);

    const handleUpdateElement = (field: keyof TagSectionElement, value: any) => {
        updateProfileData(prev => ({
            ...prev!,
            cards: prev!.cards.map((card, i) => {
                if (i === cardIndex) {
                    const newElements = card.elements.map((el, j) => (
                        j === elementIndex ? { ...el, [field]: value } : el
                    ));
                    return { ...card, elements: newElements };
                }
                return card;
            })
        }));
    };

    const addTag = () => {
        if(newTagText.trim()){
            const newTag: TagData = { text: newTagText.trim() };
            handleUpdateElement('tags', [...element.tags, newTag]);
            setNewTagText('');
        }
    };
    
    const updateTag = (tagIndex: number, newTagData: Partial<TagData>) => {
        const newTags = element.tags.map((tag, i) => (
            i === tagIndex ? { ...tag, ...newTagData } : tag
        ));
        handleUpdateElement('tags', newTags);
    };

    const deleteTag = (tagIndex: number) => {
        handleUpdateElement('tags', element.tags.filter((_, i) => i !== tagIndex));
    };
    
    // --- FIX START: 增加处理标签样式更新的函数 ---
    const handleTagStyleUpdate = (tagIndex: number, newStyles: Styles) => {
        const newTags = element.tags.map((tag, i) => (
            i === tagIndex ? { ...tag, styles: newStyles } : tag
        ));
        handleUpdateElement('tags', newTags);
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
            <div className="tag-group-container">
                {element.tags.map((tag, i) => (
                    <Tag 
                        key={i} 
                        tagData={tag}
                        defaultStyles={element.tagStyles} 
                        onUpdate={(newTagData) => updateTag(i, newTagData)}
                        onDelete={() => deleteTag(i)}
                        // --- FIX START: 传入样式更新函数 ---
                        onStyleUpdate={(styles) => handleTagStyleUpdate(i, styles)}
                        // --- FIX END ---
                    />
                ))}
                <div className="add-tag-button-container">
                     <input 
                        type="text" 
                        className="add-tag-input"
                        placeholder="新标签名"
                        value={newTagText}
                        onChange={(e) => setNewTagText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addTag()}
                    />
                    <ActionButton icon={<Plus size={16} />} title="添加标签" onClick={addTag} />
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

export default TagSectionBlock;
