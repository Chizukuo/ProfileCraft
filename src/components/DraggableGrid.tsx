import React, { useMemo, useCallback } from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { CardData } from '../types/data';
import Card from './Card';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface DraggableGridProps {
  cards: CardData[];
  onLayoutChange: (layouts: Layout[]) => void;
}

const DraggableGrid: React.FC<DraggableGridProps> = ({ cards, onLayoutChange }) => {
  // Convert cards to layout items
  const layout: Layout[] = useMemo(() => {
    return cards.map((card, index) => {
      if (card.layout) {
        return {
          i: card.id,
          x: card.layout.x,
          y: card.layout.y,
          w: card.layout.w,
          h: card.layout.h,
          minW: 1,
          minH: 2,
        };
      }
      
      // Default layout based on card type
      let defaultWidth = 1;
      let defaultHeight = 3;
      
      if (card.layoutSpan === 'about-me-card-span') {
        defaultWidth = 2;
        defaultHeight = 4;
      } else if (card.layoutSpan === 'oshi-card-span' || card.layoutSpan === 'full-width-card-span') {
        defaultWidth = 3;
        defaultHeight = 5;
      }
      
      // Calculate position - simple flow layout
      let x = 0;
      let y = 0;
      
      for (let i = 0; i < index; i++) {
        const prevCard = cards[i];
        const prevLayout = prevCard.layout;
        
        if (prevLayout) {
          y = Math.max(y, prevLayout.y + prevLayout.h);
        } else {
          // Estimate previous card height
          let prevHeight = 3;
          if (prevCard.layoutSpan === 'about-me-card-span') {
            prevHeight = 4;
          } else if (prevCard.layoutSpan === 'oshi-card-span' || prevCard.layoutSpan === 'full-width-card-span') {
            prevHeight = 5;
          }
          y += prevHeight;
        }
      }
      
      return {
        i: card.id,
        x,
        y,
        w: defaultWidth,
        h: defaultHeight,
        minW: 1,
        minH: 2,
      };
    });
  }, [cards]);

  const handleLayoutChange = useCallback((newLayout: Layout[]) => {
    onLayoutChange(newLayout);
  }, [onLayoutChange]);

  return (
    <ResponsiveGridLayout
      className="grid-layout"
      layouts={{ lg: layout }}
      breakpoints={{ lg: 1024, md: 768, sm: 640, xs: 480, xxs: 0 }}
      cols={{ lg: 3, md: 2, sm: 1, xs: 1, xxs: 1 }}
      rowHeight={100}
      onLayoutChange={handleLayoutChange}
      draggableHandle=".drag-handle"
      compactType="vertical"
      preventCollision={false}
      margin={[24, 24]}
      containerPadding={[0, 0]}
    >
      {cards.map((card, index) => (
        <div key={card.id}>
          <Card cardData={card} cardIndex={index} />
        </div>
      ))}
    </ResponsiveGridLayout>
  );
};

export default DraggableGrid;
