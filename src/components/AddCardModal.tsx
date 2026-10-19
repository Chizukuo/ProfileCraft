import React from 'react';
import { useProfileActions } from '../context/ProfileContext';
import { CARD_TEMPLATES } from '../utils/data';
import { CardTemplate } from '../types/data';
import { useTranslation } from '../hooks/useTranslation';
import { createCardId, fixCardLayouts } from '../utils/profileSchema';
import { DEFAULT_CARD_HEIGHT, GRID_COLUMNS } from '../utils/gridLayout';
import type { CardData } from '../types/data';
import Modal from './ui/Modal';
import { CardTemplateThumb } from './ui/TemplateThumb';

interface AddCardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * 新卡片的位置：最后一行右边还放得下就接在后面（比如两列卡片旁边空着的一列），否则另起一行。
 * 以前总是另起一行，单列卡片加在两列卡片下面时会留出一大块空白。
 */
const placeNewCard = (cards: CardData[], width: number) => {
  const laidOut = cards.filter((c) => c.layout && Number.isFinite(c.layout.y));
  if (!laidOut.length) return { x: 0, y: 0 };
  const lastY = Math.max(...laidOut.map((c) => c.layout!.y));
  const rightEdge = Math.max(...laidOut.filter((c) => c.layout!.y === lastY).map((c) => c.layout!.x + c.layout!.w));
  return rightEdge + width <= GRID_COLUMNS ? { x: rightEdge, y: lastY } : { x: 0, y: Number.NaN };
};

/** 卡片加在页面下方时用户经常看不到：滚过去并闪一下 */
const revealCard = (id: string) => {
  window.setTimeout(() => {
    const el = document.querySelector<HTMLElement>(`[data-card-id="${id}"]`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.animate?.([{ boxShadow: '0 0 0 3px var(--theme-accent)' }, { boxShadow: '0 0 0 3px transparent' }], { duration: 1400, easing: 'ease-out' });
  }, 80);
};

const AddCardModal: React.FC<AddCardModalProps> = ({ isOpen, onClose }) => {
  const { updateProfileData } = useProfileActions();
  const { t } = useTranslation();

  const handleAddCard = (template: CardTemplate) => {
    const { width, ...data } = template.build(t);
    const id = createCardId();
    updateProfileData(prev => {
      // 放不进最后一行时 y 留空，由 fixCardLayouts 排到最下方
      const { x, y } = placeNewCard(prev.cards, width);
      const newCard = { ...data, id, layout: { i: id, x, y, w: width, h: DEFAULT_CARD_HEIGHT } };
      return { ...prev, cards: fixCardLayouts([...prev.cards, newCard]) };
    });
    onClose();
    revealCard(id);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('modal.addCard')}>
      <p className="modal-intro-text">
        {t('modal.selectCardType')}
      </p>
      <div className="template-grid">
        {CARD_TEMPLATES.map((template) => {
          // 缩略图直接用模板会插入的数据来画，保证与实际效果一致
          const built = template.build(t);
          return (
          <button type="button" key={template.id} className="template-option" onClick={() => handleAddCard(template)}>
            <CardTemplateThumb width={built.width} card={built} />
            <h3 className="template-name">{t(`cardTypes.${template.id}`)}</h3>
            <p className="template-description">{t(`cardTypes.${template.id}Desc`)}</p>
          </button>
          );
        })}
      </div>
    </Modal>
  );
};

export default AddCardModal;
