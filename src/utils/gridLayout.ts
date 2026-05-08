import type { CardLayout } from '../types/data';

export const GRID_COLUMNS = 3;
export const DEFAULT_CARD_HEIGHT = 10;

export const getWidthFromLayoutSpan = (layoutSpan?: string): number => {
  if (!layoutSpan) return 1;
  if (layoutSpan.includes('span 3') || layoutSpan === 'oshi-card-span' || layoutSpan === 'full-width-card-span' || layoutSpan === 'FULL') return 3;
  if (layoutSpan.includes('span 2') || layoutSpan === 'about-me-card-span' || layoutSpan === 'HALF') return 2;
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
