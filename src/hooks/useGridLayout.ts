import { useCallback, useMemo } from 'react';
import type { Layout, Layouts } from 'react-grid-layout';
import type { CardData, CardLayout, ProfileData } from '../types/data';
import { GRID_COLUMNS, getLayoutSpanFromWidth, createDefaultLayout } from '../utils/gridLayout';

export { GRID_COLUMNS, DEFAULT_CARD_HEIGHT, getWidthFromLayoutSpan, getLayoutSpanFromWidth, createDefaultLayout } from '../utils/gridLayout';

interface UseGridLayoutOptions {
  profileData: ProfileData | null;
  /** 用户的排序操作（上移 / 下移） */
  updateProfileData: (updater: (prev: ProfileData) => ProfileData) => void;
  /** RGL 回传的布局（拖拽结果、删除后的压实），不应清空撤销历史 */
  updateLayout: (updater: (prev: ProfileData) => ProfileData) => void;
}

const sortByPosition = (cards: CardData[]) =>
  [...cards].sort((a, b) => {
    const la = a.layout ?? { y: 0, x: 0 };
    const lb = b.layout ?? { y: 0, x: 0 };
    return la.y !== lb.y ? la.y - lb.y : la.x - lb.x;
  });

export const useGridLayout = ({ profileData, updateProfileData, updateLayout }: UseGridLayoutOptions) => {
  const layouts = useMemo(() => ({
    lg: (profileData?.cards ?? []).map((card, index) => {
      if (card.layout) return { ...card.layout, i: card.id };
      return createDefaultLayout(card.id, index, card.layoutSpan);
    }),
  }), [profileData?.cards]);

  /**
   * 只持久化桌面（lg，3 列）布局。
   * 在手机 / 平板断点下 react-grid-layout 给出的是 1~2 列的派生布局，
   * 如果写回会把所有卡片宽度压成 1 列。allLayouts.lg 在非 lg 断点下就是我们传入的原值，不会产生改动。
   * 同时这里也会接收 RGL 压实（compact）后的坐标，保证存储的 y 与实际显示一致。
   */
  const handleLayoutChange = useCallback((_current: Layout[], allLayouts: Layouts) => {
    const layout = allLayouts.lg;
    if (!layout) return;

    updateLayout((prev: ProfileData) => {
      const hasChanged = layout.some(l => {
        const card = prev.cards.find(c => c.id === l.i);
        if (!card) return false;
        const current = card.layout;
        if (!current) return true;
        return current.x !== l.x || current.y !== l.y || current.w !== l.w || current.h !== l.h;
      });
      if (!hasChanged) return prev;

      const newCards = prev.cards.map(card => {
        const item = layout.find(l => l.i === card.id);
        if (!item) return card;
        return {
          ...card,
          layoutSpan: getLayoutSpanFromWidth(item.w, card.layoutSpan),
          layout: { i: item.i, x: item.x, y: item.y, w: item.w, h: item.h },
        };
      });

      return { ...prev, cards: sortByPosition(newCards) };
    });
  }, [updateLayout]);

  /** 不依赖拖拽的排序（手机端可用）：与前 / 后一张卡片交换位置，由 RGL 压实处理重叠 */
  const moveCard = useCallback((cardId: string, direction: -1 | 1) => {
    updateProfileData((prev: ProfileData) => {
      const sorted = sortByPosition(prev.cards);
      const index = sorted.findIndex(c => c.id === cardId);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= sorted.length) return prev;

      const la = sorted[index].layout;
      const lb = sorted[target].layout;
      if (!la || !lb) return prev;

      let nextA: CardLayout;
      let nextB: CardLayout;
      if (la.y === lb.y) {
        // 同一行：左右互换，宽度不同时按新顺序重新排 x，避免互相重叠
        const [first, second] = direction === 1 ? [lb, la] : [la, lb];
        const startX = Math.min(la.x, lb.x);
        const firstX = startX;
        const secondX = Math.min(startX + first.w, GRID_COLUMNS - second.w);
        nextA = { ...la, x: first === la ? firstX : secondX };
        nextB = { ...lb, x: first === lb ? firstX : secondX };
      } else {
        // 不同行：交换所在行，x 尽量保持
        nextA = { ...la, y: lb.y, x: Math.min(lb.x, GRID_COLUMNS - la.w) };
        nextB = { ...lb, y: la.y, x: Math.min(la.x, GRID_COLUMNS - lb.w) };
      }
      const swapped = sorted.map(card => {
        if (card.id === la.i) return { ...card, layout: nextA };
        if (card.id === lb.i) return { ...card, layout: nextB };
        return card;
      });
      return { ...prev, cards: sortByPosition(swapped) };
    });
  }, [updateProfileData]);

  return { layouts, handleLayoutChange, moveCard };
};
