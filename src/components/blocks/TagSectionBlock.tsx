import React from 'react';
import { TagSectionElement } from '../../types/data';
import EditableText from '../ui/EditableText';
import Tag from '../ui/Tag';
import { InlineAdder } from '../ui/EditorControls';
import BlockShell, { BlockProps } from './BlockShell';
import { useElementActions } from '../../hooks/useElementActions';
import { useTranslation } from '../../hooks/useTranslation';
import TagToneSetting, { toneClass } from './TagToneSetting';

const TagSectionBlock: React.FC<BlockProps<TagSectionElement>> = ({ element, cardIndex, elementIndex, ...shell }) => {
    const { update, updateWithUndo } = useElementActions<TagSectionElement>(cardIndex, elementIndex);
    const { t } = useTranslation();

    return (
        <BlockShell
            title={t('blockTypes.tagSection')}
            {...shell}
            settings={() => <TagToneSetting value={element.tone} onChange={(tone) => update({ tone })} />}
        >
            <EditableText
                as="h3"
                className="card-content-subheading"
                html={element.subheading}
                styles={element.subheadingStyles}
                onUpdate={(html) => update({ subheading: html })}
            />
            <div className={`tag-group-container${toneClass(element.tone)}`}>
                {element.tags.map((tag, i) => (
                    <Tag
                        key={i}
                        tagData={tag}
                        defaultStyles={element.tagStyles}
                        onUpdate={(d) => update(el => ({ tags: el.tags.map((x, j) => (j === i ? { ...x, ...d } : x)) }))}
                        onDelete={() => updateWithUndo(el => ({ tags: el.tags.filter((_, j) => j !== i) }), 'deleteTag')}
                    />
                ))}
                <InlineAdder
                    label={t('controls.addTag')}
                    placeholder={t('block.newTagPlaceholder')}
                    // 添加第一个真标签时，同组的示例标签一起清掉
                    onAdd={(text) => update(el => ({ tags: [...el.tags.filter(x => !x.placeholder), { text }] }))}
                />
            </div>
        </BlockShell>
    );
};

export default TagSectionBlock;
