import React, { useEffect, useRef, useState } from 'react';
import { X, ImageUp, Trash2, RotateCcw, Palette, Image as ImageIcon, LayoutGrid, Type, Eye, Sparkles } from 'lucide-react';
import { useProfileDataCtx, useProfileActions } from '../context/ProfileContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from '../hooks/useTranslation';
import { useAppearanceActions } from '../hooks/useAppearance';
import { useThrottle } from '../hooks/useThrottle';
import { SegmentedControl, SwitchControl } from './ui/EditorControls';
import { APPEARANCE_LIMITS, CARD_COLOR_PRESETS, DEFAULT_APPEARANCE, FONT_OPTIONS, getAppearance } from '../utils/appearance';
import { compressImage, IMAGE_PRESETS } from '../utils/image';
import { showNotification } from '../utils/notify';
import type { AppearanceSettings, BackgroundType, BackgroundFit, CardShadow } from '../types/data';

interface CustomizePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type DeepPartialAppearance = { [K in keyof AppearanceSettings]?: Partial<AppearanceSettings[K]> };

interface StylePreset {
  key: string;
  swatch: string;
  value: DeepPartialAppearance;
}

// 一键风格：只覆盖背景 / 卡片 / 间距，不动显示开关
const STYLE_PRESETS: StylePreset[] = [
  { key: 'classic', swatch: '#FFFDF5', value: { background: DEFAULT_APPEARANCE.background, card: DEFAULT_APPEARANCE.card, layout: { gapX: 24, gapY: 32, padding: 24 } } },
  {
    key: 'glass',
    swatch: 'linear-gradient(135deg, #FFD6E7, #C9E4FF)',
    value: {
      background: { type: 'gradient', gradientFrom: '#FFD6E7', gradientTo: '#C9E4FF', gradientAngle: 135 },
      card: { bgColor: '#FFFFFF', opacity: 0.62, radius: 24, shadow: 'strong', border: false, textColor: '' },
      layout: { gapX: 20, gapY: 24, padding: 24 },
    },
  },
  {
    key: 'minimal',
    swatch: '#F4F4F5',
    value: {
      background: { type: 'color', color: '#F4F4F5' },
      card: { bgColor: '#FFFFFF', opacity: 1, radius: 8, shadow: 'none', border: true, textColor: '' },
      layout: { gapX: 12, gapY: 12, padding: 20 },
    },
  },
  {
    key: 'journal',
    swatch: '#F6EEDC',
    value: {
      background: { type: 'color', color: '#F6EEDC' },
      card: { bgColor: '#FFFBF2', opacity: 1, radius: 4, shadow: 'soft', border: true, textColor: '#5B4636' },
      layout: { gapX: 20, gapY: 24, padding: 26 },
    },
  },
  {
    key: 'night',
    swatch: 'linear-gradient(135deg, #1F2233, #3A2D4F)',
    value: {
      background: { type: 'gradient', gradientFrom: '#1F2233', gradientTo: '#3A2D4F', gradientAngle: 160 },
      card: { bgColor: '#2B2B36', opacity: 0.92, radius: 18, shadow: 'strong', border: false, textColor: '#ECECF1' },
      layout: { gapX: 20, gapY: 24, padding: 24 },
    },
  },
];

const GRADIENT_PRESETS: [string, string][] = [
  ['#FFF1C1', '#FFD6E7'],
  ['#FFD6E7', '#C9E4FF'],
  ['#D4F5E9', '#C9E4FF'],
  ['#E6DEFF', '#FFE3F1'],
  ['#FFE5D0', '#FFF6C9'],
  ['#1F2233', '#3A2D4F'],
];

// ---- 小型表单控件 ----

const Section: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode; onReset?: () => void; resetLabel?: string }> = ({ icon, title, children, onReset, resetLabel }) => (
  <section className="cz-section">
    <header className="cz-section-header">
      <span className="cz-section-title">{icon}{title}</span>
      {onReset && (
        <button type="button" className="cz-link-btn" onClick={onReset} title={resetLabel}>
          <RotateCcw size={12} />
        </button>
      )}
    </header>
    {children}
  </section>
);

const Slider: React.FC<{
  label: string;
  value: number;
  limits: { min: number; max: number; step: number };
  format?: (v: number) => string;
  onChange: (v: number) => void;
}> = ({ label, value, limits, format, onChange }) => (
  <label className="cz-field cz-slider">
    <span className="cz-field-row">
      <span>{label}</span>
      <output>{format ? format(value) : value}</output>
    </span>
    <input type="range" min={limits.min} max={limits.max} step={limits.step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
  </label>
);

// 分段选择与开关复用卡片设置面板里的同款控件，保持全站一致
function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; ariaLabel: string }) {
  return <SegmentedControl value={value} options={options} onChange={onChange} />;
}

const Toggle: React.FC<{ label: string; checked: boolean; onChange: (v: boolean) => void }> = ({ label, checked, onChange }) => (
  <div className="cz-toggle">
    <span>{label}</span>
    <SwitchControl label={label} checked={checked} onChange={onChange} />
  </div>
);

const ColorInput: React.FC<{ label: string; value: string; onChange: (v: string) => void }> = ({ label, value, onChange }) => (
  <label className="cz-color">
    <input type="color" value={value} onChange={(e) => onChange(e.target.value)} />
    <span>{label}</span>
  </label>
);

// ---- 主面板 ----

const CustomizePanel: React.FC<CustomizePanelProps> = ({ isOpen, onClose }) => {
  const { profileData } = useProfileDataCtx();
  const { updateProfileData } = useProfileActions();
  const { updateAppearance, resetAppearance } = useAppearanceActions();
  const { theme, setTheme, resolvedTheme, themeOptions } = useTheme();
  const { t } = useTranslation();
  const bgInputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const accentColor = profileData?.userSettings.accentColor || '#FFC300';
  const [displayAccent, setDisplayAccent] = useState(accentColor);

  useEffect(() => setDisplayAccent(accentColor), [accentColor]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    panelRef.current?.focus();
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  // 拖动取色器会高频触发，节流后再写入数据
  const throttledAccent = useThrottle((color: string) => {
    updateProfileData(prev => ({ ...prev, userSettings: { ...prev.userSettings, accentColor: color } }));
  }, 50);

  if (!isOpen || !profileData) return null;

  const appearance = getAppearance(profileData.userSettings);
  const { background: bg, card, layout, visibility } = appearance;
  const L = APPEARANCE_LIMITS;
  const themeLocksCards = !resolvedTheme.settings.isAccentColorEnabled;

  const applyPreset = (preset: StylePreset) => {
    (Object.keys(preset.value) as (keyof AppearanceSettings)[]).forEach(section => {
      updateAppearance(section, preset.value[section] as Partial<AppearanceSettings[typeof section]>);
    });
  };

  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setIsUploading(true);
    try {
      const image = await compressImage(file, IMAGE_PRESETS.background);
      updateAppearance('background', { type: 'image', image });
    } catch (error) {
      console.error('Background upload failed:', error);
      showNotification(t('notification.imageError'), 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const px = (v: number) => `${v}px`;

  return (
    <aside className="customize-panel" role="dialog" aria-label={t('customize.title')} ref={panelRef} tabIndex={-1}>
      <header className="cz-header">
        <h2>{t('customize.title')}</h2>
        <button type="button" className="cz-icon-btn" onClick={onClose} title={t('common.close')}>
          <X size={18} />
        </button>
      </header>

      <div className="cz-body">
        <Section icon={<Sparkles size={15} />} title={t('customize.presets')}>
          <div className="cz-preset-grid">
            {STYLE_PRESETS.map(preset => (
              <button key={preset.key} type="button" className="cz-preset" onClick={() => applyPreset(preset)}>
                <span className="cz-preset-swatch" style={{ background: preset.swatch }} />
                <span>{t(`customize.preset.${preset.key}`)}</span>
              </button>
            ))}
          </div>
        </Section>

        <Section icon={<Palette size={15} />} title={t('customize.theme')}>
          <div className="cz-chip-row">
            {themeOptions.map(opt => (
              <button key={opt.value} type="button" className={`cz-chip ${theme === opt.value ? 'is-active' : ''}`} onClick={() => setTheme(opt.value)}>
                {opt.label}
              </button>
            ))}
          </div>
          {resolvedTheme.settings.isAccentColorEnabled ? (
            <ColorInput
              label={`${t('toolbar.themeColor')} ${displayAccent.toUpperCase()}`}
              value={displayAccent}
              onChange={(color) => {
                setDisplayAccent(color);
                throttledAccent(color);
              }}
            />
          ) : (
            <p className="cz-hint">{t('customize.themeLocked')}</p>
          )}
        </Section>

        <Section icon={<ImageIcon size={15} />} title={t('customize.background')} onReset={() => resetAppearance('background')} resetLabel={t('customize.reset')}>
          <Segmented<BackgroundType>
            ariaLabel={t('customize.background')}
            value={bg.type}
            onChange={(type) => updateAppearance('background', { type })}
            options={[
              { value: 'theme', label: t('customize.bgTheme') },
              { value: 'color', label: t('customize.bgColor') },
              { value: 'gradient', label: t('customize.bgGradient') },
              { value: 'image', label: t('customize.bgImage') },
            ]}
          />

          {bg.type === 'color' && (
            <ColorInput label={bg.color.toUpperCase()} value={bg.color} onChange={(color) => updateAppearance('background', { color })} />
          )}

          {bg.type === 'gradient' && (
            <>
              <div className="pc-swatches">
                {GRADIENT_PRESETS.map(([from, to]) => (
                  <button
                    key={from + to}
                    type="button"
                    className={`pc-swatch ${bg.gradientFrom === from && bg.gradientTo === to ? 'is-active' : ''}`}
                    style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
                    onClick={() => updateAppearance('background', { gradientFrom: from, gradientTo: to })}
                    aria-label={`${from} → ${to}`}
                  />
                ))}
              </div>
              <div className="cz-inline">
                <ColorInput label={t('customize.gradientFrom')} value={bg.gradientFrom} onChange={(gradientFrom) => updateAppearance('background', { gradientFrom })} />
                <ColorInput label={t('customize.gradientTo')} value={bg.gradientTo} onChange={(gradientTo) => updateAppearance('background', { gradientTo })} />
              </div>
              <Slider label={t('customize.gradientAngle')} value={bg.gradientAngle} limits={L.gradientAngle} format={(v) => `${v}°`} onChange={(gradientAngle) => updateAppearance('background', { gradientAngle })} />
            </>
          )}

          {bg.type === 'image' && (
            <>
              <div className="cz-image-row">
                {bg.image ? (
                  <span className="cz-image-preview" style={{ backgroundImage: `url("${bg.image}")` }} />
                ) : (
                  <span className="cz-image-preview is-empty"><ImageIcon size={18} /></span>
                )}
                <div className="cz-image-actions">
                  <button type="button" className="cz-btn" onClick={() => bgInputRef.current?.click()} disabled={isUploading}>
                    <ImageUp size={14} /> {isUploading ? t('block.uploading') : bg.image ? t('customize.replaceImage') : t('customize.uploadImage')}
                  </button>
                  {bg.image && (
                    <button type="button" className="cz-btn is-ghost" onClick={() => updateAppearance('background', { image: '' })}>
                      <Trash2 size={14} /> {t('customize.removeImage')}
                    </button>
                  )}
                </div>
                <input ref={bgInputRef} type="file" accept="image/*" className="hidden-file-input" onChange={handleBgUpload} />
              </div>
              <Segmented<BackgroundFit>
                ariaLabel={t('customize.imageFit')}
                value={bg.imageFit}
                onChange={(imageFit) => updateAppearance('background', { imageFit })}
                options={[
                  { value: 'cover', label: t('customize.fitCover') },
                  { value: 'contain', label: t('customize.fitContain') },
                  { value: 'repeat', label: t('customize.fitRepeat') },
                ]}
              />
              <div className="cz-inline">
                <ColorInput label={t('customize.overlay')} value={bg.overlayColor} onChange={(overlayColor) => updateAppearance('background', { overlayColor })} />
                {bg.imageFit !== 'cover' && (
                  <ColorInput label={t('customize.fillColor')} value={bg.color} onChange={(color) => updateAppearance('background', { color })} />
                )}
              </div>
              <Slider label={t('customize.overlayOpacity')} value={bg.overlayOpacity} limits={L.overlayOpacity} format={(v) => `${Math.round(v * 100)}%`} onChange={(overlayOpacity) => updateAppearance('background', { overlayOpacity })} />
            </>
          )}
        </Section>

        <Section icon={<LayoutGrid size={15} />} title={t('customize.cards')} onReset={() => resetAppearance('card')} resetLabel={t('customize.reset')}>
          {themeLocksCards && <p className="cz-hint">{t('customize.themeLocksCards')}</p>}
          <p className="cz-hint">{t('customize.perCardHint')}</p>
          <span className="cz-label">{t('customize.cardColor')}</span>
          <div className="pc-swatches">
            <button type="button" className={`pc-swatch is-auto ${!card.bgColor ? 'is-active' : ''}`} onClick={() => updateAppearance('card', { bgColor: '' })} title={t('customize.followTheme')}>
              A
            </button>
            {CARD_COLOR_PRESETS.map(color => (
              <button
                key={color}
                type="button"
                className={`pc-swatch ${card.bgColor.toUpperCase() === color ? 'is-active' : ''}`}
                style={{ background: color }}
                onClick={() => updateAppearance('card', { bgColor: color })}
                aria-label={color}
              />
            ))}
            <label className="pc-swatch is-custom" title={t('card.customColor')}>
              <input type="color" value={card.bgColor || '#FFFFFF'} onChange={(e) => updateAppearance('card', { bgColor: e.target.value })} />
            </label>
          </div>
          <Slider label={t('customize.cardOpacity')} value={card.opacity} limits={L.opacity} format={(v) => `${Math.round(v * 100)}%`} onChange={(opacity) => updateAppearance('card', { opacity })} />
          <Slider label={t('customize.cardRadius')} value={card.radius} limits={L.radius} format={px} onChange={(radius) => updateAppearance('card', { radius })} />
          <span className="cz-label">{t('customize.cardShadow')}</span>
          <Segmented<CardShadow>
            ariaLabel={t('customize.cardShadow')}
            value={card.shadow}
            onChange={(shadow) => updateAppearance('card', { shadow })}
            options={[
              { value: 'none', label: t('customize.shadowNone') },
              { value: 'soft', label: t('customize.shadowSoft') },
              { value: 'strong', label: t('customize.shadowStrong') },
            ]}
          />
          <Toggle label={t('customize.cardBorder')} checked={card.border} onChange={(border) => updateAppearance('card', { border })} />
          <div className="cz-inline">
            <ColorInput label={card.textColor ? t('customize.textColor') : t('customize.textColorAuto')} value={card.textColor || '#333333'} onChange={(textColor) => updateAppearance('card', { textColor })} />
            {card.textColor && (
              <button type="button" className="cz-link-btn" onClick={() => updateAppearance('card', { textColor: '' })}>
                {t('customize.followTheme')}
              </button>
            )}
          </div>
        </Section>

        <Section icon={<Type size={15} />} title={t('customize.spacingText')} onReset={() => resetAppearance('layout')} resetLabel={t('customize.reset')}>
          <Slider label={t('customize.gapX')} value={layout.gapX} limits={L.gapX} format={px} onChange={(gapX) => updateAppearance('layout', { gapX })} />
          <Slider label={t('customize.gapY')} value={layout.gapY} limits={L.gapY} format={px} onChange={(gapY) => updateAppearance('layout', { gapY })} />
          <Slider label={t('customize.padding')} value={layout.padding} limits={L.padding} format={px} onChange={(padding) => updateAppearance('layout', { padding })} />
          <Slider label={t('customize.lineHeight')} value={layout.lineHeight} limits={L.lineHeight} format={(v) => v.toFixed(2)} onChange={(lineHeight) => updateAppearance('layout', { lineHeight })} />
          <Slider label={t('customize.fontScale')} value={layout.fontScale} limits={L.fontScale} format={(v) => `${Math.round(v * 100)}%`} onChange={(fontScale) => updateAppearance('layout', { fontScale })} />
          <label className="cz-field">
            <span className="cz-label">{t('customize.font')}</span>
            <select className="cz-select" value={layout.fontFamily} onChange={(e) => updateAppearance('layout', { fontFamily: e.target.value })}>
              {FONT_OPTIONS.map(font => (
                <option key={font.key || 'default'} value={font.key}>{t(`customize.fonts.${font.key || 'default'}`)}</option>
              ))}
            </select>
          </label>
        </Section>

        <Section icon={<Eye size={15} />} title={t('customize.visibility')}>
          <Toggle label={t('customize.showSubtitle')} checked={visibility.subtitle} onChange={(subtitle) => updateAppearance('visibility', { subtitle })} />
          <Toggle label={t('customize.showFooter')} checked={visibility.footer} onChange={(footer) => updateAppearance('visibility', { footer })} />
        </Section>

        <button type="button" className="cz-btn is-ghost cz-reset-all" onClick={() => resetAppearance()}>
          <RotateCcw size={14} /> {t('customize.resetAll')}
        </button>
      </div>
    </aside>
  );
};

export default CustomizePanel;
