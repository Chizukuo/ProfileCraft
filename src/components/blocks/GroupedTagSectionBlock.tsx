import React from 'react';
import { GroupedTagSectionElement } from '../../types/data';
import EditableText from '../ui/EditableText';
import Tag from '../ui/Tag';
import { InlineAdder } from '../ui/EditorControls';
import BlockShell, { BlockProps } from './BlockShell';
import { useElementActions } from '../../hooks/useElementActions';
import { useTranslation } from '../../hooks/useTranslation';

type Group = 'arcade' | 'mobile';
const LABEL_FIELD = { arcade: 'arcadeLabel', mobile: 'mobileLabel' } as const;
const LABEL_STYLE_FIELD = { arcade: 'arcadeLabelStyles', mobile: 'mobileLabelStyles' } as const;

const GroupedTagSectionBlock: React.FC<BlockProps<GroupedTagSectionElement>> = ({ element, cardIndex, elementIndex, ...shell }) => {
    const { update, updateWithUndo } = useElementActions<GroupedTagSectionElement>(cardIndex, elementIndex);
    const { t } = useTranslation();

    const renderGroup = (group: Group) => (
        <div className="music-game-category">
            <EditableText
                as="span"
                className="music-game-label"
                html={element[LABEL_FIELD[group]]}
                styles={element[LABEL_STYLE_FIELD[group]]}
                onUpdate={(html) => update({ [LABEL_FIELD[group]]: html })}
            />
            {element[group].map((tag, i) => (
                <Tag
                    key={i}
                    tagData={tag}
                    defaultStyles={element.tagStyles}
                    onUpdate={(d) => update(el => ({ [group]: el[group].map((x, j) => (j === i ? { ...x, ...d } : x)) }))}
                    onDelete={() => updateWithUndo(el => ({ [group]: el[group].filter((_, j) => j !== i) }), 'deleteTag')}
                />
            ))}
            <InlineAdder
                label={t('controls.addTag')}
                placeholder={t('block.newTagPlaceholder')}
                onAdd={(text) => update(el => ({ [group]: [...el[group].filter(x => !x.placeholder), { text }] }))}
            />
        </div>
    );

    return (
        <BlockShell title={t('blockTypes.groupedTagSection')} {...shell}>
            <EditableText
                as="h3"
                className="card-content-subheading"
                html={element.subheading}
                styles={element.subheadingStyles}
                onUpdate={(html) => update({ subheading: html })}
            />
            {renderGroup('arcade')}
            {renderGroup('mobile')}
        </BlockShell>
    );
};

export default GroupedTagSectionBlock;
