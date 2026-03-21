import { useState, useCallback, useEffect } from 'react';
import type { ProfileData } from '../types/data';
import { createDefaultLayout } from './useGridLayout';

interface UseHeightSyncOptions {
  profileData: ProfileData | null;
  isLoaded: boolean;
  updateProfileData: (updater: (prev: ProfileData) => ProfileData) => void;
}

export const useHeightSync = ({ profileData, isLoaded, updateProfileData }: UseHeightSyncOptions) => {
  const [contentHeights, setContentHeights] = useState<Record<string, number>>({});

  const handleHeightChange = useCallback((id: string, height: number) => {
    setContentHeights(prev => {
      if (prev[id] === height) return prev;
      return { ...prev, [id]: height };
    });
  }, []);

  useEffect(() => {
    if (!profileData || !isLoaded) return;

    const rowGroups: Record<number, string[]> = {};
    profileData.cards.forEach(card => {
      // Use y = 0 if layout is missing (though it should be migration-guaranteed now)
      const y = card.layout?.y ?? 0;
      if (!rowGroups[y]) rowGroups[y] = [];
      rowGroups[y].push(card.id);
    });

    const ROW_HEIGHT = 10;
    const MARGIN_Y = 32;

    let updatesNeeded = false;
    const currentCards = profileData.cards;
    
    const newCards = currentCards.map((card, index) => {
      const y = card.layout?.y ?? 0;
      const rowIds = rowGroups[y];
      
      if (!rowIds) return card;

      let maxPixelHeight = 0;
      rowIds.forEach(id => {
        const h = contentHeights[id] ?? 0;
        if (h > maxPixelHeight) maxPixelHeight = h;
      });

      // Avoid 0/NaN issues
      if (maxPixelHeight <= 0) return card;

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
      // Use a functional update to ensure we have the latest state and avoid racing
      updateProfileData((prev: ProfileData) => {
        // Double check within the updater if heights actually still need changing
        // to handle cases where multiple updates might be queued
        const stillNeedsUpdate = newCards.some((newCard, idx) => {
            return newCard.layout?.h !== prev.cards[idx]?.layout?.h;
        });
        
        if (!stillNeedsUpdate) return prev;
        return { ...prev, cards: newCards };
      });
    }
  }, [contentHeights, profileData, updateProfileData, isLoaded]);

  return { contentHeights, handleHeightChange };
};
