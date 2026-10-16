import React from 'react';
import { ParagraphElement } from '../../types/data';
import EditableText from '../ui/EditableText';
import BlockShell, { BlockProps } from './BlockShell';
import { useElementActions } from '../../hooks/useElementActions';
import { useTranslation } from '../../hooks/useTranslation';

const ParagraphBlock: React.FC<BlockProps<ParagraphElement>> = ({ element, cardIndex, elementIndex, ...shell }) => {
    const { update } = useElementActions<ParagraphElement>(cardIndex, elementIndex);
    const { t } = useTranslation();

    return (
        <BlockShell title={t('blockTypes.paragraph')} {...shell}>
            <EditableText
                as="p"
                className="content-text"
                html={element.text}
                styles={element.styles}
                onUpdate={(html) => update({ text: html })}
            />
        </BlockShell>
    );
};

export default ParagraphBlock;
