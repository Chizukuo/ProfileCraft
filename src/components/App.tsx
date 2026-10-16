import React, { useEffect, useState, useCallback, useMemo, Suspense } from 'react';
import { useProfile } from '../context/ProfileContext';
import Navigation from './Navigation';
import ProfileHeader from './ProfileHeader';
import Card from './Card';
import { applyThemeColors, resetThemeColors } from '../utils/colorUtils';
import EditableText from './ui/EditableText';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { ProfileData } from '../types/data';
import { loadTranslations } from '../utils/i18n';
import localesManifest from '../config/locales.json';

import { useTheme } from '../context/ThemeContext';
import { useGridLayout, useHeightSync, createDefaultLayout } from '../hooks';
import LoadingScreen from './ui/LoadingScreen';
import UndoToast from './ui/UndoToast';
import PreviewBar from './PreviewBar';
import GuideHint from './ui/GuideHint';
import { useEditorUI } from '../context/EditorUIContext';
import SaveErrorBanner from './ui/SaveErrorBanner';
import { resolveAppearance, getAppearanceCssVars, getFontOption, getPageBackgroundStyle, type PageBackgroundStyle } from '../utils/appearance';

const ResponsiveGridLayout = WidthProvider(Responsive);
const MIN_LOADING_VISIBLE_MS = 400;
const LOADING_FADE_OUT_MS = 300;

const AddCardModal = React.lazy(() => import('./AddCardModal'));
const CustomizePanel = React.lazy(() => import('./CustomizePanel'));

/** 焦点在可输入元素里时，Ctrl+Z 交给浏览器做文字撤销 */
const isTypingTarget = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT');

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
  '%c\n        芝士扩列条编辑器 V' + __APP_VERSION__ + '\n        构建时间: ' +
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
  const { profileData, isLoaded, updateProfileData, updateLayout, undo } = useProfile();
  const { isPreview, isCustomizeOpen, setCustomizeOpen } = useEditorUI();
  const [breakpoint, setBreakpoint] = useState('lg');
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
      import('./AIChatPanel'),
      import('./CustomizePanel'),
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

  // ---- 外观定制 ----
  const appearanceInput = profileData?.userSettings.appearance;
  const appearance = useMemo(() => resolveAppearance(appearanceInput), [appearanceInput]);
  const containerStyle = useMemo(() => getAppearanceCssVars(appearance), [appearance]);
  const gridMargin = useMemo<[number, number]>(() => [appearance.layout.gapX, appearance.layout.gapY], [appearance.layout.gapX, appearance.layout.gapY]);

  // 页面背景挂在 body 上：编辑器整页生效，导出 PNG 时 exportUtils 会读取 body 的背景样式
  useEffect(() => {
    const bgStyle = getPageBackgroundStyle(appearance.background);
    const keys: (keyof PageBackgroundStyle)[] = ['backgroundColor', 'backgroundImage', 'backgroundSize', 'backgroundRepeat', 'backgroundPosition', 'backgroundAttachment'];
    keys.forEach(key => {
      document.body.style[key] = bgStyle ? bgStyle[key] : '';
    });
  }, [appearance.background]);

  // 按需加载所选网络字体
  const fontKey = appearance.layout.fontFamily;
  useEffect(() => {
    const font = getFontOption(fontKey);
    let link = document.getElementById('pc-font-link') as HTMLLinkElement | null;
    if (!font?.cssUrl) {
      link?.remove();
      return;
    }
    if (!link) {
      link = document.createElement('link');
      link.id = 'pc-font-link';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    link.href = font.cssUrl;
  }, [fontKey]);

  // ---- 布局 & 高度同步（提取到独立 hooks）----
  const { layouts, handleLayoutChange, moveCard } = useGridLayout({ profileData, updateProfileData, updateLayout });
  const { handleHeightChange } = useHeightSync({ profileData, isLoaded, updateLayout, marginY: appearance.layout.gapY });
  // 只有桌面三列布局会被保存，其他断点下关闭拖拽，改用卡片菜单里的上移 / 下移
  const isDesktopGrid = breakpoint === 'lg';
  const canEditLayout = isDesktopGrid && !isPreview;

  // 全局撤销：Ctrl/⌘+Z 撤销删除等操作（文字输入中的撤销仍由浏览器处理）
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.shiftKey || e.key.toLowerCase() !== 'z') return;
      if (isTypingTarget(e.target)) return;
      if (undo()) e.preventDefault();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [undo]);

  const closeCustomize = useCallback(() => setCustomizeOpen(false), [setCustomizeOpen]);

  // ---- footer 更新 ----
  const handleFooterUpdate = useCallback((html: string) => {
    updateProfileData((prev: ProfileData) => ({
      ...prev,
      userSettings: { ...prev.userSettings, footerText: html },
    }));
  }, [updateProfileData]);

  const openAddCardModal = useCallback(() => setAddCardModalOpen(true), []);

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
      <SaveErrorBanner />
      <main id="profileCardContainer" className="py-10 px-4 md:px-6 lg:px-8 min-h-screen flex flex-col items-center" style={containerStyle}>
        <ProfileHeader showSubtitle={appearance.visibility.subtitle} />
        <div className="app-grid-shell">
          {mounted && (
            <ResponsiveGridLayout
              className="layout"
              layouts={layouts}
              breakpoints={{ lg: 960, md: 600, sm: 0 }}
              cols={{ lg: 3, md: 2, sm: 1 }}
              rowHeight={10}
              margin={gridMargin}
              onLayoutChange={handleLayoutChange}
              onBreakpointChange={setBreakpoint}
              draggableHandle=".drag-handle"
              isDraggable={canEditLayout}
              isResizable={canEditLayout}
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
                    cardData={card}
                    cardIndex={index}
                    appearance={appearance}
                    isFirst={index === 0}
                    isLast={index === profileData.cards.length - 1}
                    canDrag={canEditLayout}
                    onHeightChange={handleHeightChange}
                    onMove={moveCard}
                  />
                </div>
              ))}
            </ResponsiveGridLayout>
          )}
        </div>
        {appearance.visibility.footer && (
          <footer className="page-footer">
            <EditableText
              as="p"
              html={profileData.userSettings.footerText}
              onUpdate={handleFooterUpdate}
            />
          </footer>
        )}
      </main>
      {isPreview ? <PreviewBar /> : <Navigation onAddCardClick={openAddCardModal} />}
      <UndoToast />
      {!isPreview && <GuideHint />}
      <Suspense fallback={null}>
        {isCustomizeOpen && <CustomizePanel isOpen={isCustomizeOpen} onClose={closeCustomize} />}
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
