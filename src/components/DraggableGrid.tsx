import React, { useMemo, useCallback } from 'react';
import { Responsive, WidthProvider, Layout, Layouts } from 'react-grid-layout';
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
  const layouts: Layouts = useMemo(() => {
    const layout: Layout[] = cards.map((card, index) => {
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
      
      // Calculate position for initial layout
      const y = index * defaultHeight;
      
      return {
        i: card.id,
        x: 0,
        y,
        w: defaultWidth,
        h: defaultHeight,
        minW: 1,
        minH: 2,
      };
    });
    
    // Return same layout for all breakpoints
    return {
      lg: layout,
      md: layout,
      sm: layout,
      xs: layout,
      xxs: layout,
    };
  }, [cards]);

  const handleLayoutChange = useCallback((_: Layout[], allLayouts: Layouts) => {
    // Use the lg layout as the primary one to save
    if (allLayouts.lg) {
      onLayoutChange(allLayouts.lg);
    }
  }, [onLayoutChange]);

  return (
    <ResponsiveGridLayout
      className="grid-layout"
      layouts={layouts}
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
