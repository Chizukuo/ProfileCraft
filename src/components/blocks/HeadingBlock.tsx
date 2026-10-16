import React from 'react';
import { HeadingElement } from '../../types/data';
import EditableText from '../ui/EditableText';
import { useElementActions } from '../../hooks/useElementActions';
import { useTranslation } from '../../hooks/useTranslation';
import BlockShell, { BlockProps } from './BlockShell';
import { SegmentedControl, SettingRow } from '../ui/EditorControls';

const HeadingBlock: React.FC<BlockProps<HeadingElement>> = ({ element, cardIndex, elementIndex, ...shell }) => {
    const { update } = useElementActions<HeadingElement>(cardIndex, elementIndex);
    const { t } = useTranslation();

    return (
        <BlockShell
            title={t('blockTypes.heading')}
            {...shell}
            settings={() => (
                <SettingRow label={t('controls.size')}>
                    <SegmentedControl
                        value={element.size}
                        options={[{ value: 'sm', label: t('controls.sizeSm') }, { value: 'md', label: t('controls.sizeMd') }, { value: 'lg', label: t('controls.sizeLg') }]}
                        onChange={(size) => update({ size })}
                    />
                </SettingRow>
            )}
        >
            <EditableText
                as="h3"
                className={`block-heading is-${element.size}`}
                html={element.text}
                styles={element.styles}
                onUpdate={(html) => update({ text: html })}
            />
        </BlockShell>
    );
};

export default HeadingBlock;
