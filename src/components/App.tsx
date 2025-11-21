import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useProfile } from '../context/ProfileContext';
import { useTheme } from '../context/ThemeContext';
import Toolbar from './Toolbar';
import ProfileHeader from './ProfileHeader';
import Card from './Card';
import AddCardModal from './AddCardModal';
import { applyThemeColors } from '../utils/colorUtils';
import EditableText from './ui/EditableText';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { CardData, ProfileData } from '../types/data';

const ResponsiveGridLayout = WidthProvider(Responsive);

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
  const { theme, setTheme } = useTheme();
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
        构建时间: ${process.env.REACT_APP_BUILD_TIME ?? import.meta?.env?.VITE_BUILD_TIME ?? new Date().toLocaleString()}
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

  useEffect(() => {
    if (profileData) {
      applyThemeColors(profileData.userSettings.accentColor);
    }
  }, [profileData?.userSettings.accentColor]);

  // Migration effect: Ensure all cards have a layout property
  useEffect(() => {
      if (!profileData) return;
      let updatesNeeded = false;
      const newCards = profileData.cards.map((card, index) => {
          if (!card.layout) {
              updatesNeeded = true;
              let w = 1;
              if (card.layoutSpan?.includes('span 2')) w = 2;
              if (card.layoutSpan?.includes('span 3')) w = 3;
              // Simple default layout logic
              return {
                  ...card,
                  layout: { i: card.id, x: (index * w) % 3, y: Infinity, w, h: 10 }
              };
          }
          return card;
      });

      if (updatesNeeded) {
           updateProfileData((prev: ProfileData | null) => {
              if (!prev) return null;
              return { ...prev, cards: newCards };
          });
      }
  }, [profileData, updateProfileData]);

  const handleFooterUpdate = useCallback((html: string) => {
    if (profileData) {
        updateProfileData((prev: ProfileData | null) => ({
            ...prev!,
            userSettings: { ...prev!.userSettings, footerText: html }
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
        updateProfileData((prev: ProfileData | null) => {
            if (!prev) return null;
            const newCards = prev.cards.map(card => {
                const layoutItem = layout.find((l: any) => l.i === card.id);
                if (layoutItem) {
                    return {
                        ...card,
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
                  layout: { ...(card.layout || { i: card.id, x: 0, y: 0, w: 1 }), h: requiredH }
              };
          }
          return card;
      });

      if (updatesNeeded) {
          updateProfileData((prev: ProfileData | null) => {
              if (!prev) return null;
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
          let w = 1;
          if (card.layoutSpan?.includes('span 2')) w = 2;
          if (card.layoutSpan?.includes('span 3')) w = 3;
          return { i: card.id, x: (index * w) % 3, y: Math.floor(index / 3) * 10, w, h: 10 };
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
                    onLayoutChange={(layout) => handleLayoutChange(layout)}
                    draggableHandle=".drag-handle"
                    isDraggable={true}
                    isResizable={false}
                >
                    {profileData.cards.map((card, index) => (
                        <div key={card.id} className={card.layoutSpan} data-grid={card.layout || { x: (index) % 3, y: Math.floor(index / 3) * 10, w: 1, h: 10, i: card.id }}>
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
