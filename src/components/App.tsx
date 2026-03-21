import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useProfile } from '../context/ProfileContext';
import Navigation from './Navigation';
import ProfileHeader from './ProfileHeader';
import Card from './Card';
import { applyThemeColors, resetThemeColors } from '../utils/colorUtils';
import EditableText from './ui/EditableText';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { ProfileData } from '../types/data';
import { loadTranslations } from '../utils/i18n';
import localesManifest from '../config/locales.json';

import { useTheme } from '../context/ThemeContext';
import { useGridLayout, useHeightSync, createDefaultLayout } from '../hooks';
import LoadingScreen from './ui/LoadingScreen';

const ResponsiveGridLayout = WidthProvider(Responsive);
const MIN_LOADING_VISIBLE_MS = 400;
const LOADING_FADE_OUT_MS = 300;

const AddCardModal = React.lazy(() => import('./AddCardModal'));

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

  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [chunksPrefetched, setChunksPrefetched] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // 1. Wait for web fonts
    document.fonts.ready.then(() => {
      setFontsLoaded(true);
    });

    // 2. Eagerly prefetch heavy chunks & all languages during the loading screen
    const locales = Object.keys(localesManifest) as (keyof typeof localesManifest)[];
    
    Promise.all([
      import('./AddCardModal'),
      import('./ui/ConfirmDialog'),
      import('./AIProfileBuilderModal'),
      import('../utils/exportUtils'),
      import('../utils/importUtils'),
      // Prefetch all language JSONs
      ...locales.map(l => loadTranslations(l))
    ])
      .then(() => setChunksPrefetched(true))
      .catch((err) => {
        console.warn('Prefetching some resources failed, falling back to on-demand loading:', err);
        setChunksPrefetched(true); 
      });
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
  const { handleHeightChange } = useHeightSync({ profileData, isLoaded, updateProfileData });

  // ---- footer 更新 ----
  const handleFooterUpdate = useCallback((html: string) => {
    updateProfileData((prev: ProfileData) => ({
      ...prev,
      userSettings: { ...prev.userSettings, footerText: html },
    }));
  }, [updateProfileData]);

  const appReady = isLoaded && Boolean(profileData) && fontsLoaded && chunksPrefetched;

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

  if (!appReady || showLoadingScreen || !profileData) {
    return <LoadingScreen isExiting={isLoadingScreenExiting} />;
  }


  return (
    <>
      <SeoContent />
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
      <Navigation onAddCardClick={() => setAddCardModalOpen(true)} />
      <Suspense fallback={null}>
        {isAddCardModalOpen && (
          <AddCardModal
            isOpen={isAddCardModalOpen}
            onClose={() => setAddCardModalOpen(false)}
          />
        )}
      </Suspense>
    </>
  );
}

export default App;
