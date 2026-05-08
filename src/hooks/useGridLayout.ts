import { useCallback, useMemo } from 'react';
import type { Layout } from 'react-grid-layout';
import type { CardData, ProfileData } from '../types/data';
import { GRID_COLUMNS, getWidthFromLayoutSpan, getLayoutSpanFromWidth, createDefaultLayout } from '../utils/gridLayout';

export { GRID_COLUMNS, DEFAULT_CARD_HEIGHT, getWidthFromLayoutSpan, getLayoutSpanFromWidth, createDefaultLayout } from '../utils/gridLayout';

interface UseGridLayoutOptions {
  profileData: ProfileData | null;
  updateProfileData: (updater: (prev: ProfileData) => ProfileData) => void;
}

export const useGridLayout = ({ profileData, updateProfileData }: UseGridLayoutOptions) => {
  const layouts = useMemo(() => ({
    lg: (profileData?.cards ?? []).map((card, index) => {
      if (card.layout) return { ...card.layout, i: card.id };
      return createDefaultLayout(card.id, index, card.layoutSpan);
    }),
  }), [profileData?.cards]);

  const handleLayoutChange = useCallback((layout: Layout[]) => {
    if (!profileData) return;

    const hasChanged = layout.some(l => {
      const card = profileData.cards.find(c => c.id === l.i);
      if (!card) return false;
      const current = card.layout;
      if (!current) return true;
      return current.x !== l.x || current.y !== l.y || current.w !== l.w || current.h !== l.h;
    });

    if (!hasChanged) return;

    updateProfileData((prev: ProfileData) => {
      const newCards = prev.cards.map(card => {
        const layoutItem = layout.find(l => l.i === card.id);
        if (!layoutItem) return card;

        const newLayoutSpan = getLayoutSpanFromWidth(layoutItem.w, card.layoutSpan);
        return {
          ...card,
          layoutSpan: newLayoutSpan,
          layout: {
            i: layoutItem.i,
            x: layoutItem.x,
            y: layoutItem.y,
            w: layoutItem.w,
            h: layoutItem.h,
          } as CardData['layout'],
        };
      });

      newCards.sort((a, b) => {
        const la = a.layout ?? { y: 0, x: 0 };
        const lb = b.layout ?? { y: 0, x: 0 };
        return la.y !== lb.y ? la.y - lb.y : la.x - lb.x;
      });

      return { ...prev, cards: newCards };
    });
  }, [profileData, updateProfileData]);

  return { layouts, handleLayoutChange };
};
