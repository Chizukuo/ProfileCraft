import themesManifest from '../config/themes.json';
import type { ResolvedTheme, ThemeManifest, ThemeOption, ThemePreview, ThemeSettings } from '../types/theme';

const manifest = themesManifest as ThemeManifest;

const defaultPreview: ThemePreview = {
    primary: '#FFC300',
    secondary: '#8B4513',
    surface: '#FFFDF5'
};

const defaultSettings: ThemeSettings = {
    isAccentColorEnabled: true
};

const fallbackThemeKey = 'default';

export type ThemeKey = keyof typeof themesManifest;

export const themeKeys = Object.keys(manifest) as ThemeKey[];

export const resolveTheme = (themeKey: string = fallbackThemeKey): ResolvedTheme => {
    const key = themeKey in manifest ? themeKey : fallbackThemeKey;
    const theme = manifest[key] ?? manifest[fallbackThemeKey];

    return {
        ...theme,
        key,
        colorScheme: theme.colorScheme ?? 'light',
        preview: {
            ...defaultPreview,
            ...theme.preview
        },
        settings: {
            ...defaultSettings,
            isAccentColorEnabled: theme.settings?.isAccentColorEnabled ?? theme.isAccentColorEnabled ?? defaultSettings.isAccentColorEnabled
        }
    };
};

export const getThemeSettings = (themeKey: string = fallbackThemeKey): ThemeSettings => {
    return resolveTheme(themeKey).settings;
};

export const getThemeOptions = (): ThemeOption[] => {
    return themeKeys.map((key) => {
        const theme = resolveTheme(key);
        return {
            value: theme.key,
            label: theme.name,
            description: theme.description ?? '',
            preview: theme.preview
        };
    });
};

export const getThemeCssPath = (themeKey: string = fallbackThemeKey) => {
    return resolveTheme(themeKey).path ?? '';
};

export const isKnownTheme = (themeKey: string): themeKey is ThemeKey => {
    return themeKey in manifest;
};