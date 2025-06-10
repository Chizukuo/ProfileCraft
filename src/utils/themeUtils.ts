import appCss from '../styles/App.css?raw';
// 通过 manifest 获取主题设置
import themesManifest from '../config/themes.json';

export interface ThemeSettings {
    isAccentColorEnabled: boolean;
}

// Default settings in case the declaration is not found
const defaultSettings: ThemeSettings = {
    isAccentColorEnabled: true,
};

/**
 * Parses the theme declaration comment from the main CSS file (App.css).
 * @returns {ThemeSettings} The parsed theme settings.
 */
export const getThemeSettings = (themeKey: string = 'default'): ThemeSettings => {
    // 这里可以根据 manifest 进一步扩展主题属性
    if (themesManifest[themeKey] && typeof themesManifest[themeKey].isAccentColorEnabled !== 'undefined') {
        return { isAccentColorEnabled: !!themesManifest[themeKey].isAccentColorEnabled };
    }
    if (themeKey === 'default') {
        return { isAccentColorEnabled: true };
    }
    return { ...defaultSettings };
};
