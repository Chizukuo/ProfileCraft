import { useState, useCallback, useEffect } from 'react';
import type { ProfileData } from '../types/data';
import { createDefaultLayout } from './useGridLayout';

interface UseHeightSyncOptions {
  profileData: ProfileData | null;
  updateProfileData: (updater: (prev: ProfileData) => ProfileData) => void;
}

export const useHeightSync = ({ profileData, updateProfileData }: UseHeightSyncOptions) => {
  const [contentHeights, setContentHeights] = useState<Record<string, number>>({});

  const handleHeightChange = useCallback((id: string, height: number) => {
    setContentHeights(prev => {
      if (prev[id] === height) return prev;
      return { ...prev, [id]: height };
    });
  }, []);

  useEffect(() => {
    if (!profileData) return;

    const rowGroups: Record<number, string[]> = {};
    profileData.cards.forEach(card => {
      const y = card.layout?.y ?? 0;
      if (!rowGroups[y]) rowGroups[y] = [];
      rowGroups[y].push(card.id);
    });

    const ROW_HEIGHT = 10;
    const MARGIN_Y = 32;

    let updatesNeeded = false;
    const newCards = profileData.cards.map((card, index) => {
      const y = card.layout?.y ?? 0;
      const rowIds = rowGroups[y];

      let maxPixelHeight = 0;
      rowIds.forEach(id => {
        const h = contentHeights[id] ?? 0;
        if (h > maxPixelHeight) maxPixelHeight = h;
      });

      const requiredH = Math.ceil((maxPixelHeight + MARGIN_Y) / (ROW_HEIGHT + MARGIN_Y));

      if (card.layout?.h !== requiredH) {
        updatesNeeded = true;
        return {
          ...card,
          layout: {
            ...(card.layout ?? createDefaultLayout(card.id, index, card.layoutSpan)),
            h: requiredH,
          },
        };
      }
      return card;
    });

    if (updatesNeeded) {
      updateProfileData((prev: ProfileData) => ({ ...prev, cards: newCards }));
    }
  }, [contentHeights, profileData, updateProfileData]);

  return { contentHeights, handleHeightChange };
};
