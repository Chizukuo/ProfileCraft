import React from 'react';
import { X } from 'lucide-react';
import { InfoListElement } from '../../types/data';
import EditableText from '../ui/EditableText';
import { useElementActions } from '../../hooks/useElementActions';
import { useTranslation } from '../../hooks/useTranslation';
import BlockShell, { BlockProps } from './BlockShell';
import { AddButton, ToolButton } from '../ui/EditorControls';

const InfoListBlock: React.FC<BlockProps<InfoListElement>> = ({ element, cardIndex, elementIndex, ...shell }) => {
    const { update, updateWithUndo } = useElementActions<InfoListElement>(cardIndex, elementIndex);
    const { t } = useTranslation();

    const setItem = (index: number, field: 'label' | 'value', value: string) =>
        update(el => ({ items: el.items.map((it, i) => (i === index ? { ...it, [field]: value } : it)) }));

    return (
        <BlockShell title={t('blockTypes.infoList')} className="info-list-block" {...shell}>
            <div className="profile-info-text">
                {element.items.map((item, index) => (
                    <div className="content-text mb-1 profile-item-row pc-item" key={index}>
                        <div className="profile-item-label">
                            <EditableText as="span" html={item.label} onUpdate={(val) => setItem(index, 'label', val)} />
                            <span className="profile-item-colon">:</span>
                        </div>
                        <div className="profile-item-value">
                            <EditableText as="span" html={item.value} styles={element.textStyles} onUpdate={(val) => setItem(index, 'value', val)} />
                        </div>
                        <ToolButton
                            size="sm"
                            danger
                            className="pc-item-delete editor-only"
                            icon={<X size={10} />}
                            title={t('block.deleteItem')}
                            onClick={() => updateWithUndo(el => ({ items: el.items.filter((_, i) => i !== index) }), 'deleteItem')}
                        />
                    </div>
                ))}
                <div className="add-item-button-container">
                    <AddButton
                        label={t('block.addItem')}
                        onClick={() => update(el => ({ items: [...el.items, { label: t('block.newItemLabel'), value: t('block.newItemValue') }] }))}
                    />
                </div>
            </div>
        </BlockShell>
    );
};

export default InfoListBlock;
