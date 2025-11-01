import html2canvas from 'html2canvas';
import { ProfileData } from '../types/data';
import themesManifest from '../config/themes.json'; // Import themes manifest
import { loadTranslations, createT } from './i18n.ts';
import { Locale } from '../context/LocaleContext';

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

// Define Theme type if needed (adjust according to your JSON structure)
export type Theme = keyof typeof themesManifest; // Export Theme type
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

    // 获取当前主题的 CSS 文件路径
    const themeInfo = themesManifest[currentThemeName];
    const themeCssPath = themeInfo ? themeInfo.path : '';

    let themeCssContent = '';
    if (themeCssPath) {
        try {
            const response = await fetch(themeCssPath);
            if (response.ok) {
                themeCssContent = await response.text();
            } else {
                console.warn(`Failed to fetch theme CSS: ${response.statusText}`);
            }
        } catch (error) {
            console.error('Error fetching theme CSS:', error);
        }
    }

    // 动态生成主题颜色相关的 CSS 变量
    const accent = profileData.userSettings.accentColor;
    const computedStyle = getComputedStyle(document.documentElement);
    const getCssVar = (name: string) => computedStyle.getPropertyValue(name).trim();

    // 构建动态主题变量样式块
    const dynamicThemeStyleBlock = `
    :root {
        --theme-accent: ${accent};
        --theme-bg-page: ${getCssVar('--theme-bg-page')};
        --theme-tag-bg: ${getCssVar('--theme-tag-bg')};
        --theme-tag-bg-alt: ${getCssVar('--theme-tag-bg-alt')};
        --theme-text-strong: ${getCssVar('--theme-text-strong')};
        --theme-divider: ${getCssVar('--theme-divider')};
        --button-text-on-accent: ${getCssVar('--button-text-on-accent')};
        --qr-code-fg-color: ${getCssVar('--qr-code-fg-color')};
    }
    `;

    // 克隆并清理 HTML 内容
    const exportContainer = container.cloneNode(true) as HTMLElement;

    // 移除所有编辑器相关的控件和交互元素
    const elementsToRemoveSelectors = [
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
        '.hamburger-menu',
        '.action-button-text-with-icon'
    ];
    
    elementsToRemoveSelectors.forEach(selector => {
        exportContainer.querySelectorAll(selector).forEach((el: Element) => el.remove());
    });

    // 移除 contenteditable 属性，并清理编辑时的视觉样式
    exportContainer.querySelectorAll('[contenteditable]').forEach((el: Element) => {
        el.removeAttribute('contenteditable');
        const htmlEl = el as HTMLElement;
        htmlEl.style.backgroundColor = 'transparent';
        htmlEl.style.border = 'none';
        htmlEl.style.cursor = 'default';
        htmlEl.style.padding = '';
        htmlEl.style.margin = '';
    });
    
    // 移除头像的 hover 提示
    exportContainer.querySelectorAll('.avatar-container').forEach((el: Element) => {
        (el as HTMLElement).style.cursor = 'default';
    });

    // 更新页脚信息
    const footerP = exportContainer.querySelector('.page-footer p');
    if (footerP) {
        const poweredByLink = " | Powered by <a href='https://tools.chizunet.cc/' target='_blank' rel='noopener noreferrer' style='color: var(--theme-accent); text-decoration: none;'>ProfileCraft</a>";
        footerP.innerHTML += poweredByLink;
    }

    // 构建最终的 HTML 文件
    const fullHtml = `<!DOCTYPE html>
<html lang="${locale}" data-locale="${locale}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="使用 ProfileCraft 创建的个人扩列条">
    <title>${profileData.userSettings.mainTitle.replace(/<[^>]*>/g, '')} - 扩列条</title>
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
        .avatar-container:hover::after,
        [contenteditable]:hover { 
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
<body>
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

    // 获取当前主题 CSS 内容，确保导出时完整载入
    const themeInfo = themesManifest[currentThemeName];
    const themeCssPath = themeInfo?.path || '';
    let themeCssContent = '';
    if (themeCssPath) {
        try {
            const response = await fetch(themeCssPath);
            if (response.ok) {
                themeCssContent = await response.text();
            } else {
                console.warn(`Failed to fetch theme CSS: ${response.statusText}`);
            }
        } catch (error) {
            console.error('Error fetching theme CSS:', error);
        }
    }

    // 隐藏编辑器 UI 元素
    const elementsToHide = document.querySelectorAll('.editor-toolbar, .edit-popup, .rich-text-toolbar');
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
            padding: 48px 32px !important;
        }
        #export-root .grid-container {
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
            gap: var(--space-l, 24px) !important;
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
    // 复制自定义变量到克隆节点，确保局部引用也能解析
    cloneRootCssVariables(clonedElement);
    clonedElement.style.width = '1080px';
    clonedElement.style.maxWidth = '1080px';
    clonedElement.style.margin = '0 auto';
    clonedElement.style.boxSizing = 'border-box';

    const selectorsToRemove = [
        '.action-button',
        '.delete-action-btn',
        '.add-tag-button-container',
        '.tag-actions-container',
        '.delete-element-btn',
        '.card-actions-container',
        '.qr-code-link-input',
        '.edit-popup',
        '.rich-text-toolbar',
        '.qr-code-wrapper .text-sm',
        '.action-button-text-with-icon',
        '.sidebar-container',
        '.hamburger-menu'
    ];
    selectorsToRemove.forEach(selector => {
        clonedElement.querySelectorAll(selector).forEach((el: Element) => el.remove());
    });

    clonedElement.querySelectorAll('[contenteditable]').forEach((el: Element) => {
        el.removeAttribute('contenteditable');
    });

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

    html2canvas(wrapper, {
        backgroundColor: null as any,
        scale: 3,
        useCORS: true,
        logging: false,
        width: 1080,
        windowWidth: 1080,
        scrollX: 0,
        scrollY: 0
    }).then((canvas: HTMLCanvasElement) => {
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
    }).catch(async (err: Error) => {
        console.error("Failed to export image:", err);
        const t = await getTranslationFunction(locale);
        showNotification(t('notification.exportImageError') || 'Export failed', 'error');
    }).finally(() => {
        // 移除离屏根节点
        exportRoot.remove();
        // 恢复隐藏的编辑器 UI
        elementsToHide.forEach(el => (el as HTMLElement).style.display = '');
    });
};

/**
 * 显示通知消息
 * @param message 通知消息内容
 * @param type 通知类型：success 或 error
 */
const showNotification = (message: string, type: 'success' | 'error') => {
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
    
    // 添加动画样式
    const style = document.createElement('style');
    style.textContent = `
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
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // 3 秒后自动移除
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            notification.remove();
            style.remove();
        }, 300);
    }, 3000);
};
