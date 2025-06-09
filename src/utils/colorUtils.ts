const getBrightness = (hexColor: string): number => {
    hexColor = hexColor.replace(/^#/, '');
    if (hexColor.length === 3) {
        hexColor = hexColor.split('').map(char => char + char).join('');
    }
    const r = parseInt(hexColor.substring(0, 2), 16);
    const g = parseInt(hexColor.substring(2, 4), 16);
    const b = parseInt(hexColor.substring(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000;
};

const lightenHexColor = (hex: string, percent: number): string => {
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) {
        hex = hex.split('').map(char => char + char).join('');
    }
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const newR = Math.min(255, Math.floor(r + (255 - r) * percent));
    const newG = Math.min(255, Math.floor(g + (255 - g) * percent));
    const newB = Math.min(255, Math.floor(b + (255 - b) * percent));
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
};

const darkenHexColor = (hex: string, percent: number): string => {
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) {
        hex = hex.split('').map(char => char + char).join('');
    }
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const newR = Math.max(0, Math.floor(r * (1 - percent)));
    const newG = Math.max(0, Math.floor(g * (1 - percent)));
    const newB = Math.max(0, Math.floor(b * (1 - percent)));
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
};

// Main function to apply theme colors to CSS variables
export const applyThemeColors = (accent: string) => {
    const root = document.documentElement;
    root.style.setProperty('--theme-accent', accent);
    
    const newPageBg = lightenHexColor(accent, 0.95);
    const newTagBg = lightenHexColor(accent, 0.8);
    const newTagBgAlt = lightenHexColor(accent, 0.5);
    const newTextStrong = darkenHexColor(accent, 0.4);
    const newDivider = lightenHexColor(accent, 0.2);
    const accentBrightness = getBrightness(accent);
    const buttonTextOnAccent = accentBrightness > 128 ? '#000000' : '#FFFFFF';
    const newTagHoverBg = lightenHexColor(accent, 0.65);
    const hoverBgColor = `rgba(${parseInt(accent.slice(1,3),16)}, ${parseInt(accent.slice(3,5),16)}, ${parseInt(accent.slice(5,7),16)}, 0.1)`;

    root.style.setProperty('--button-text-on-accent', buttonTextOnAccent);
    root.style.setProperty('--theme-bg-page', newPageBg);
    root.style.setProperty('--theme-tag-bg', newTagBg);
    root.style.setProperty('--theme-tag-bg-alt', newTagBgAlt);
    root.style.setProperty('--theme-text-strong', newTextStrong);
    root.style.setProperty('--theme-divider', newDivider);
    root.style.setProperty('--theme-tag-hover-bg', newTagHoverBg);
    root.style.setProperty('--hover-bg-color', hoverBgColor);
};