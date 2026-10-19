import React from 'react';
import { X } from 'lucide-react';
import { ScaleElement, ScaleItem } from '../../types/data';
import EditableText from '../ui/EditableText';
import { AddButton, SettingRow, SwitchControl, ToolButton } from '../ui/EditorControls';
import BlockShell, { BlockProps } from './BlockShell';
import { useElementActions } from '../../hooks/useElementActions';
import { useTranslation } from '../../hooks/useTranslation';

/**
 * 倾向滑杆：左端文字 ——●—— 右端文字。
 * 轨道和圆点是普通 div（导出 / 预览里照常显示），编辑时上面盖一个透明的 range 输入框用来拖动。
 */
const ScaleBlock: React.FC<BlockProps<ScaleElement>> = ({ element, cardIndex, elementIndex, ...shell }) => {
    const { update, updateWithUndo } = useElementActions<ScaleElement>(cardIndex, elementIndex);
    const { t } = useTranslation();

    const setItem = (index: number, patch: Partial<ScaleItem>) =>
        update(el => ({ items: el.items.map((it, i) => (i === index ? { ...it, ...patch } : it)) }));

    return (
        <BlockShell
            title={t('blockTypes.scale')}
            {...shell}
            settings={() => (
                <SettingRow label={t('controls.scaleMiddle')}>
                    <SwitchControl
                        label={t('controls.scaleMiddle')}
                        checked={Boolean(element.showMiddle)}
                        onChange={(showMiddle) => update(el => ({
                            showMiddle,
                            // 第一次打开时给每一行一个默认的中间文字，方便直接改
                            items: showMiddle ? el.items.map(it => (it.middle ? it : { ...it, middle: t('templates.scaleMiddle') })) : el.items,
                        }))}
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
            <div className={`scale-list${element.showMiddle ? ' has-middle' : ''}`}>
                {element.items.map((item, i) => (
                    <div className="scale-row pc-item" key={i}>
                        <EditableText as="span" className="scale-label is-left" html={item.left} onUpdate={(html) => setItem(i, { left: html })} />
                        <span className="scale-track">
                            <span className="scale-fill" style={{ width: `${item.value}%` }} />
                            <span className="scale-dot" style={{ left: `${item.value}%` }} />
                            {element.showMiddle && (
                                <EditableText as="span" className="scale-label is-middle" html={item.middle ?? ''} onUpdate={(html) => setItem(i, { middle: html })} />
                            )}
                            <input
                                type="range"
                                className="scale-input editor-only"
                                min={0}
                                max={100}
                                step={5}
                                value={item.value}
                                aria-label={`${item.left} – ${item.right}`.replace(/<[^>]*>/g, '')}
                                onChange={(e) => setItem(i, { value: Number(e.target.value) })}
                            />
                        </span>
                        <EditableText as="span" className="scale-label is-right" html={item.right} onUpdate={(html) => setItem(i, { right: html })} />
                        <ToolButton
                            size="sm"
                            danger
                            className="pc-item-delete editor-only"
                            icon={<X size={10} />}
                            title={t('block.deleteItem')}
                            onClick={() => updateWithUndo(el => ({ items: el.items.filter((_, j) => j !== i) }), 'deleteItem')}
                        />
                    </div>
                ))}
                <div className="add-item-button-container">
                    <AddButton
                        label={t('block.addScale')}
                        onClick={() => update(el => ({ items: [...el.items, { left: t('templates.scaleLeft'), right: t('templates.scaleRight'), value: 50, ...(el.showMiddle ? { middle: t('templates.scaleMiddle') } : {}) }] }))}
                    />
                </div>
            </div>
        </BlockShell>
    );
};

export default ScaleBlock;
