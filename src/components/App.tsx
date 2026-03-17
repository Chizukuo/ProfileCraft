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
import { useGridLayout, useHeightSync, createDefaultLayout, getLayoutSpanFromWidth } from '../hooks';
import LoadingScreen from './ui/LoadingScreen';

const ResponsiveGridLayout = WidthProvider(Responsive);
const MIN_LOADING_VISIBLE_MS = 700;
const LOADING_FADE_OUT_MS = 280;

// 模块级别只执行一次，不受 StrictMode 双调用影响
const _art = `

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
console.log('%c' + _art, 'color:#FFC107;font-weight:bold;font-size:14px;font-family:"Courier New",monospace;white-space:pre;');
console.log(
  '%c\n        芝士扩列条编辑器 V2.4.5\n        构建时间: ' +
    (import.meta.env.VITE_BUILD_TIME ?? '未知构建时间') +
    '\n         chizukuo@icloud.com\n    ',
  'color:#B5651D;font-weight:bold;font-size:12px;font-family:"Courier New",monospace;white-space:pre;'
);

const SeoContent: React.FC = () => (
  <div className="intro-section seo-hidden-content">
    <h1>芝士扩列条在线制作工具 (ProfileCraft)</h1>
    <p>使用 ProfileCraft，您可以方便地在线制作和分享您的个人扩列条。这是一个简洁的工具，帮助您快速生成社交名片。</p>
  </div>
);

function App() {
  const { profileData, isLoaded, updateProfileData } = useProfile();
  const { resolvedTheme } = useTheme();
  const [isAddCardModalOpen, setAddCardModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(true);
  const [isLoadingScreenExiting, setIsLoadingScreenExiting] = useState(false);
  const [loadingStartAt] = useState(() => performance.now());

  useEffect(() => {
    setMounted(true);
  }, []);

  // ---- 强调色应用 ----
  const accentColor = profileData?.userSettings.accentColor;
  useEffect(() => {
    if (resolvedTheme.settings.isAccentColorEnabled && accentColor) {
      applyThemeColors(accentColor);
      return;
    }
    resetThemeColors();
  }, [accentColor, resolvedTheme.settings.isAccentColorEnabled]);

  // ---- 布局 & 高度同步（提取到独立 hooks）----
  const { layouts, handleLayoutChange } = useGridLayout({ profileData, updateProfileData });
  const { handleHeightChange } = useHeightSync({ profileData, updateProfileData });

  // ---- 数据迁移：确保所有卡片含 layout 字段，并保持 layoutSpan 与 layout.w 同步 ----
  useEffect(() => {
    if (!profileData) return;
    let updatesNeeded = false;
    const newCards = profileData.cards.map((card, index) => {
      const newCard = { ...card };
      if (!newCard.layout) {
        updatesNeeded = true;
        newCard.layout = { ...createDefaultLayout(newCard.id, index, newCard.layoutSpan), y: Infinity };
      }
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
      updateProfileData((prev: ProfileData) => ({ ...prev, cards: newCards }));
    }
  }, [profileData, updateProfileData]);

  // ---- footer 更新 ----
  const handleFooterUpdate = useCallback((html: string) => {
    updateProfileData((prev: ProfileData) => ({
      ...prev,
      userSettings: { ...prev.userSettings, footerText: html },
    }));
  }, [updateProfileData]);

  const appReady = isLoaded && Boolean(profileData);

  useEffect(() => {
    if (!appReady) {
      setShowLoadingScreen(true);
      setIsLoadingScreenExiting(false);
      return;
    }

    const elapsed = performance.now() - loadingStartAt;
    const waitBeforeExit = Math.max(MIN_LOADING_VISIBLE_MS - elapsed, 0);

    const exitTimer = window.setTimeout(() => {
      setIsLoadingScreenExiting(true);
    }, waitBeforeExit);

    const hideTimer = window.setTimeout(() => {
      setShowLoadingScreen(false);
    }, waitBeforeExit + LOADING_FADE_OUT_MS);

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(hideTimer);
    };
  }, [appReady, loadingStartAt]);

  if (!appReady || showLoadingScreen) {
    return <LoadingScreen isExiting={isLoadingScreenExiting} />;
  }

  return (
    <>
      <SeoContent />
      <Toolbar onAddCardClick={() => setAddCardModalOpen(true)} />
      <main id="profileCardContainer" className="py-10 px-4 md:px-6 lg:px-8 min-h-screen flex flex-col items-center">
        <ProfileHeader />
        <div className="app-grid-shell">
          {mounted && (
            <ResponsiveGridLayout
              className="layout"
              layouts={layouts}
              breakpoints={{ lg: 960, md: 600, sm: 0 }}
              cols={{ lg: 3, md: 2, sm: 1 }}
              rowHeight={10}
              margin={[24, 32]}
              onDragStop={(layout: Layout[]) => handleLayoutChange(layout)}
              onResizeStop={(layout: Layout[]) => handleLayoutChange(layout)}
              draggableHandle=".drag-handle"
              isDraggable={true}
              isResizable={true}
              resizeHandles={['e']}
              compactType="vertical"
            >
              {profileData.cards.map((card, index) => (
                <div
                  key={card.id}
                  className={card.layoutSpan}
                  data-grid={{
                    ...(card.layout ?? createDefaultLayout(card.id, index, card.layoutSpan)),
                    minW: 1,
                    maxW: 3,
                    minH: 6,
                  }}
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
