import React from 'react';
import { DividerElement } from '../../types/data';
import { useElementActions } from '../../hooks/useElementActions';
import { useTranslation } from '../../hooks/useTranslation';
import BlockShell, { BlockProps } from './BlockShell';
import { SegmentedControl, SettingRow } from '../ui/EditorControls';

const DividerBlock: React.FC<BlockProps<DividerElement>> = ({ element, cardIndex, elementIndex, ...shell }) => {
    const { update } = useElementActions<DividerElement>(cardIndex, elementIndex);
    const { t } = useTranslation();

    return (
        <BlockShell
            title={t('blockTypes.divider')}
            className="divider-block"
            {...shell}
            settings={() => (
                <SettingRow label={t('controls.style')}>
                    <SegmentedControl
                        value={element.variant}
                        options={[
                            { value: 'line', label: t('controls.dividerLine') },
                            { value: 'dashed', label: t('controls.dividerDashed') },
                            { value: 'space', label: t('controls.dividerSpace') },
                        ]}
                        onChange={(variant) => update({ variant })}
                    />
                </SettingRow>
            )}
        >
            <hr className={`block-divider is-${element.variant}`} />
        </BlockShell>
    );
};

export default DividerBlock;
