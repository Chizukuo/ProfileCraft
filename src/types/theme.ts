export interface ThemePreview {
  primary: string;
  secondary: string;
  surface: string;
}

export interface ThemeSettings {
  isAccentColorEnabled: boolean;
}

export interface ThemeManifestItem {
  name: string;
  path: string;
  colorScheme?: 'light' | 'dark';
  description?: string;
  preview?: ThemePreview;
  settings?: Partial<ThemeSettings>;
  isAccentColorEnabled?: boolean;
}

export type ThemeManifest = Record<string, ThemeManifestItem>;

export interface ResolvedTheme extends ThemeManifestItem {
  key: string;
  colorScheme: 'light' | 'dark';
  settings: ThemeSettings;
  preview: ThemePreview;
}

export interface ThemeOption {
  value: string;
  label: string;
  description: string;
  preview: ThemePreview;
}