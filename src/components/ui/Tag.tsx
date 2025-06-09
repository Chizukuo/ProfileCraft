import React, { useState } from 'react';
import { TagData, Styles } from '../../types/data';
import ActionButton from './ActionButton';
import { X } from 'lucide-react';
import EditableText from './EditableText';

interface TagProps {
    tagData: TagData;
    defaultStyles: Styles;
    onUpdate: (newTagData: Partial<TagData>) => void;
    onDelete: () => void;
    // --- FIX START: 增加 onStyleUpdate prop ---
    // 这个 prop 是让子组件 EditableText 能够将样式更改传回父组件的关键
    onStyleUpdate: (styles: Styles) => void;
    // --- FIX END ---
}

const Tag: React.FC<TagProps> = ({ tagData, defaultStyles, onUpdate, onDelete, onStyleUpdate }) => {
    const [isHoveringDelete, setIsHoveringDelete] = useState(false);
    const [isWrapperHovered, setIsWrapperHovered] = useState(false);
    
    const handleTextUpdate = (html: string) => {
        onUpdate({ text: html });
    };

    // --- FIX START: 增加样式更新处理函数 ---
    const handleStyleUpdate = (newStyles: Styles) => {
        // 调用从父组件传入的 onStyleUpdate 函数
        onStyleUpdate(newStyles);
    };
    // --- FIX END ---

    const effectiveStyles = { ...defaultStyles, ...tagData.styles };
    const tagClass = tagData.type === 'oshi-meta-tag' ? 'oshi-meta-tag' : (tagData.type === 'oshi-tag' ? 'oshi-tag' : 'tag');

    return (
        <div 
            className={`tag-wrapper ${isHoveringDelete ? 'is-deleting' : ''}`}
            onMouseEnter={() => setIsWrapperHovered(true)}
            onMouseLeave={() => setIsWrapperHovered(false)}
        >
            {/* 这里的 'span' 仅仅作为 EditableText 的容器，样式由 EditableText 内部处理 */}
            <span className={tagClass}>
                {/* --- FIX START: 为 EditableText 补充必需的 props --- */}
                <EditableText 
                  as="span"
                  html={tagData.text}
                  styles={effectiveStyles} // 传递当前样式以便工具栏显示
                  onUpdate={handleTextUpdate}
                  onStyleUpdate={handleStyleUpdate} // 传递样式更新的处理函数
                  isClearable={false}
                />
                {/* --- FIX END --- */}
            </span>
            <ActionButton 
              icon={<X size={12} />} 
              title="删除标签" 
              onClick={onDelete} 
              variant="delete" 
              className={isWrapperHovered ? 'is-visible' : ''}
              onMouseEnter={() => setIsHoveringDelete(true)}
              onMouseLeave={() => setIsHoveringDelete(false)}
            />
        </div>
    );
};

export default Tag;
