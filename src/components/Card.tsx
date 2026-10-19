import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useProfileActions } from '../context/ProfileContext';
import { useEditorUI } from '../context/EditorUIContext';
import { AppearanceSettings, CardData, CardElement, CardStyle, ProfileData } from '../types/data';
import { useTranslation } from '../hooks/useTranslation';
import EditableText from './ui/EditableText';
import { X, GripHorizontal, Settings, AlignLeft, AlignCenter, Palette } from 'lucide-react';
import HeadingBlock from './blocks/HeadingBlock';
import AvatarBlock from './blocks/AvatarBlock';
import InfoListBlock from './blocks/InfoListBlock';
import QrCodeBlock from './blocks/QrCodeBlock';
import DividerBlock from './blocks/DividerBlock';
import ParagraphBlock from './blocks/ParagraphBlock';
import TagSectionBlock from './blocks/TagSectionBlock';
import OshiSectionBlock from './blocks/OshiSectionBlock';
import GroupedTagSectionBlock from './blocks/GroupedTagSectionBlock';
import ImageGalleryBlock from './blocks/ImageGalleryBlock';
import ChecklistBlock from './blocks/ChecklistBlock';
import ScaleBlock from './blocks/ScaleBlock';
import type { BlockProps } from './blocks/BlockShell';
import AddElementModal from './AddElementModal';
import { getWidthFromLayoutSpan, getLayoutSpanFromWidth } from '../utils/gridLayout';
import { CARD_COLOR_PRESETS, getCardBackground, getCardTextOverride, isDarkCard } from '../utils/appearance';
import { AddButton, MoveControls, Popover, SegmentedControl, SettingRow, SwitchControl, ToolButton } from './ui/EditorControls';

// 策略模式：元素类型 → 渲染组件映射表，新增元素类型只需在此注册
const ELEMENT_RENDERERS: Record<CardElement['type'], React.ComponentType<BlockProps<any>>> = {
  heading: HeadingBlock,
  paragraph: ParagraphBlock,
  avatar: AvatarBlock,
  infoList: InfoListBlock,
  qrCode: QrCodeBlock,
  divider: DividerBlock,
  tagSection: TagSectionBlock,
  tagSectionTwo: OshiSectionBlock,
  groupedTagSection: GroupedTagSectionBlock,
  imageGallery: ImageGalleryBlock,
  checklist: ChecklistBlock,
  scale: ScaleBlock,
};

interface CardProps {
  cardData: CardData;
  cardIndex: number;
  appearance: AppearanceSettings;
  isFirst: boolean;
  isLast: boolean;
  /** 当前能否拖动（只有桌面三列布局、非预览时可以） */
  canDrag: boolean;
  onHeightChange: (cardId: string, height: number) => void;
  onMove: (cardId: string, direction: -1 | 1) => void;
}

const Card: React.FC<CardProps> = ({ cardData, cardIndex, appearance, isFirst, isLast, canDrag, onHeightChange, onMove }) => {
  const { updateProfileData, commitWithUndo } = useProfileActions();
  const { setCustomizeOpen } = useEditorUI();
  const { t } = useTranslation();
  const [isAddElementModalOpen, setAddElementModalOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const cardId = cardData.id;
  const padding = appearance.layout.padding;

  const currentWidth = cardData.layout?.w ?? getWidthFromLayoutSpan(cardData.layoutSpan);
  const style = cardData.style ?? {};

  useEffect(() => {
    const contentWrapper = cardRef.current?.querySelector('.card-inner-content');
    if (!contentWrapper) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // 内容高度 + 上下内边距 + 边框和少量余量
        onHeightChange(cardId, (entry.target as HTMLElement).scrollHeight + padding * 2 + 10);
      }
    });
    resizeObserver.observe(contentWrapper);
    return () => resizeObserver.disconnect();
  }, [onHeightChange, cardId, padding]);

  const updateCard = useCallback((patch: (card: CardData) => CardData) => {
    updateProfileData((prev: ProfileData) => ({
      ...prev,
      cards: prev.cards.map(card => card.id === cardId ? patch(card) : card),
    }));
  }, [cardId, updateProfileData]);

  const updateStyle = (patch: Partial<CardStyle>) => {
    updateCard(card => {
      const next: CardStyle = { ...card.style, ...patch };
      (Object.keys(next) as (keyof CardStyle)[]).forEach(key => {
        if (next[key] === undefined || next[key] === '' || next[key] === false) delete next[key];
      });
      return { ...card, style: Object.keys(next).length ? next : undefined };
    });
  };

  const setWidth = (width: number) => {
    updateCard(c => ({
      ...c,
      layoutSpan: getLayoutSpanFromWidth(width),
      layout: { ...(c.layout || { i: c.id, x: 0, y: 0, h: 10 }), w: width, x: Math.min(c.layout?.x ?? 0, 3 - width) },
    }));
  };

  const deleteCard = () => {
    commitWithUndo(prev => ({ ...prev, cards: prev.cards.filter(card => card.id !== cardId) }), 'deleteCard');
  };

  const addElement = useCallback((element: CardElement) => {
    updateCard(card => ({ ...card, elements: [...card.elements, element] }));
  }, [updateCard]);

  const deleteElement = (index: number) => {
    commitWithUndo(prev => ({
      ...prev,
      cards: prev.cards.map(card => card.id === cardId ? { ...card, elements: card.elements.filter((_, i) => i !== index) } : card),
    }), 'deleteBlock');
  };

  const moveElement = (index: number, direction: -1 | 1) => {
    updateCard(card => {
      const target = index + direction;
      if (target < 0 || target >= card.elements.length) return card;
      const elements = [...card.elements];
      [elements[index], elements[target]] = [elements[target], elements[index]];
      return { ...card, elements };
    });
  };

  const cardBackground = style.bgColor ? getCardBackground(appearance, style.bgColor) : '';
  const cardText = getCardTextOverride(appearance, style.bgColor);
  const cardInlineStyle: React.CSSProperties | undefined = cardBackground
    ? ({ backgroundColor: cardBackground, ...(cardText ? { '--pc-card-text': cardText } : {}) } as React.CSSProperties)
    : undefined;

  return (
    <>
      <div
        ref={cardRef}
        className={[
          'ui-card',
          cardData.layoutSpan,
          style.textAlign === 'center' ? 'is-centered' : '',
          style.hideTitle ? 'is-title-hidden' : '',
          isDarkCard(appearance, style.bgColor) ? 'is-dark-card' : (style.bgColor || appearance.card.bgColor) ? 'is-light-card' : '',
        ].filter(Boolean).join(' ')}
        style={cardInlineStyle}
        data-card-id={cardId}
        // 触屏没有悬停：点一下卡片让它获得焦点，从而显示控件（:focus-within）
        tabIndex={-1}
      >
        <div className="card-inner-content">
          <div className="card-top-controls editor-only">
            <span />
            {canDrag ? (
              <div className="drag-handle" title={t('controls.dragToMove')}>
                <GripHorizontal size={20} />
              </div>
            ) : <span />}
            <div className="pc-controls is-inline">
              <Popover icon={<Settings size={14} />} title={t('controls.cardSettings')} className="card-settings">
                {(close) => (
                  <>
                    <SettingRow label={t('controls.width')}>
                      <SegmentedControl
                        value={currentWidth}
                        options={[1, 2, 3].map(w => ({ value: w, label: t(`card.width${w}`) }))}
                        onChange={setWidth}
                      />
                    </SettingRow>
                    <SettingRow label={t('card.background')}>
                      <div className="pc-swatches">
                        <button type="button" className={`pc-swatch is-auto ${!style.bgColor ? 'is-active' : ''}`} title={t('card.followGlobal')} onClick={() => updateStyle({ bgColor: undefined })}>
                          A
                        </button>
                        {CARD_COLOR_PRESETS.map(color => (
                          <button
                            key={color}
                            type="button"
                            className={`pc-swatch ${style.bgColor?.toUpperCase() === color ? 'is-active' : ''}`}
                            style={{ backgroundColor: color }}
                            title={color}
                            aria-label={color}
                            onClick={() => updateStyle({ bgColor: color })}
                          />
                        ))}
                        <label className="pc-swatch is-custom" title={t('card.customColor')}>
                          <input type="color" value={style.bgColor || '#FFFFFF'} onChange={(e) => updateStyle({ bgColor: e.target.value })} />
                        </label>
                      </div>
                    </SettingRow>
                    <SettingRow label={t('card.textAlign')}>
                      <SegmentedControl
                        value={style.textAlign === 'center' ? 'center' : 'left'}
                        options={[
                          { value: 'left', label: <><AlignLeft size={13} /> {t('card.alignLeft')}</> },
                          { value: 'center', label: <><AlignCenter size={13} /> {t('card.alignCenter')}</> },
                        ]}
                        onChange={(align) => updateStyle({ textAlign: align === 'center' ? 'center' : undefined })}
                      />
                    </SettingRow>
                    <SettingRow label={t('card.showTitle')}>
                      <SwitchControl label={t('card.showTitle')} checked={!style.hideTitle} onChange={(v) => updateStyle({ hideTitle: !v })} />
                    </SettingRow>
                    <MoveControls onMove={(dir) => onMove(cardId, dir)} isFirst={isFirst} isLast={isLast} />
                    <button
                      type="button"
                      className="pc-popover-link"
                      onClick={() => {
                        close();
                        setCustomizeOpen(true);
                      }}
                    >
                      <Palette size={13} /> {t('controls.globalAppearance')}
                    </button>
                  </>
                )}
              </Popover>
              <ToolButton danger icon={<X size={14} />} title={t('controls.deleteCard')} onClick={deleteCard} />
            </div>
          </div>

          {!style.hideTitle && (
            <div className="section-title-container">
              <EditableText
                as="h2"
                className="section-title"
                html={cardData.title}
                styles={cardData.titleStyles}
                onUpdate={(html) => updateCard(card => ({ ...card, title: html }))}
              />
            </div>
          )}

          <div className="card-content-wrapper">
            {cardData.elements.map((element, elementIndex) => {
              const Renderer = ELEMENT_RENDERERS[element.type];
              if (!Renderer) return null;
              return (
                <Renderer
                  key={`${cardId}-el-${elementIndex}`}
                  element={element}
                  cardIndex={cardIndex}
                  elementIndex={elementIndex}
                  isFirst={elementIndex === 0}
                  isLast={elementIndex === cardData.elements.length - 1}
                  onDelete={() => deleteElement(elementIndex)}
                  onMove={(dir) => moveElement(elementIndex, dir)}
                />
              );
            })}
          </div>

          <AddButton variant="block" label={t('controls.addBlock')} onClick={() => setAddElementModalOpen(true)} />
        </div>
      </div>

      <AddElementModal
        isOpen={isAddElementModalOpen}
        onClose={() => setAddElementModalOpen(false)}
        onAddElement={addElement}
      />
    </>
  );
};

export default React.memo(Card);
