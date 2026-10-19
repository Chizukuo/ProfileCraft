import React from 'react';
import { X } from 'lucide-react';
import { ChecklistElement } from '../../types/data';
import EditableText from '../ui/EditableText';
import { InlineAdder, SegmentedControl, SettingRow, ToolButton } from '../ui/EditorControls';
import BlockShell, { BlockProps } from './BlockShell';
import { useElementActions } from '../../hooks/useElementActions';
import { useTranslation } from '../../hooks/useTranslation';
import { useEditorUI } from '../../context/EditorUIContext';

/** 勾选清单：用实心 / 空心方框区分状态，文字保持可读；预览 / 导出里只读 */
const ChecklistBlock: React.FC<BlockProps<ChecklistElement>> = ({ element, cardIndex, elementIndex, ...shell }) => {
    const { update, updateWithUndo } = useElementActions<ChecklistElement>(cardIndex, elementIndex);
    const { isPreview } = useEditorUI();
    const { t } = useTranslation();

    const toggle = (index: number) => update(el => ({ items: el.items.map((it, i) => (i === index ? { ...it, checked: !it.checked } : it)) }));

    return (
        <BlockShell
            title={t('blockTypes.checklist')}
            {...shell}
            settings={() => (
                <SettingRow label={t('controls.infoLayout')}>
                    <SegmentedControl
                        value={element.layout ?? 'grid'}
                        options={[{ value: 'grid', label: t('controls.checklistGrid') }, { value: 'compact', label: t('controls.checklistCompact') }]}
                        onChange={(layout) => update({ layout })}
                    />
                </SettingRow>
            )}
        >
            <EditableText
                as="h3"
                className="card-content-subheading"
                html={element.subheading}
                styles={element.subheadingStyles}
                onUpdate={(html) => update({ subheading: html })}
            />
            <div className={`checklist${element.layout === 'compact' ? ' is-compact' : ''}`}>
                {element.items.map((item, i) => (
                    <span className={`checklist-item pc-item${item.checked ? ' is-checked' : ''}`} key={i}>
                        {/* 用 span 而不是 button：导出截图时不会带上浏览器默认的按钮样式 */}
                        <span
                            className="checklist-box"
                            role="checkbox"
                            aria-checked={item.checked}
                            aria-label={t('controls.toggleChecked')}
                            tabIndex={isPreview ? -1 : 0}
                            onClick={isPreview ? undefined : () => toggle(i)}
                            onKeyDown={isPreview ? undefined : (e) => {
                                if (e.key === ' ' || e.key === 'Enter') {
                                    e.preventDefault();
                                    toggle(i);
                                }
                            }}
                        />
                        <EditableText
                            as="span"
                            className="checklist-text"
                            html={item.text}
                            onUpdate={(html) => update(el => ({ items: el.items.map((it, j) => (j === i ? { ...it, text: html } : it)) }))}
                        />
                        <ToolButton
                            size="sm"
                            danger
                            className="pc-item-delete editor-only"
                            icon={<X size={10} />}
                            title={t('block.deleteItem')}
                            onClick={() => updateWithUndo(el => ({ items: el.items.filter((_, j) => j !== i) }), 'deleteItem')}
                        />
                    </span>
                ))}
                <InlineAdder
                    label={t('block.addOption')}
                    placeholder={t('block.newOptionPlaceholder')}
                    onAdd={(text) => update(el => ({ items: [...el.items, { text, checked: true }] }))}
                />
            </div>
        </BlockShell>
    );
};

export default ChecklistBlock;
