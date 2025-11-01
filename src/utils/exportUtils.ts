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

// 辅助函数：计算颜色亮度、提亮、加深 (保持不变)
const getBrightness = (hexColor: string): number => {
    hexColor = hexColor.replace(/^#/, '');
    if (hexColor.length === 3) hexColor = hexColor.split('').map(c => c + c).join('');
    const r = parseInt(hexColor.substring(0, 2), 16), g = parseInt(hexColor.substring(2, 4), 16), b = parseInt(hexColor.substring(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000;
};

const lightenHexColor = (hex: string, p: number): string => {
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    const r = parseInt(hex.substring(0, 2), 16), g = parseInt(hex.substring(2, 4), 16), b = parseInt(hex.substring(4, 6), 16);
    const newR = Math.min(255, Math.floor(r + (255 - r) * p)), newG = Math.min(255, Math.floor(g + (255 - g) * p)), newB = Math.min(255, Math.floor(b + (255 - b) * p));
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
};

const darkenHexColor = (hex: string, p: number): string => {
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    const r = parseInt(hex.substring(0, 2), 16), g = parseInt(hex.substring(2, 4), 16), b = parseInt(hex.substring(4, 6), 16);
    const newR = Math.max(0, Math.floor(r * (1 - p))), newG = Math.max(0, Math.floor(g * (1 - p))), newB = Math.max(0, Math.floor(b * (1 - p)));
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
};

// 此函数在图像导出时用于克隆的文档，确保主题颜色正确应用
function applyThemeColorsToElement(element: HTMLElement, accent: string) {
    element.style.setProperty('--theme-accent', accent);
    element.style.setProperty('--theme-bg-page', lightenHexColor(accent, 0.95));
    element.style.setProperty('--theme-tag-bg', lightenHexColor(accent, 0.8));
    element.style.setProperty('--theme-tag-bg-alt', lightenHexColor(accent, 0.5));
    element.style.setProperty('--theme-text-strong', darkenHexColor(accent, 0.4));
    element.style.setProperty('--theme-divider', lightenHexColor(accent, 0.2));
    element.style.setProperty('--button-text-on-accent', getBrightness(accent) > 128 ? '#000' : '#FFF');
}


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
                console.warn(`无法获取主题 CSS: ${response.statusText}`);
            }
        } catch (error) {
            console.error('获取主题 CSS 时出错:', error);
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
        const poweredByLink = " | Powered by <a href='https://chizukuo.github.io/ProfileCraft/' target='_blank' rel='noopener noreferrer' style='color: var(--theme-accent); text-decoration: none;'>ProfileCraft</a>";
        footerP.innerHTML += poweredByLink;
    }

    // 构建最终的 HTML 文件
    const fullHtml = `<!DOCTYPE html>
<html lang="zh-CN">
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
        console.error('导出 HTML 失败:', error);
        const t = await getTranslationFunction(locale);
        showNotification(t('notification.exportHtmlError') || 'Export failed', 'error');
    }
};


/**
 * 导出为图片文件
 * @param element 要导出的 HTML 元素
 * @param profileData 用户的个人资料数据
 * @param locale 当前语言
 */
export const exportToImage = async (element: HTMLElement, profileData: ProfileData | null, locale: Locale) => {
    const t = await getTranslationFunction(locale);
    if (!element || !profileData) return;

    // 隐藏编辑器 UI 元素
    const elementsToHide = document.querySelectorAll('.editor-toolbar, .edit-popup, .rich-text-toolbar');
    elementsToHide.forEach(el => (el as HTMLElement).style.display = 'none');
    
    const pageBgColor = getComputedStyle(document.documentElement).getPropertyValue('--theme-bg-page').trim();

    html2canvas(element, {
        backgroundColor: pageBgColor,
        scale: 3,
        useCORS: true,
        logging: false,
        onclone: (clonedDoc: Document) => {
            // 在克隆的文档中应用主题颜色
            const clonedRoot = clonedDoc.documentElement;
            applyThemeColorsToElement(clonedRoot, profileData.userSettings.accentColor);
            
            // 移除编辑器控件和交互元素，但保留内容样式
            const selectorsToRemove = [
                '.action-button',           // 删除按钮
                '.delete-action-btn',       // 删除按钮
                '.add-tag-button-container',// 添加标签按钮
                '.tag-actions-container',   // 标签操作容器
                '.delete-element-btn',      // 删除元素按钮
                '.card-actions-container',  // 卡片操作容器
                '.qr-code-link-input',      // 二维码链接输入框
                '.edit-popup',              // 编辑弹窗
                '.rich-text-toolbar',       // 富文本工具栏
                '.qr-code-wrapper .text-sm', // 二维码下方的提示文本
                '.action-button-text-with-icon' 
            ];
            
            selectorsToRemove.forEach(selector => {
                clonedDoc.querySelectorAll(selector).forEach((el: Element) => el.remove());
            });
            
            // 移除头像容器的 hover 提示
            clonedDoc.querySelectorAll('.avatar-container').forEach((el: Element) => {
                (el as HTMLElement).style.setProperty('cursor', 'default');
            });
            
            // 移除所有 contenteditable 属性
            clonedDoc.querySelectorAll('[contenteditable]').forEach((el: Element) => {
                el.removeAttribute('contenteditable');
            });
        }
    }).then((canvas: HTMLCanvasElement) => {
        // 创建并触发下载
        const image = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = image;
        link.download = '扩列条.png';
        link.click();
        
        // 显示成功提示
        showNotification(t('notification.exportImageSuccess') || 'Export successful', 'success');
    }).catch(async (err: Error) => {
        console.error("导出图片失败:", err);
        const t = await getTranslationFunction(locale);
        showNotification(t('notification.exportImageError') || 'Export failed', 'error');
    }).finally(() => {
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
