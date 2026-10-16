import { useCallback } from 'react';
import { useProfileActions } from '../context/ProfileContext';
import type { CardElement, ProfileData } from '../types/data';
import type { UndoLabel } from './useProfileData';

type Patch<T> = Partial<T> | ((el: T) => Partial<T>);

/** 区块组件更新自身数据的统一入口（按 cardIndex / elementIndex 定位） */
export const useElementActions = <T extends CardElement>(cardIndex: number, elementIndex: number) => {
  const { updateProfileData, commitWithUndo } = useProfileActions();

  const apply = useCallback((patch: Patch<T>) => (prev: ProfileData): ProfileData => ({
    ...prev,
    cards: prev.cards.map((card, i) => i !== cardIndex ? card : {
      ...card,
      elements: card.elements.map((el, j) => {
        if (j !== elementIndex) return el;
        const changes = typeof patch === 'function' ? patch(el as T) : patch;
        return { ...el, ...changes } as CardElement;
      }),
    }),
  }), [cardIndex, elementIndex]);

  const update = useCallback((patch: Patch<T>) => updateProfileData(apply(patch)), [apply, updateProfileData]);

  /** 删除标签 / 图片 / 信息项等，走撤销历史 */
  const updateWithUndo = useCallback((patch: Patch<T>, label: UndoLabel) => commitWithUndo(apply(patch), label), [apply, commitWithUndo]);

  return { update, updateWithUndo };
};
