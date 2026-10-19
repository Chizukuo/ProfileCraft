import React from 'react';
import { OshiSectionElement } from '../../types/data';
import EditableText from '../ui/EditableText';
import Tag from '../ui/Tag';
import { InlineAdder } from '../ui/EditorControls';
import BlockShell, { BlockProps } from './BlockShell';
import { useElementActions } from '../../hooks/useElementActions';
import { useTranslation } from '../../hooks/useTranslation';
import TagToneSetting, { toneClass } from './TagToneSetting';

type Group = 'oshis' | 'meta';
const GROUP_STYLES = { oshis: { fontWeight: '400', fontSize: '14.4' }, meta: { fontWeight: '400', fontSize: '14' } };

const OshiSectionBlock: React.FC<BlockProps<OshiSectionElement>> = ({ element, cardIndex, elementIndex, ...shell }) => {
    const { update, updateWithUndo } = useElementActions<OshiSectionElement>(cardIndex, elementIndex);
    const { t } = useTranslation();

    const renderTags = (group: Group) => element[group].map((tag, i) => (
        <Tag
            key={`${group}-${i}`}
            tagData={tag}
            defaultStyles={GROUP_STYLES[group]}
            onUpdate={(d) => update(el => ({ [group]: el[group].map((x, j) => (j === i ? { ...x, ...d } : x)) }))}
            onDelete={() => updateWithUndo(el => ({ [group]: el[group].filter((_, j) => j !== i) }), 'deleteTag')}
        />
    ));

    return (
        <BlockShell
            title={t('blockTypes.oshiSection')}
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
            <div className={`oshi-tag-container${toneClass(element.tone)}`}>
                {renderTags('oshis')}
                {renderTags('meta')}
                <InlineAdder
                    label={t('controls.addTag')}
                    placeholder={t('block.newTagPlaceholder')}
                    onAdd={(text) => update(el => ({ oshis: [...el.oshis.filter(x => !x.placeholder), { text, type: 'oshi-tag' }] }))}
                />
            </div>
        </BlockShell>
    );
};

export default OshiSectionBlock;
