import { useCallback, useMemo } from 'react';
import type { Layout } from 'react-grid-layout';
import type { CardData, CardLayout, ProfileData } from '../types/data';

export const GRID_COLUMNS = 3;
export const DEFAULT_CARD_HEIGHT = 10;

export const getWidthFromLayoutSpan = (layoutSpan?: string): number => {
  if (layoutSpan?.includes('span 2')) return 2;
  if (layoutSpan?.includes('span 3')) return 3;
  return 1;
};

export const getLayoutSpanFromWidth = (width: number, currentLayoutSpan?: string): string => {
  if (width === 1) return 'profile-card-span';
  if (width === 2) return 'about-me-card-span';
  if (currentLayoutSpan === 'oshi-card-span') return 'oshi-card-span';
  return 'full-width-card-span';
};

export const createDefaultLayout = (id: string, index: number, layoutSpan?: string): CardLayout => {
  const width = getWidthFromLayoutSpan(layoutSpan);
  return {
    i: id,
    x: (index * width) % GRID_COLUMNS,
    y: Math.floor(index / GRID_COLUMNS) * DEFAULT_CARD_HEIGHT,
    w: width,
    h: DEFAULT_CARD_HEIGHT,
  };
};

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
