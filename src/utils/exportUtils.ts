import html2canvas from 'html2canvas';
import { ProfileData } from '../types/data';
import themesManifest from '../config/themes.json'; // Import themes manifest

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
 * 导出为 HTML 文件。
 * 此函数现在将当前主题的CSS和App.css内容直接嵌入到HTML中，并移除编辑器控件。
 * @param profileData 用户的个人资料数据。
 * @param currentThemeName 当前选择的主题名称。
 */
export const exportToHtml = async (profileData: ProfileData, currentThemeName: Theme) => {
    const container = document.getElementById('profileCardContainer');
    if (!container) return;

    // 获取当前主题的CSS文件路径
    const themeInfo = themesManifest[currentThemeName];
    const themeCssPath = themeInfo ? themeInfo.path : ''; // e.g., '/themes/cyberpunk.css'

    let themeCssContent = '';
    if (themeCssPath) {
        try {
            // 从公共文件夹获取主题CSS内容
            const response = await fetch(themeCssPath);
            if (response.ok) {
                themeCssContent = await response.text();
            } else {
                console.error(`Failed to fetch theme CSS: ${response.statusText}`);
            }
        } catch (error) {
            console.error('Error fetching theme CSS:', error);
        }
    }

    // 动态生成主题颜色相关的CSS变量 (从当前计算样式获取)
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
    }
    `;

    // 克隆并清理HTML内容
    const exportContainer = container.cloneNode(true) as HTMLElement;

    // 移除所有编辑器相关的控件和交互元素
    const elementsToRemoveSelectors = [
        '.action-button',
        '.add-tag-button-container',
        '.tag-actions-container',
        '.delete-element-btn',
        '.action-button-text-with-icon', // 移除此行，因为它不应该被移除
        '.card-actions-container',
        '.edit-popup',
        '.qr-code-link-input',
        '.rich-text-toolbar',
        '.profile-info-text [contenteditable]:hover::after', // 移除编辑提示
        '.avatar-container:hover::after' // 移除头像更换提示
    ];
    elementsToRemoveSelectors.forEach(selector => {
        exportContainer.querySelectorAll(selector).forEach(el => el.remove());
    });

    // 移除 contenteditable 属性，并清理编辑时的视觉样式
    exportContainer.querySelectorAll('[contenteditable]').forEach(el => {
        el.removeAttribute('contenteditable');
        (el as HTMLElement).style.backgroundColor = 'transparent'; // 移除编辑时的背景色
        (el as HTMLElement).style.border = 'none'; // 移除编辑时的边框
        // 移除之前强制设为0的padding和margin，让其回归原有布局
        (el as HTMLElement).style.padding = ''; 
        (el as HTMLElement).style.margin = ''; 
    });
    
    // 确保 QR 码下方的提示文本在导出时显示为静态文本（如果存在）
    const qrCodeWrapper = exportContainer.querySelector('.qr-code-wrapper');
    if (qrCodeWrapper) {
        qrCodeWrapper.querySelectorAll('p').forEach(p => {
            if (p.classList.contains('text-sm')) {
                p.remove();
            }
        });
    }

    // 更新页脚信息 - 保持为英文 "Powered by ProfileCraft"
    const footerP = exportContainer.querySelector('.page-footer p');
    if (footerP) {
        const poweredByLink = " | Powered by <a href='https://chizukuo.github.io/ProfileCraft/' target='_blank' rel='noopener noreferrer' style='color: var(--theme-accent); text-decoration: none;'>ProfileCraft</a>";
        footerP.innerHTML += poweredByLink;
    }

    // 构建最终的HTML文件
    const fullHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>导出的扩列条</title>
    <link href="https://fonts.loli.net/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        /* App.css content */
        ${appCssContent}
        /* Current theme CSS content */
        ${themeCssContent}
        /* Dynamic theme variables (override if needed) */
        ${dynamicThemeStyleBlock}

        /* 导出时隐藏特定的UI元素 */
        .editor-toolbar, .edit-popup, .rich-text-toolbar,
        .action-button, .add-tag-button-container, .tag-actions-container,
        .delete-element-btn, .card-actions-container,
        .qr-code-link-input, .avatar-container:hover::after,
        /* 移除 contenteditable 的 hover 效果 */
        [contenteditable]:hover { 
            display: none !important;
        }
        /* 强制 contenteditable 元素变为静态，仅移除交互样式 */
        [contenteditable] {
            cursor: default !important;
            border: none !important;
            background-color: transparent !important;
            outline: none !important;
            /* 允许其原有的 padding/margin 生效，不再强制设为0 */
        }
        /* 确保页面主体没有多余的上边距，因为它在原应用中是为固定工具栏预留的 */
        body { padding-top: 0 !important; }
    </style>
</head>
<body>
    <main id="profileCardContainer">
        ${exportContainer.innerHTML}
    </main>
</body>
</html>`;

    // 创建并触发下载
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = '扩列条.html';
    link.click();
    URL.revokeObjectURL(link.href);
};


// 导出为图片文件 (保持不变，但修改了 alert 消息)
export const exportToImage = (element: HTMLElement, profileData: ProfileData | null) => {
    if (!element || !profileData) return;

    // 隐藏编辑器UI
    const elementsToHide = document.querySelectorAll('.editor-toolbar, .edit-popup, .rich-text-toolbar');
    elementsToHide.forEach(el => (el as HTMLElement).style.display = 'none');
    
    const pageBgColor = getComputedStyle(document.documentElement).getPropertyValue('--theme-bg-page').trim();

    html2canvas(element, {
        backgroundColor: pageBgColor,
        scale: 3,
        useCORS: true,
        logging: true,
        onclone: (clonedDoc) => {
            // 在克隆的文档中应用主题并移除不必要的元素
            const clonedRoot = clonedDoc.documentElement;
            applyThemeColorsToElement(clonedRoot, profileData.userSettings.accentColor);
            // 修正：不再移除 .action-button-text-with-icon，因为它包含应导出的边框样式
            clonedDoc.querySelectorAll('.action-button, .add-tag-button-container, .tag-actions-container, .delete-element-btn, .card-actions-container, .qr-code-wrapper p, .avatar-container:hover::after, .edit-popup, .qr-code-link-input, .rich-text-toolbar').forEach(el => el.remove());
        }
    }).then(canvas => {
        // 创建并触发下载
        const image = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = image;
        link.download = '扩列条.png';
        link.click();
    }).catch(err => {
        console.error("导出图片失败:", err);
        // 使用自定义消息框替代 alert()
        const messageBox = document.createElement('div');
        messageBox.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 9999; text-align: center;
        `;
        messageBox.innerHTML = `
            <p>导出图片失败，请查看控制台获取更多信息。</p>
            <button onclick="this.parentNode.remove()" style="margin-top: 10px; padding: 8px 16px; border: none; border-radius: 4px; background-color: #007bff; color: white; cursor: pointer;">确定</button>
        `;
        document.body.appendChild(messageBox);
    }).finally(() => {
        // 恢复隐藏的编辑器UI
        elementsToHide.forEach(el => (el as HTMLElement).style.display = '');
    });
};
