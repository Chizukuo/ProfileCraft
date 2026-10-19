import React from 'react';
import { X } from 'lucide-react';
import { TagData, Styles } from '../../types/data';
import EditableText from './EditableText';
import { ToolButton } from './EditorControls';
import { useTranslation } from '../../hooks/useTranslation';

interface TagProps {
    tagData: TagData;
    defaultStyles: Styles;
    onUpdate: (newTagData: Partial<TagData>) => void;
    onDelete: () => void;
}

const Tag: React.FC<TagProps> = ({ tagData, defaultStyles, onUpdate, onDelete }) => {
    const { t } = useTranslation();
    const tagClass = tagData.type === 'oshi-meta-tag' ? 'oshi-meta-tag' : (tagData.type === 'oshi-tag' ? 'oshi-tag' : 'tag');

    return (
        <span className={`tag-wrapper pc-item${tagData.placeholder ? ' is-placeholder' : ''}`} title={tagData.placeholder ? t('block.sampleTagHint') : undefined}>
            <span className={tagClass}>
                <EditableText
                    as="span"
                    html={tagData.text}
                    styles={{ ...defaultStyles, ...tagData.styles }}
                    // 改过文字的示例标签就变成真标签
                    onUpdate={(html) => onUpdate({ text: html, placeholder: undefined })}
                />
            </span>
            <ToolButton size="sm" danger className="pc-item-delete editor-only" icon={<X size={10} />} title={t('controls.deleteTag')} onClick={onDelete} />
        </span>
    );
};

export default Tag;
