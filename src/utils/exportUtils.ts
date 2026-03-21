import html2canvas from 'html2canvas';
import { ProfileData } from '../types/data';
import { loadTranslations, createT } from './i18n';
import { Locale } from '../context/LocaleContext';
import { getThemeCssPath, type ThemeKey } from './themeUtils';

// 缓存翻译函数
let cachedT: ((key: string, params?: Record<string, string | number>) => string) | null = null;
let currentLocale: string | null = null;

/**
 * 获取翻译函数
 */
async function getTranslationFunction(locale: Locale) {
  if (cachedT && currentLocale === locale) {
    return cachedT;
  }
  
  currentLocale = locale;
  const translations = await loadTranslations(locale);
  cachedT = createT(translations);
  return cachedT;
}

const EXPORT_HIDDEN_SELECTORS = [
    '.action-button',
    '.delete-action-btn',
    '.add-tag-button-container',
    '.tag-actions-container',
    '.delete-element-btn',
    '.card-actions-container',
    '.edit-popup',
    '.qr-code-link-input',
    '.rich-text-toolbar',
    '.qr-code-wrapper p.text-sm',
    '.qr-code-wrapper .text-sm',
    '.hamburger-menu',
    '.action-button-text-with-icon',
    '.drag-handle',
    '.width-control-container',
    '.react-resizable-handle',
    '.delete-item-btn',
    '.add-item-btn',
    '.sidebar-container'
];

const EDITOR_OVERLAY_SELECTORS = '.editor-toolbar, .edit-popup, .rich-text-toolbar';

const removeElementsBySelectors = (root: ParentNode, selectors: string[]) => {
    selectors.forEach((selector) => {
        root.querySelectorAll(selector).forEach((el) => el.remove());
    });
};

const cleanupContentEditableElements = (root: ParentNode, resetInlineStyles: boolean) => {
    root.querySelectorAll('[contenteditable]').forEach((el) => {
        el.removeAttribute('contenteditable');

        if (resetInlineStyles) {
            const htmlEl = el as HTMLElement;
            htmlEl.style.backgroundColor = 'transparent';
            htmlEl.style.cursor = 'default';
            htmlEl.style.padding = '';
            htmlEl.style.margin = '';
        }
    });
};

const setAvatarNonInteractive = (root: ParentNode) => {
    root.querySelectorAll('.avatar-container').forEach((el) => {
        (el as HTMLElement).style.cursor = 'default';
    });
};

const stripHtmlTags = (value: string) => value.replace(/<[^>]*>/g, '');

const getCssVarValue = (computedStyle: CSSStyleDeclaration, name: string) => computedStyle.getPropertyValue(name).trim();

const getDynamicThemeStyleBlock = () => {
    const computedStyle = getComputedStyle(document.documentElement);

    return `
    :root {
        --theme-accent: ${getCssVarValue(computedStyle, '--theme-accent')};
        --theme-bg-page: ${getCssVarValue(computedStyle, '--theme-bg-page')};
        --theme-tag-bg: ${getCssVarValue(computedStyle, '--theme-tag-bg')};
        --theme-tag-bg-alt: ${getCssVarValue(computedStyle, '--theme-tag-bg-alt')};
        --theme-text-strong: ${getCssVarValue(computedStyle, '--theme-text-strong')};
        --theme-divider: ${getCssVarValue(computedStyle, '--theme-divider')};
        --button-text-on-accent: ${getCssVarValue(computedStyle, '--button-text-on-accent')};
        --qr-code-fg-color: ${getCssVarValue(computedStyle, '--qr-code-fg-color')};
    }
    `;
};

const getThemeCssContent = async (themeName: Theme) => {
    const themeCssPath = getThemeCssPath(themeName);

    if (!themeCssPath) {
        return '';
    }

    try {
        const response = await fetch(themeCssPath);
        if (!response.ok) {
            console.warn(`Failed to fetch theme CSS: ${response.statusText}`);
            return '';
        }
        return await response.text();
    } catch (error) {
        console.error('Error fetching theme CSS:', error);
        return '';
    }
};

export type Theme = ThemeKey;
import appCssContent from '../styles/App.css?raw'; // Import App.css content directly

// 将当前文档 (:root) 上定义的 CSS 变量复制到目标节点，确保主题变量可用
const cloneRootCssVariables = (target: HTMLElement) => {
    const rootStyles = getComputedStyle(document.documentElement);
    for (let i = 0; i < rootStyles.length; i++) {
        const propertyName = rootStyles.item(i);
        if (propertyName && propertyName.startsWith('--')) {
            const value = rootStyles.getPropertyValue(propertyName);
            target.style.setProperty(propertyName, value);
        }
    }
};


/**
 * 导出为 HTML 文件
 * 此函数将当前主题的 CSS 和 App.css 内容直接嵌入到 HTML 中，并移除编辑器控件
 * @param profileData 用户的个人资料数据
 * @param currentThemeName 当前选择的主题名称
 * @param locale 当前语言
 */
export const exportToHtml = async (profileData: ProfileData, currentThemeName: Theme, locale: Locale) => {
    const t = await getTranslationFunction(locale);
    const container = document.getElementById('profileCardContainer');
    if (!container) {
        showNotification(t('notification.exportContainerNotFound') || 'Container not found', 'error');
        return;
    }

    const themeCssContent = await getThemeCssContent(currentThemeName);

    // 动态生成主题颜色相关的 CSS 变量
    const dynamicThemeStyleBlock = getDynamicThemeStyleBlock();

    // 克隆并清理 HTML 内容
    const exportContainer = container.cloneNode(true) as HTMLElement;

    // 移除所有编辑器相关的控件和交互元素
    removeElementsBySelectors(exportContainer, EXPORT_HIDDEN_SELECTORS);

    // 移除 contenteditable 属性，并清理编辑时的视觉样式
    cleanupContentEditableElements(exportContainer, true);
    setAvatarNonInteractive(exportContainer);

    // 更新页脚信息
    const footerP = exportContainer.querySelector('.page-footer p');
    if (footerP) {
        const poweredByLink = " | Powered by <a href='https://tools.chizunet.cc/' target='_blank' rel='noopener noreferrer' style='color: var(--theme-accent); text-decoration: none;'>ProfileCraft</a>";
        footerP.innerHTML += poweredByLink;
    }

    // 构建最终的 HTML 文件
    const fullHtml = `<!DOCTYPE html>
<html lang="${locale}" data-locale="${locale}" data-theme="${currentThemeName}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="使用 ProfileCraft 创建的个人扩列条">
    <title>${stripHtmlTags(profileData.userSettings.mainTitle)} - 扩列条</title>
    <link href="https://fonts.loli.net/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        /* App.css 内容 */
        ${appCssContent}
        
        /* 当前主题 CSS 内容 */
        ${themeCssContent}
        
        /* 动态主题变量 */
        ${dynamicThemeStyleBlock}

        /* 导出时隐藏的元素 */
        .editor-toolbar,
        .edit-popup,
        .rich-text-toolbar,
        .action-button,
        .delete-action-btn,
        .add-tag-button-container,
        .tag-actions-container,
        .delete-element-btn,
        .card-actions-container,
        .qr-code-link-input,
        .hamburger-menu,
        .action-button-text-with-icon,
        .drag-handle,
        .width-control-container,
        .react-resizable-handle,
        .delete-item-btn,
        .add-item-btn,
        .avatar-container:hover::after,
        [contenteditable]:hover { 
            display: none !important;
        }

        /* 保持卡片在编辑器中的实际位置 */
        main#profileCardContainer {
            width: 100% !important;
            max-width: 1080px !important;
            margin: 0 auto !important;
            padding: 48px 32px 32px 32px !important;
            box-sizing: border-box !important;
        }
        .app-grid-shell {
            width: 100% !important;
        }
        .layout {
            height: auto !important;
            display: grid !important;
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
            gap: 32px 24px !important;
            width: 100% !important;
        }
        .react-grid-item {
            position: relative !important;
            transform: none !important;
            top: auto !important;
            left: auto !important;
            width: auto !important;
            height: auto !important;
            margin: 0 !important;
        }
        .profile-card-span { grid-column: span 1 !important; }
        .about-me-card-span { grid-column: span 2 !important; }
        .oshi-card-span,
        .full-width-card-span { grid-column: span 3 !important; }

        .card-top-controls {
            display: none !important;
            min-height: 0 !important;
            margin: 0 !important;
        }

        .section-title-container {
            margin-top: 30px !important;
        }

        h2.section-title {
            border-bottom: 1px solid var(--theme-divider, var(--ui-border-default, rgba(0, 0, 0, 0.18))) !important;
            padding-bottom: var(--space-m) !important;
        }

        .page-footer {
            display: block !important;
            margin-top: 48px !important;
            padding-bottom: 32px !important;
            position: relative !important;
            z-index: 1 !important;
        }

        .sidebar-container,
        .hamburger-menu {
            display: none !important;
        }
        
        /* 静态元素样式 */
        [contenteditable] {
            cursor: default !important;
            border: none !important;
            background-color: transparent !important;
            outline: none !important;
        }
        
        /* 移除工具栏预留空间 */
        body { 
            padding-top: 0 !important; 
        }
        
        /* 确保头像不可点击 */
        .avatar-container {
            cursor: default !important;
        }
    </style>
</head>
<body data-theme="${currentThemeName}">
    <main id="profileCardContainer">
        ${exportContainer.innerHTML}
    </main>
</body>
</html>`;

    // 创建并触发下载
    try {
        const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = '扩列条.html';
        link.click();
        URL.revokeObjectURL(link.href);
        
        showNotification(t('notification.exportHtmlSuccess') || 'Export successful', 'success');
    } catch (error) {
        console.error('Failed to export HTML:', error);
        const t = await getTranslationFunction(locale);
        showNotification(t('notification.exportHtmlError') || 'Export failed', 'error');
    }
};


/**
 * 导出为图片文件
 * @param element 要导出的 HTML 元素
 * @param profileData 用户的个人资料数据
 * @param locale 当前语言
 * @param currentThemeName 当前选择的主题名称
 */
export const exportToImage = async (element: HTMLElement, profileData: ProfileData | null, locale: Locale, currentThemeName: Theme) => {
    const t = await getTranslationFunction(locale);
    if (!element || !profileData) return;

    const themeCssContent = await getThemeCssContent(currentThemeName);

    // 隐藏编辑器 UI 元素
    const elementsToHide = document.querySelectorAll(EDITOR_OVERLAY_SELECTORS);
    elementsToHide.forEach(el => (el as HTMLElement).style.display = 'none');
    
    // 读取 body 背景样式，供导出容器使用
    const bodyStyle = getComputedStyle(document.body);
    const backgroundColor = bodyStyle.backgroundColor;
    const backgroundImage = bodyStyle.backgroundImage;
    const backgroundSize = bodyStyle.backgroundSize;
    const backgroundPosition = bodyStyle.backgroundPosition;
    const backgroundRepeat = bodyStyle.backgroundRepeat;

    // 创建导出使用的离屏根节点
    const exportRoot = document.createElement('div');
    exportRoot.id = 'export-root';
    exportRoot.style.position = 'fixed';
    exportRoot.style.top = '0';
    exportRoot.style.left = '-2000px';
    exportRoot.style.width = '1080px';
    exportRoot.style.pointerEvents = 'none';
    exportRoot.style.zIndex = '-1';
    document.body.appendChild(exportRoot);

    // 将当前页面的自定义 CSS 变量复制到导出根节点，保证主题变量可用
    cloneRootCssVariables(exportRoot);

    // 注入基础样式与主题样式，确保导出时具备完整 CSS
    const baseStyle = document.createElement('style');
    baseStyle.textContent = appCssContent;
    exportRoot.appendChild(baseStyle);

    if (themeCssContent) {
        const themeStyle = document.createElement('style');
        themeStyle.textContent = themeCssContent;
        exportRoot.appendChild(themeStyle);
    }

    // 冻结动画与过渡，避免导出帧与视觉不同
    const freezeStyle = document.createElement('style');
    freezeStyle.textContent = `#export-root * { animation: none !important; transition: none !important; }`;
    exportRoot.appendChild(freezeStyle);

    // 桌面布局覆盖，保证移动端导出仍按桌面排版
    const desktopOverride = document.createElement('style');
    desktopOverride.textContent = `
        #export-root main#profileCardContainer {
            width: 1080px !important;
            max-width: 1080px !important;
            margin: 0 auto !important;
            padding: 48px 32px 32px 32px !important;
            height: auto !important;
        }
        /* 重置 react-grid-layout 为 CSS Grid 以消除留白 */
        #export-root .layout {
            height: auto !important;
            display: grid !important;
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
            gap: 32px 24px !important;
            width: 100% !important;
        }
        #export-root .react-grid-item {
            position: relative !important;
            transform: none !important;
            top: auto !important;
            left: auto !important;
            width: auto !important;
            height: auto !important;
            margin: 0 !important;
        }
        #export-root .profile-card-span { grid-column: span 1 !important; }
        #export-root .about-me-card-span { grid-column: span 2 !important; }
        #export-root .oshi-card-span,
        #export-root .full-width-card-span { grid-column: span 3 !important; }

        #export-root .sidebar-container,
        #export-root .hamburger-menu { display: none !important; }
    `;
    exportRoot.appendChild(desktopOverride);

    // 创建包裹层，复用页面背景，并容纳内容与赛博朋克扫描线
    const wrapper = document.createElement('div');
    wrapper.style.width = '1080px';
    wrapper.style.margin = '0 auto';
    wrapper.style.position = 'relative';
    wrapper.style.backgroundColor = backgroundColor;
    if (backgroundImage && backgroundImage !== 'none') {
        wrapper.style.backgroundImage = backgroundImage;
        wrapper.style.backgroundSize = backgroundSize;
        wrapper.style.backgroundPosition = backgroundPosition;
        wrapper.style.backgroundRepeat = backgroundRepeat;
    }
    // 保持可见，避免辉光、阴影被裁切
    wrapper.style.overflow = 'visible';

    // 克隆内容并移除编辑器控件
    const clonedElement = element.cloneNode(true) as HTMLElement;
    cloneRootCssVariables(clonedElement);
    clonedElement.style.width = '1080px';
    clonedElement.style.maxWidth = '1080px';
    clonedElement.style.margin = '0 auto';
    clonedElement.style.boxSizing = 'border-box';

    removeElementsBySelectors(clonedElement, EXPORT_HIDDEN_SELECTORS);
    cleanupContentEditableElements(clonedElement, false);
    setAvatarNonInteractive(clonedElement);

    wrapper.appendChild(clonedElement);

    // 赛博朋克专属扫描线覆盖
    if (currentThemeName === 'cyberpunk') {
        const scanline = document.createElement('div');
        scanline.style.position = 'absolute';
        scanline.style.top = '0';
        scanline.style.left = '0';
        scanline.style.width = '100%';
        scanline.style.height = '200%';
        scanline.style.pointerEvents = 'none';
        scanline.style.zIndex = '10';
        scanline.style.backgroundImage = 'linear-gradient(rgba(18,16,16,0) 50%, rgba(0,0,0,0.35) 50%), linear-gradient(90deg, rgba(252, 238, 10, 0.03), rgba(0, 240, 255, 0.02), rgba(255, 0, 170, 0.03))';
        scanline.style.backgroundSize = '100% 3px, 100% 100%';
        scanline.style.animation = 'scanline 12s linear infinite';
        wrapper.appendChild(scanline);
    }

    exportRoot.appendChild(wrapper);

    try {
        const canvas = await html2canvas(wrapper, {
            backgroundColor: null,
            scale: 3,
            useCORS: true,
            logging: false,
            width: 1080,
            windowWidth: 1080,
            scrollX: 0,
            scrollY: 0
        });

        const targetWidth = 1080;
        let finalCanvas = canvas;
        if (canvas.width < targetWidth) {
            const scale = targetWidth / canvas.width;
            const upscale = document.createElement('canvas');
            upscale.width = targetWidth;
            upscale.height = Math.round(canvas.height * scale);
            const ctx = upscale.getContext('2d');
            if (ctx) {
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(canvas, 0, 0, upscale.width, upscale.height);
                finalCanvas = upscale;
            }
        }

        const image = finalCanvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = image;
        link.download = '扩列条.png';
        link.click();

        showNotification(t('notification.exportImageSuccess') || 'Export successful', 'success');
    } catch (err) {
        console.error('Failed to export image:', err);
        showNotification(t('notification.exportImageError') || 'Export failed', 'error');
    } finally {
        // 移除离屏根节点
        exportRoot.remove();
        // 恢复隐藏的编辑器 UI
        elementsToHide.forEach(el => (el as HTMLElement).style.display = '');
    }
};

/**
 * 导出为配置文件 JSON
 * @param profileData 用户的个人资料数据
 * @param locale 当前语言
 */
export const exportConfig = async (profileData: ProfileData | null, locale: Locale) => {
    const t = await getTranslationFunction(locale);
    if (!profileData) {
        showNotification(t('notification.exportConfigError') || 'Export failed', 'error');
        return;
    }

    try {
        const stateJson = JSON.stringify(profileData, null, 2);
        const blob = new Blob([stateJson], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const filename = `profilecraft-config_${new Date().toISOString().slice(0, 10)}.json`;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
        
        showNotification(t('notification.exportConfigSuccess') || 'Configuration exported successfully', 'success');
    } catch (error) {
        console.error('Failed to export configuration:', error);
        showNotification(t('notification.exportConfigError') || 'Export failed', 'error');
    }
};

/**
 * 显示通知消息
 * @param message 通知消息内容
 * @param type 通知类型：success 或 error
 */
export const showNotification = (message: string, type: 'success' | 'error') => {
    if (!document.getElementById('profilecraft-export-notification-animation')) {
        const animationStyle = document.createElement('style');
        animationStyle.id = 'profilecraft-export-notification-animation';
        animationStyle.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(animationStyle);
    }

    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background-color: ${type === 'success' ? '#10b981' : '#ef4444'};
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        font-size: 14px;
        font-weight: 500;
        animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);
    
    // 3 秒后自动移除
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
};
