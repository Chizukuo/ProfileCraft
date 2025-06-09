import appCss from '../styles/App.css?raw';

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
export const getThemeSettings = (): ThemeSettings => {
    const settings = { ...defaultSettings };
    
    // Regex to find the @theme-property declaration in a CSS comment block
    const match = appCss.match(/\/\*[\s\S]*?@theme-property\s+accent-color-enabled:\s*(true|false);[\s\S]*?\*\//);

    if (match && match[1]) {
        settings.isAccentColorEnabled = match[1] === 'true';
    }

    return settings;
};
