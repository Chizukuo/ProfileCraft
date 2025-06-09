import html2canvas from 'html2canvas';
import { ProfileData } from '../types/data';
// 直接导入CSS文件作为原始文本字符串
import appCss from '../styles/App.css?raw';

// 辅助函数：计算颜色亮度、提亮、加深
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
 * 此函数现在使用Vite的`?raw`导入功能，在构建时直接包含App.css内容。
 * @param profileData 用户的个人资料数据。
 */
export const exportToHtml = (profileData: ProfileData) => {
    const container = document.getElementById('profileCardContainer');
    if (!container) return;

    // 动态生成主题颜色相关的CSS变量
    const accent = profileData.userSettings.accentColor;
    const computedStyle = getComputedStyle(document.documentElement);
    const getCssVar = (name: string) => computedStyle.getPropertyValue(name).trim();
    const themeStyleBlock = `
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

    // 定义用于覆盖编辑器UI和交互效果的CSS
    const overrideCss = `
        /* 隐藏所有编辑器特有的UI元素 */
        .editor-toolbar, .action-button, .delete-action-btn, .action-button-text-with-icon,
        .add-tag-button-container, .rich-text-toolbar, .modal-overlay,
        .add-tag-input, .qr-code-link-input, .qr-code-wrapper p,
        .avatar-container::after {
            display: none !important;
        }
    `;

    // 克隆并清理HTML内容
    const exportContainer = container.cloneNode(true) as HTMLElement;
    const footerP = exportContainer.querySelector('.page-footer p');
    if (footerP) {
        const poweredByLink = " | Powered by <a href='https://chizukuo.github.io/ProfileCraft/' target='_blank' rel='noopener noreferrer' style='color: var(--theme-accent); text-decoration: none;'>ProfileCraft</a>";
        footerP.innerHTML += poweredByLink;
    }
    
    // 构建最终的HTML文件
    const consoleArtScript = `
<script>
    try {
        const accentColor = '${accent}';
        const styles = [
            \`color: \${accentColor}; font-size: 1.2em; font-weight: bold;\`,
            'color: initial; font-size: 1em; font-weight: normal;'
        ];
        console.log(
            '%cCrafted with ♥ by ProfileCraft %c\\nhttps://github.com/chizukuo/ProfileCraft',
            styles[0],
            styles[1]
        );
    } catch (e) {
        // 在某些环境下 console 可能不可用，静默失败
    }
<\/script>
`;
    
    // 构建最终的HTML文件
    const fullHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>导出的扩列条</title>
    <link href="https://fonts.loli.net/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        ${themeStyleBlock}
        ${appCss}
        ${overrideCss}
    </style>
</head>
<body>
    <main id="profileCardContainer">
        ${exportContainer.innerHTML}
    </main>
    ${consoleArtScript}
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


// 导出为图片文件 (保持不变)
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
            clonedDoc.querySelectorAll('.action-button, .add-tag-button-container, .tag-actions-container, .delete-element-btn, .action-button-text-with-icon, .card-actions-container, .qr-code-wrapper p, .avatar-container:hover::after, .edit-popup, .qr-code-link-input, .rich-text-toolbar').forEach(el => el.remove());
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
        alert("导出图片失败，请查看控制台获取更多信息。");
    }).finally(() => {
        // 恢复隐藏的编辑器UI
        elementsToHide.forEach(el => (el as HTMLElement).style.display = '');
    });
};
