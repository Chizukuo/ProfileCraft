import { useState, useCallback, useEffect } from 'react';
import type { ProfileData } from '../types/data';
import { createDefaultLayout } from './useGridLayout';

const ROW_HEIGHT = 10;

interface UseHeightSyncOptions {
  profileData: ProfileData | null;
  isLoaded: boolean;
  /** 应传入 updateLayout：高度同步是自动修正，不能清空撤销历史 */
  updateLayout: (updater: (prev: ProfileData) => ProfileData) => void;
  /** 卡片纵向间距（px），与 react-grid-layout 的 margin[1] 一致 */
  marginY: number;
}

/**
 * 根据卡片内容的实际像素高度换算网格行数；同一行（相同 layout.y）的卡片取最高者，保持整行等高。
 */
export const useHeightSync = ({ profileData, isLoaded, updateLayout, marginY }: UseHeightSyncOptions) => {
  const [contentHeights, setContentHeights] = useState<Record<string, number>>({});

  const handleHeightChange = useCallback((id: string, height: number) => {
    setContentHeights(prev => {
      if (prev[id] === height) return prev;
      return { ...prev, [id]: height };
    });
  }, []);

  useEffect(() => {
    if (!profileData || !isLoaded) return;

    const computeCards = (cards: ProfileData['cards']) => {
      const rowMax: Record<number, number> = {};
      cards.forEach(card => {
        const y = card.layout?.y ?? 0;
        rowMax[y] = Math.max(rowMax[y] ?? 0, contentHeights[card.id] ?? 0);
      });

      let changed = false;
      const next = cards.map((card, index) => {
        const maxPixelHeight = rowMax[card.layout?.y ?? 0];
        if (!maxPixelHeight || maxPixelHeight <= 0) return card;
        const requiredH = Math.max(1, Math.ceil((maxPixelHeight + marginY) / (ROW_HEIGHT + marginY)));
        if (card.layout?.h === requiredH) return card;
        changed = true;
        return {
          ...card,
          layout: { ...(card.layout ?? createDefaultLayout(card.id, index, card.layoutSpan)), h: requiredH },
        };
      });
      return changed ? next : null;
    };

    if (computeCards(profileData.cards)) {
      updateLayout(prev => {
        const next = computeCards(prev.cards);
        return next ? { ...prev, cards: next } : prev;
      });
    }
  }, [contentHeights, profileData, updateLayout, isLoaded, marginY]);

  return { handleHeightChange };
};
