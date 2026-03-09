import React, { useEffect, useState, useCallback } from 'react';
import { useProfile } from '../context/ProfileContext';
import Toolbar from './Toolbar';
import ProfileHeader from './ProfileHeader';
import Card from './Card';
import AddCardModal from './AddCardModal';
import { applyThemeColors, resetThemeColors } from '../utils/colorUtils';
import EditableText from './ui/EditableText';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { ProfileData } from '../types/data';
import { useTheme } from '../context/ThemeContext';

const ResponsiveGridLayout = WidthProvider(Responsive);

const GRID_COLUMNS = 3;
const DEFAULT_CARD_HEIGHT = 10;

const getWidthFromLayoutSpan = (layoutSpan?: string) => {
    if (layoutSpan?.includes('span 2')) return 2;
    if (layoutSpan?.includes('span 3')) return 3;
    return 1;
};

const getLayoutSpanFromWidth = (width: number, currentLayoutSpan?: string) => {
    if (width === 1) return 'profile-card-span';
    if (width === 2) return 'about-me-card-span';

    // Keep existing oshi full-width style when card width is 3.
    if (currentLayoutSpan === 'oshi-card-span') return 'oshi-card-span';
    return 'full-width-card-span';
};

const createDefaultLayout = (id: string, index: number, layoutSpan?: string): Layout => {
    const width = getWidthFromLayoutSpan(layoutSpan);
    return {
        i: id,
        x: (index * width) % GRID_COLUMNS,
        y: Math.floor(index / GRID_COLUMNS) * DEFAULT_CARD_HEIGHT,
        w: width,
        h: DEFAULT_CARD_HEIGHT
    };
};

const SeoContent: React.FC = () => (
    <div className="intro-section" style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', left: '-9999px', top: '-9999px', opacity: 0 }}>
        <h1>芝士扩列条在线制作工具 (ProfileCraft)</h1>
        <p>
            使用 ProfileCraft，您可以方便地在线制作和分享您的个人扩列条。这是一个简洁的工具，帮助您快速生成社交名片。
        </p>
    </div>
);


function App() {
  const { profileData, isLoaded, updateProfileData } = useProfile();
    const { resolvedTheme } = useTheme();
  const [isAddCardModalOpen, setAddCardModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [contentHeights, setContentHeights] = useState<Record<string, number>>({});

  useEffect(() => {
    setMounted(true);
    const art = `

 ▄████▄   ██░ ██  ██▓▒███████▒ █    ██  ██ ▄█▀ █    ██  ▒█████  
▒██▀ ▀█  ▓██░ ██▒▓██▒▒ ▒ ▒ ▄▀░ ██  ▓██▒ ██▄█▒  ██  ▓██▒▒██▒  ██▒
▒▓█    ▄ ▒██▀▀██░▒██▒░ ▒ ▄▀▒░ ▓██  ▒██░▓███▄░ ▓██  ▒██░▒██░  ██▒
▒▓▓▄ ▄██▒░▓█ ░██ ░██░  ▄▀▒   ░▓▓█  ░██░▓██ █▄ ▓▓█  ░██░▒██   ██░
▒ ▓███▀ ░░▓█▒░██▓░██░▒███████▒▒▒█████▓ ▒██▒ █▄▒▒█████▓ ░ ████▓▒░
░ ░▒ ▒  ░ ▒ ░░▒░▒░▓  ░▒▒ ▓░▒░▒░▒▓▒ ▒ ▒ ▒ ▒▒ ▓▒░▒▓▒ ▒ ▒ ░ ▒░▒░▒░ 
  ░  ▒    ▒ ░▒░ ░ ▒ ░░░▒ ▒ ░ ▒░░▒░ ░ ░ ░ ░▒ ▒░░░▒░ ░ ░   ░ ▒ ▒░ 
░         ░  ░░ ░ ▒ ░░ ░ ░ ░ ░░░ ░ ░ ░ ░░ ░  ░░░ ░ ░ ░ ░ ░ ▒  
░ ░       ░  ░  ░ ░    ░ ░       ░     ░  ░      ░         ░ ░  
░                    ░                                          
    
    
    `;

        const versionInfo = `
        芝士扩列条编辑器 V2.4.0
        构建时间: ${import.meta.env.VITE_BUILD_TIME ?? new Date().toLocaleString()}
         chizukuo@icloud.com
    `;

        const styleArt = `
    color: #FFC107;
    font-weight: bold;
    font-size: 14px;
    font-family: "Courier New", "Lucida Console", monospace;
    white-space: pre;
    `;

        const styleVersion = `
    color: #B5651D; 
    font-weight: bold;
    font-size: 12px;
    font-family: "Courier New", "Lucida Console", monospace;
    white-space: pre;
    `;

        console.log('%c' + art, styleArt.trim());
        console.log('%c' + versionInfo, styleVersion.trim());
  }, []); 

    const accentColor = profileData?.userSettings.accentColor;
    useEffect(() => {
        if (resolvedTheme.settings.isAccentColorEnabled && accentColor) {
            applyThemeColors(accentColor);
            return;
        }
        resetThemeColors();
    }, [accentColor, resolvedTheme.settings.isAccentColorEnabled]);

  // Migration effect: Ensure all cards have a layout property and sync layoutSpan
  useEffect(() => {
      if (!profileData) return;
      let updatesNeeded = false;
      const newCards = profileData.cards.map((card, index) => {
          const newCard = { ...card };

          // 1. Ensure layout exists
          if (!newCard.layout) {
              updatesNeeded = true;
              newCard.layout = { ...createDefaultLayout(newCard.id, index, newCard.layoutSpan), y: Infinity };
          }

          // 2. Sync layoutSpan with layout.w
          if (newCard.layout) {
              const expectedSpan = getLayoutSpanFromWidth(newCard.layout.w, newCard.layoutSpan);

              if (newCard.layoutSpan !== expectedSpan) {
                  updatesNeeded = true;
                  newCard.layoutSpan = expectedSpan;
              }
          }

          return newCard;
      });

      if (updatesNeeded) {
           updateProfileData((prev: ProfileData) => {
              return { ...prev, cards: newCards };
          });
      }
  }, [profileData, updateProfileData]);

  const handleFooterUpdate = useCallback((html: string) => {
    if (profileData) {
        updateProfileData((prev: ProfileData) => ({
            ...prev,
            userSettings: { ...prev.userSettings, footerText: html }
        }));
    }
  }, [profileData, updateProfileData]);

  const handleLayoutChange = useCallback((layout: Layout[]) => {
    if (!profileData) return;

    // Check if layout actually changed to avoid infinite loops
    const hasChanged = layout.some(l => {
        const card = profileData.cards.find(c => c.id === l.i);
        if (!card) return false;
        const currentLayout = card.layout;
        if (!currentLayout) return true;
        return currentLayout.x !== l.x || currentLayout.y !== l.y || currentLayout.w !== l.w || currentLayout.h !== l.h;
    });

    if (hasChanged) {
        updateProfileData((prev: ProfileData) => {
            const newCards = prev.cards.map(card => {
                const layoutItem = layout.find((l) => l.i === card.id);
                if (layoutItem) {
                    const newLayoutSpan = getLayoutSpanFromWidth(layoutItem.w, card.layoutSpan);

                    return {
                        ...card,
                        layoutSpan: newLayoutSpan,
                        layout: {
                            i: layoutItem.i,
                            x: layoutItem.x,
                            y: layoutItem.y,
                            w: layoutItem.w,
                            h: layoutItem.h
                        }
                    };
                }
                return card;
            });
            // Sort cards based on layout (y then x) to keep DOM order somewhat consistent with visual order
            // This is optional but good for accessibility and tab order
            newCards.sort((a, b) => {
                const la = a.layout || { y: 0, x: 0 };
                const lb = b.layout || { y: 0, x: 0 };
                if (la.y === lb.y) return la.x - lb.x;
                return la.y - lb.y;
            });

            return { ...prev, cards: newCards };
        });
    }
  }, [profileData, updateProfileData]);

  const handleHeightChange = useCallback((id: string, height: number) => {
      setContentHeights(prev => ({ ...prev, [id]: height }));
  }, []);

  useEffect(() => {
      if (!profileData) return;

      const rowGroups: Record<number, string[]> = {};
      // Group by Y
      profileData.cards.forEach(card => {
          const y = card.layout?.y || 0;
          if (!rowGroups[y]) rowGroups[y] = [];
          rowGroups[y].push(card.id);
      });

      let updatesNeeded = false;
      const newCards = profileData.cards.map(card => {
          const y = card.layout?.y || 0;
          const rowIds = rowGroups[y];
          
          // Find max pixel height in this row
          let maxPixelHeight = 0;
          rowIds.forEach(id => {
              const h = contentHeights[id] || 0;
              if (h > maxPixelHeight) maxPixelHeight = h;
          });

          // Convert to grid units
          const rowHeight = 10;
          const marginY = 32;
          const requiredH = Math.ceil((maxPixelHeight + marginY) / (rowHeight + marginY));
          
          if (card.layout?.h !== requiredH) {
              updatesNeeded = true;
              return {
                  ...card,
                                    layout: {
                                        ...(card.layout || createDefaultLayout(card.id, 0, card.layoutSpan)),
                                        h: requiredH
                                    }
              };
          }
          return card;
      });

      if (updatesNeeded) {
          updateProfileData((prev: ProfileData) => {
              return { ...prev, cards: newCards };
          });
      }
  }, [contentHeights, profileData, updateProfileData]);

  if (!isLoaded || !profileData) {
    return <div>Loading...</div>; // Or a loading spinner
  }

  // Generate initial layout if missing
  const layouts = {
      lg: profileData.cards.map((card, index) => {
          if (card.layout) return { ...card.layout, i: card.id };
          return createDefaultLayout(card.id, index, card.layoutSpan);
      })
  };

  return (
    <>
      <SeoContent />
      <Toolbar onAddCardClick={() => setAddCardModalOpen(true)} />
      <main id="profileCardContainer" className="py-10 px-4 md:px-6 lg:px-8 min-h-screen flex flex-col items-center">
        <ProfileHeader />
        <div style={{ width: '100%' }}>
            {mounted && (
                <ResponsiveGridLayout
                    className="layout"
                    layouts={layouts}
                    breakpoints={{ lg: 960, md: 600, sm: 0 }}
                    cols={{ lg: 3, md: 2, sm: 1 }}
                    rowHeight={10}
                    margin={[24, 32]}
                    onLayoutChange={(layout: Layout[]) => handleLayoutChange(layout)}
                    draggableHandle=".drag-handle"
                    isDraggable={true}
                    isResizable={false}
                >
                    {profileData.cards.map((card, index) => (
                                                <div
                                                    key={card.id}
                                                    className={card.layoutSpan}
                                                    data-grid={card.layout || createDefaultLayout(card.id, index, card.layoutSpan)}
                                                >
                            <Card 
                                key={card.id} 
                                cardData={card} 
                                cardIndex={index} 
                                onHeightChange={(h) => handleHeightChange(card.id, h)}
                            />
                        </div>
                    ))}
                </ResponsiveGridLayout>
            )}
        </div>
        <footer className="page-footer">
            <EditableText 
              as="p"
              html={profileData.userSettings.footerText}
              onUpdate={handleFooterUpdate}
            />
        </footer>
      </main>
      <AddCardModal 
        isOpen={isAddCardModalOpen} 
        onClose={() => setAddCardModalOpen(false)} 
      />
    </>
  );
}


export default App;
