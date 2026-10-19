# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this is

ProfileCraft (芝士扩列条编辑器) is a client-only React SPA for building "扩列条" (social intro cards). There is no backend: all state lives in the browser's localStorage. Live at https://tools.chizunet.cc/ (behind Cloudflare).

Stack: React 19, Vite 8 (Rolldown), TypeScript 5 (strict), react-grid-layout 1.x, DOMPurify, html2canvas, qrcode.react, lucide-react. Styling is plain CSS with custom properties (no CSS modules, no Tailwind, even though some class names look like Tailwind utilities).

## Commands

```bash
npm install
npm run dev          # http://localhost:5173 (binds 0.0.0.0)
npm run build        # dist/  (does NOT type-check)
npx tsc --noEmit     # type-check; run it separately, the build won't catch type errors
npm run lint         # ESLint 8 legacy config (.eslintrc.cjs), --max-warnings 0
npm run preview
```

There is no test runner and no test files. Verify changes with `tsc`, `lint` and `build`, then by running the app. The dev server exposes source modules, so in-page scripts can `await import('/src/utils/exportUtils.ts')` to exercise exports without downloading files.

## Layout

```
src/
  main.tsx                 ErrorBoundary > LocaleProvider > ProfileProvider > ThemeProvider > EditorUIProvider > App
  components/
    App.tsx                loading screen, grid, footer; applies page background / web font; prefetches lazy chunks + all locales
    Card.tsx               card chrome (⚙ settings popover, × delete, drag handle) + ELEMENT_RENDERERS strategy map
    Navigation.tsx         floating dock (add card, AI, customize, preview, more: export/import/language/guide/reset)
    PreviewBar.tsx         replaces the dock while previewing (customize, export, exit)
    CustomizePanel.tsx     外观定制 drawer: presets, theme, background, card style, spacing/text, visibility
    AIChatPanel.tsx        AI interview UI
    blocks/                one component per CardElement type, all wrapped in BlockShell
    ui/                    EditorControls (shared control kit), EditableText, Modal, ConfirmDialog, Tag, LoadingScreen, UndoToast, SaveErrorBanner, GuideHint
  context/                 ProfileContext (split data/actions), EditorUIContext (preview + customize drawer), ThemeContext, LocaleContext
  hooks/                   useProfileData (load/normalize/save/undo history), useElementActions, useGridLayout, useHeightSync, useAppearance, useDismissable, ...
  utils/
    data.ts                default profile + CARD_TEMPLATES + ELEMENT_TEMPLATES (i18n builders)
    profileSchema.ts       normalizeProfileData / normalizeCards / fixCardLayouts: the single gate for incoming data
    appearance.ts          appearance defaults, resolveAppearance, CSS-variable + body-background mapping, fonts,
                           STYLE_PRESETS / applyStylePreset, ACCENT_PRESETS, CARD_COLOR_NAMES
    image.ts               compressImage + IMAGE_PRESETS (every uploaded image goes through this)
    storage.ts             try/catch wrappers around localStorage
    keyboard.ts            isSubmitEnter: Enter that ignores IME composition
    notify.ts              showNotification DOM toast (no React, cheap to import)
    aiProfile.ts           provider adapters, system prompt, tool schema, output normalization
    exportUtils.ts         HTML / PNG / JSON export
    importUtils.ts         ProfileCraft JSON + Tintro import
    gridLayout.ts          layoutSpan <-> width mapping, default layout
  config/                  themes.json, locales.json
  styles/App.css           main stylesheet (also inlined into exports); @imports styles/modules/*.css (editor-only)
public/locales/*.json      translations (fetched at runtime)
public/themes/*.css        non-default theme stylesheets
public/guide/              static user guide (index.html = 中文, en.html = English, img/d-*.svg abstract diagrams)
scripts/guide-diagrams.cjs generates public/guide/img/*.svg (npm run guide:diagrams)
```

## Data model and state

- Types are in `src/types/data.ts`. `ProfileData = { userSettings, cards[] }`, and each card has `elements: CardElement[]`.
- The homepage (`getDefaultProfileData`) intentionally showcases the site owner's own profile, including the original avatar and real QR link. Preserve those defaults. Only blank creation (`getBlankProfileData`) uses `MOCK_AVATAR` / `MOCK_QR`. A persistent editor-only “从空白开始” button sits below the homepage title (`ProfileHeader`) and uses `useStartBlank`; it is hidden in preview and exports. "从空白开始" (`useStartBlank` → `getBlankProfileData`) replaces the content with an identity card + about-me card and keeps the current theme/appearance; it is undoable (`'blank'`), so no confirm dialog.
- The footer default is `defaultFooter(name)`. When the main title changes and the footer still equals `defaultFooter(oldTitle)`, `ProfileHeader` updates it too.
- `TagData.placeholder`: sample tags in templates. They render dashed/grey in the editor, are hidden under `.pc-static`, turn into normal tags when edited, and are dropped when the user adds the first real tag to that group (the adders filter them out).
- `checklist.layout: 'compact'` lays options out inline; `scale.showMiddle` shows each row's optional `middle` label under the track.
- Element types (granular, freely combinable): `heading`, `paragraph`, `divider`, `avatar`, `infoList`, `qrCode`, `tagSection`, `tagSectionTwo` (the "oshi" block), `groupedTagSection`, `checklist`, `scale`, `imageGallery`. In `groupedTagSection`, `arcade`/`mobile` just mean "group 1"/"group 2"; the names are historical.
- Optional per-block fields (only stored when not the default, see `optional()` in `profileSchema`): `infoList.layout` (`'inline'` shows only the values joined by `|`, e.g. "05.20 | INTP | IP 成都"; labels stay in the data), and `tone` on `tagSection` / `tagSectionTwo` (`strong` / `outline` / `ng`, rendered as `.tone-*` on the tag container by `blocks/TagToneSetting.tsx`).
- `checklist` items are `{ text, checked }` (click the box to toggle; outlined versus filled boxes distinguish states without dimming the text). `scale` items are `{ left, right, value 0–100 }`; the track and dot are plain divs so they export, and a transparent `range` input with `editor-only` sits on top for dragging.
- `avatar` and `qrCode` blocks render the **global** `userSettings.avatarSrc` / `qrCodeLink` / `qrCodeImage`. There is one avatar and one QR per profile, so several such blocks show the same image. Hiding one means deleting the block.
- The old composite `profileInfo` (avatar + info + QR) exists only as an input format (`LegacyProfileInfoElement`). `profileSchema.expandElement` splits it into `avatar` + `infoList` + `qrCode`, honoring the old `appearance.visibility.avatar/qrCode` switches, which are then dropped. The AI still emits `profileInfo` and gets the same expansion.
- `userSettings.appearance` is optional and may be partial. It holds the 外观定制 settings. Always read it through `resolveAppearance` / `getAppearance`, which fill in defaults and clamp values. `visibility` only covers `subtitle` and `footer`. `userSettings.qrCodeImage` (a data URL) overrides the generated QR code. `card.style` holds the per-card background color, alignment and hidden-title flag.
- `layoutSpan` is a legacy CSS class that must stay in sync with `layout.w`: `profile-card-span` = 1 column, `about-me-card-span` = 2, `oshi-card-span`/`full-width-card-span` = 3. Use `getLayoutSpanFromWidth` / `getWidthFromLayoutSpan`.
- Block components update state by **position** (`cardIndex`, `elementIndex`); `Card` itself updates by card id. React keys for elements and tags are index-based.
- `ProfileContext` splits into two hooks:
  - `useProfileDataCtx()`: data, `saveError`, `pendingUndo`.
  - `useProfileActions()`: stable `updateProfileData`, `updateLayout`, `commitWithUndo`, `replaceProfileData`, `resetProfileData`, `undo`, `dismissUndo`.

  Prefer the actions-only hook in components that don't read data. `useProfile()` returns both.
- **User edits** go through `updateProfileData(prev => next)` with immutable updates. **Automatic layout corrections** (height sync, RGL compaction / drag results) must use `updateLayout`.
- **Destructive edits** (any delete) go through `commitWithUndo(updater, label)`. It pushes a whole-state snapshot onto an undo history (up to 30 steps) and shows `UndoToast`. Whole-document replacements (import, AI apply, reset) use `replaceProfileData(next, reason)`, which is built on the same mechanism. `Ctrl/⌘+Z` outside text fields calls `undo()` (see `App.tsx`). New `UndoLabel`s need an `undo.<label>` string.
- Because undo restores a snapshot, **any `updateProfileData` call clears the undo history**. Otherwise undoing an older delete would silently roll back the edits made after it. Consecutive deletes stay undoable step by step. This is also why automatic updates must not use `updateProfileData`: they would wipe the history right after a delete.
- Inside blocks, use `useElementActions(cardIndex, elementIndex)`: `update(patch)` for edits and `updateWithUndo(patch, label)` for deletes.
- `Card` is wrapped in `React.memo`, so the callbacks App passes to it (`onHeightChange(cardId, h)`, `onMove(cardId, dir)`) must stay stable.

## Persistence

localStorage keys:

| Key | Contents |
|-----|----------|
| `kuolieProfileData` | the whole `ProfileData` (debounced 500 ms save; flushed on `pagehide` / `visibilitychange`) |
| `profilecraft-theme` | theme key (`userSettings.theme` in the profile data wins on load) |
| `profilecraft-locale` | locale |
| `profilecraft-ai-config` | AI provider / API key / base URL / model |
| `profilecraft-guide-hint-dismissed` | first-visit guide hint was dismissed |
| `kuolieProfileData.unreadable` | raw copy of saved data that failed to load (see Gotchas) |

Gotchas:
- Everything that enters state goes through `utils/profileSchema.ts`: localStorage load, ProfileCraft/Tintro import, and AI output. That module drops unknown element types, fills required arrays and strings, converts legacy `profileInfo` fields into `items`, de-duplicates card ids, and repairs layouts. **Schema changes belong there**, and they must keep old exported JSON importable.
- Don't use `y: Infinity` to append a card at the bottom, because it turns into `null` in JSON. Leave `y` invalid (e.g. `NaN`) and run `fixCardLayouts`, which stacks such cards below the existing ones.
- Images are stored as data URLs inside `kuolieProfileData`, and localStorage holds only about 5 MB in total. Always pass uploads through `compressImage(file, IMAGE_PRESETS.x)`. When a save fails, `saveError` is set and `SaveErrorBanner` offers a backup download.
- If the saved data can't be loaded (parse error, unknown shape, exception during normalization), the raw string is first copied to `kuolieProfileData.unreadable` (`BACKUP_KEY`) before the defaults load and the auto-save overwrites the main key. `SaveErrorBanner` tells the user and offers it for download.
- `ErrorBoundary` offers "download backup" and "reset data", because otherwise a corrupt save would crash the app on every load.
- Wrap all localStorage access in `utils/storage.ts`, since it can throw in private mode or when site data is blocked.

## Interaction model (keep it uniform)

Every editable thing follows the same rules. The user guide (`public/guide/`) documents them, so update the guide when they change:

| Action | Pattern | Implementation |
|---|---|---|
| Edit text | click it | `EditableText` |
| Replace an image | click it | `.pc-replaceable` button + hidden file input |
| Settings for a card / block | ⚙ in the top-right (hover; tap → `:focus-within` on touch), includes Move up / Move down | `Popover` + `SettingRow`/`SegmentedControl`/`SwitchControl`/`MoveControls`; blocks get it for free from `BlockShell` |
| Delete | × next to ⚙; items (tags, images, info rows) have a small × in their corner | `ToolButton danger` / `.pc-item` + `.pc-item-delete`; always `commitWithUndo`, never a confirm dialog |
| Add | dashed "+ …" button | `AddButton` (`chip` / `block` / `tile`), `InlineAdder` for tags and checklist options. A new card fills the free space at the end of the last row if it fits, otherwise starts a new row, and is scrolled into view (`AddCardModal`) |
| Global vs. local style | dock "外观" vs. a card's ⚙ | `CustomizePanel` vs. `Card` settings |
| See the final result | dock "预览" → `.pc-static`, Esc exits | `EditorUIContext.isPreview` |

All of these are in `components/ui/EditorControls.tsx` and `styles/modules/editor-controls.css`. Don't invent one-off buttons or menus. The only confirm dialog left is "restore default template".

Every editor-only control carries the `editor-only` class. Preview mode puts `.pc-static` on `body`; the HTML export does the same, and the PNG export puts it on its wrapper. The `.pc-static` rules in `App.css` then hide the controls and normalize spacing, so **preview = export**. Editable text is read-only in preview (`contentEditable={!isPreview}`), and drag/resize are off.

## Editing model (EditableText)

`src/components/ui/EditableText.tsx` is an uncontrolled `contentEditable`:
- The external `html` prop is written into the DOM (sanitized with DOMPurify) only while the field is not focused.
- Changes are committed through `onUpdate` 400 ms after the last input, and immediately on blur. The latest `onUpdate` is always called through a ref.
- Stored HTML is the raw `innerHTML`; sanitization happens at render time. Anything that renders stored HTML some other way must sanitize it too.
- Bold / italic / underline / strikethrough use `document.execCommand`. Large text and the five text colors are class-based spans (`utils/richText.ts`: `pc-big`, `pc-c-accent|red|blue|green|purple`), styled in `App.css` so they export. Colors switch to lighter variants on dark cards (`.is-dark-card`, set by `Card` via `isDarkCard`) and dark themes, except explicitly light cards (`.is-light-card`). Formatting selection boundaries are split before applying/removing classes so unselected text keeps its formatting. Both the formatting toolbar and preview bar must fit a 390px viewport. Inline `styles.fontSize` is multiplied by `var(--pc-font-scale)`.
- Any Enter-to-submit input must use `isSubmitEnter(e)`. A plain `e.key === 'Enter'` check fires while Chinese/Japanese IME users confirm candidates.
- Plain text from inputs or the AI must go through `escapeHtml` (`utils/html.ts`) before it is stored, because stored text is HTML: an unescaped "GL<BG" renders as "GL". `InlineAdder` does this for you and also splits one entry like "A、B，C" into several (`splitItems`: 、，,；;｜| and newlines, never `/`), so its `onAdd` may be called more than once per submit.

## Adding a new element type

1. Add the interface to the `CardElement` union in `src/types/data.ts`.
2. Create `src/components/blocks/<Name>Block.tsx` taking `BlockProps<YourElement>`. Wrap the content in `<BlockShell title=… settings={…} {...shell}>`, and use `useElementActions` for updates.
3. Register it in `ELEMENT_RENDERERS` in `src/components/Card.tsx`.
4. Add a case to `expandElement` in `src/utils/profileSchema.ts`; otherwise the element is dropped on load and import.
5. Add a template to `ELEMENT_TEMPLATES` in `src/utils/data.ts` (`id`, `group`, `build(t)`), plus `blockTypes.<id>` and `blockTypes.<id>Desc` strings.
6. Add a case to `drawElement` in `components/ui/TemplateThumb.tsx` so its thumbnail is drawn from the real template data.
7. If the AI should produce it, update `TOOL_SCHEMA_DEF`, `normalizeElement` and the system prompt in `src/utils/aiProfile.ts`.
8. Build its controls from `EditorControls` and give them the `editor-only` class so preview/export hide them. Paragraph ↔ heading switching uses `useElementActions().replace` (`blocks/TextKindSetting.tsx`); reuse it if another pair of text blocks should be interchangeable. Styles that must appear in exports go in `App.css`; editor-only styles go in `styles/modules/`.
9. Add every new UI string to **all four** locale files.

## Grid and heights

- `react-grid-layout` Responsive: breakpoints `lg: 960 / md: 600 / sm: 0` map to `3 / 2 / 1` columns, `rowHeight` is 10, and only horizontal resize is enabled. Margins come from the appearance settings (`gapX`, `gapY`).
- Only the **desktop (`lg`) layout is persisted**. `onLayoutChange` writes back `allLayouts.lg`, including RGL's compaction results, and then re-sorts cards by `(y, x)`.
- At `md`/`sm`, drag and resize are disabled, because the derived 1–2 column layouts would otherwise squash the stored widths. On mobile, reordering goes through the card menu (`moveCard` in `useGridLayout`).
- `useHeightSync` measures each card's content with a `ResizeObserver`. It then sets every card that shares a stored `layout.y` to the tallest one's height. The row math uses the current `gapY`.

## Appearance customization (外观定制)

- `utils/appearance.ts` is the single source of truth:
  - `DEFAULT_APPEARANCE` reproduces the look from before customization existed.
  - `background.pattern` (`dots` / `stripes` / `grid`) is layered over color, gradient or theme backgrounds by `getPatternLayers`, built from linear gradients and an embedded SVG tile for dots (html2canvas only paints the first tile of a repeated radial gradient). The ink color depends on how dark the base is. The journal preset uses `grid`; the other presets reset it to `none`.
  - `STYLE_PRESETS` (classic / glass / minimal / journal / night) and `applyStylePreset(current, key)` are shared by `CustomizePanel` and the AI panel.
  - `ACCENT_PRESETS` and `CARD_COLOR_NAMES` (named versions of `CARD_COLOR_PRESETS`) exist so the AI picks colors by name instead of inventing hex values.
  - `APPEARANCE_LIMITS` holds the allowed ranges.
  - `FONT_OPTIONS` lists Google Fonts served through `fonts.loli.net`, loaded on demand. Fonts marked `titleOnly` (KuaiLe, brush, handwriting) are hard to read at small sizes, so they set `--pc-title-font` (main title, card titles, heading blocks, subheadings) instead of `--pc-font-family`; the customize panel says so under the picker.
  - `CARD_COLOR_PRESETS` holds the card color swatches. The style presets live in `CustomizePanel`.
- `getAppearanceCssVars` turns the settings into `--pc-*` CSS variables on `#profileCardContainer`. CSS reads them with the theme tokens as fallbacks, e.g. `var(--pc-card-bg, var(--ui-bg-card))`. Card variables are only emitted when they differ from the defaults, so the theme stays in control until the user customizes.
- On dark page backgrounds, `getPageTextColor` sets `--pc-page-text` for the header and footer. A per-card background picks a readable text color through `getCardTextOverride`; the value `initial` resets the variable so the theme fallback applies.
- Change settings through `useAppearanceActions().updateAppearance(section, patch)` and `resetAppearance(section?)`.
- The visibility toggles only cover the page `subtitle` and `footer` (in the customize panel). The avatar and QR code are blocks: hiding them means deleting the block.

## AI integration

- `src/utils/aiProfile.ts` calls providers **directly from the browser** (Gemini native, OpenAI-compatible, Anthropic, custom). It uses tool/function calling with a single `generate_profile_card` tool, and the model output goes through `normalizeGeneratedCards`, which delegates to `profileSchema.normalizeCards`.
- **The model chooses, the site designs.** The tool schema only lets the model pick from the site's own vocabulary, mostly via `enum`s:
  - `look`: `style` (a `STYLE_PRESETS` key), `accent` (an `ACCENT_PRESETS` name), `font` (a `FONT_OPTIONS` key). Read with `normalizeGeneratedLook`; anything unknown is dropped. Applied only in **replace** mode.
  - per card: `width` (a hint, 1–3), `color` (a `CARD_COLOR_NAMES` name), `align`, `hideTitle`.
  - blocks: all types except uploaded images; `imageGallery` is always emitted empty (a slot for the user's fave pictures). Checklist items come in as `options`, scale rows as `scales`.
  - Raw styles/HTML from the model are never used. All model text is HTML-escaped (`escapeHtml`); paragraphs and headings then allow `**bold**` and line breaks (also the literal two-character `\n` some models write).
- **Layout is computed, not trusted:** `packRows` fills 3-column rows in order using the width hints (or a content estimate), and gives a row's spare columns to its fullest card, so every row is full. Cards in a row share `y` so `useHeightSync` aligns them. Blocks without content and cards without blocks are dropped.
- **Provider routing:** the explicitly selected provider wins. URL sniffing is used only for `custom` (so "OpenAI + Gemini's `/v1beta/openai` URL" correctly uses the OpenAI format).
- **Config resolution (`resolveAiConfig`):**
  - If the user configured nothing (no key, default or empty URL/model) and the build has `VITE_AI_FALLBACK_*`, the whole fallback config is used, provider included.
  - Otherwise only the user's config is used, and empty fields fall back to **that provider's** `PROVIDER_PRESETS`.
  - The fallback key is never mixed with a user-entered URL.
- **Model defaults:**
  - Gemini `gemini-3.5-flash-lite`. It has a free tier, and the 2.5 models stopped accepting new projects in 2026-09.
  - OpenAI `gpt-6-luna`, the official replacement for `gpt-4o-mini`, which shuts down on 2027-01-14. On Chat Completions, GPT-6 models only support function calling with `reasoning_effort: "none"`. That parameter is sent only for `provider === 'openai'` with `gpt-6*`, because older models reject it.
  - Anthropic `claude-haiku-5-5`.
  - `LEGACY_DEFAULT_MODELS` (per provider) are upgraded to the provider's current preset when a saved config is loaded.
- **Request details:**
  - Gemini sends the key in the `x-goog-api-key` header, never in the URL.
  - Anthropic needs `anthropic-dangerous-direct-browser-access: true`.
  - OpenAI requests omit `temperature`, because reasoning models reject it.
  - Consecutive same-role messages are merged (needed after a failed request).
- **System prompt:** `buildSystemPrompt(locale)` = `BASE_SYSTEM_PROMPT` + context (the UI already asked for the user's name and fandoms; reply in the user's language).
  - Its card structure follows common 扩列条 conventions: an identity card (big avatar + one inline line like "05.20 | INTP | IP 成都" + an optional motto heading), what they play/watch, faves split into 心肝 (`tone: strong`) and 好感 (`tone: outline`) plus an empty gallery, 属性 (CP stance, 同担, checklist/scale for game players), NG (`tone: ng`), and 扩列请 (rules + QR). Copy is terse, attribute-sheet style, with `|` separators.
  - Interview order: name/birthday/MBTI/IP → fandoms → faves (and which are top faves) → 属性 and NG → what friends they want and add-me rules → the look they want.
  - When asking, the model ends its reply with one line `[[option | option | …]]`. `splitQuickReplies` strips it for display and the panel renders the options of the latest message as buttons that send that text.
  - A motto heading is allowed only when it restates something the user said; without this rule the model invented English slogans in testing.
  - Key rules: never invent facts, even when the user asks; don't collect or print real names, phone numbers or addresses; 1–2 questions per turn; offer to generate after 3–5 rounds; length limits for subtitle, tags and paragraphs; tag blocks need a subheading in the user's language.
  - These rules were checked against real Gemini 3.5 Flash-Lite / 3 Flash runs (Chinese, English, thin info + force generate, privacy, "make things up"), and the current structure against a few invented personas (Chinese and English, music-game / mobile-game / multi-fandom) compared with the previous prompt. Re-run that kind of check after editing the prompt.
  - The panel still strips stray Markdown when displaying replies.
  - `normalizeGeneratedCards` drops empty cards and has no hard-coded Chinese fallbacks.
- **Errors:** tool calls whose arguments don't contain `cards` → `MALFORMED_CALL`; output cut off by token limits → `TRUNCATED`; requests time out after `AI_REQUEST_TIMEOUT_MS` (90 s) → `TIMEOUT`. On error the debug trace (no key) is `console.warn`'d. Every `AiErrorCode` needs an `aiBuilder.<code>` string.
- **Applying a generation** goes through `replaceProfileData(…, 'ai')` in one of two modes chosen in the panel: **replace** (all cards, `mainTitle`/`subtitle`, and the generated look) or **append** (the packed rows are shifted below the existing cards; titles and appearance are left alone). It can be undone from the global undo toast (z-index above dialogs) or from the panel's own "撤销这次生成" button.
  - The homepage showcases the author's real avatar and QR link. When generating a visitor's profile, unchanged sample images are replaced with `MOCK_AVATAR` / `MOCK_QR` from `utils/placeholders.ts` (inline SVGs with explicit width/height, so html2canvas draws them correctly) and a footer with the new name. Images the user uploaded are kept. Append mode preserves all existing profile settings, including the homepage avatar and QR link.
  - Cards whose only subheading would repeat the card title (e.g. 「避雷针 / NG」) lose that subheading in `normalizeGeneratedCards`.
  - "换个风格" cycles `STYLE_PRESETS` locally without another request. Each switch is its own `replaceProfileData(…, 'style')` step, so Ctrl+Z undoes one switch at a time. The panel keeps the pre-generation snapshot and the last applied content signature (excluding automatic layout measurements); "撤销这次生成" restores that snapshot even after more than 30 style switches. Intervening content edits or global undo invalidate the panel restore. In-flight requests are aborted when the panel closes. The conversation is kept in `sessionStorage` (`profilecraft-ai-chat`), so an accidental close doesn't lose it.
- Without a key, the panel shows onboarding: a link to get a free Gemini key at aistudio.google.com/apikey, an inline key field, and a privacy note (on Gemini's free tier, Google may use conversations to improve its products).
- The optional `VITE_AI_FALLBACK_*` env vars (see `.env.example`; a local `.env.local` may define them for development) are compiled into the public bundle by `npm run build`. Never ship a real long-lived key that way.

## Export / import

- HTML and PNG export both clone the **live DOM** (`#profileCardContainer`). They strip editor controls via `EXPORT_HIDDEN_SELECTORS` (`.editor-only`, `.pc-controls`, …) and render under `.pc-static`, the same rules preview mode uses. They inline the CSS from `App.css?raw` (with its `@import` lines removed) plus the active theme's CSS. Styles that must appear in exports therefore belong in `App.css` itself. Preview also uses a content-driven CSS grid; editing keeps the draggable RGL layout. Keep phone media rules specific enough to override desktop export rules.
- Appearance travels with the clone:
  - The `--pc-*` variables are inline on `#profileCardContainer`.
  - The page background lives in `body`'s inline style. The HTML export copies it into a `body {}` rule; the PNG export copies it onto its wrapper.
  - A selected web font is linked in the exported HTML.
- Both exports turn the grid into a fixed 1080 px, 3-column CSS grid with the custom gaps. The HTML export falls back to a single column below 720 px. The PNG export also has a `'phone'` layout (`exportToImage(..., 'phone')`, "导出竖版图片"): one column laid out at 430 px and rendered at 3×. Don't widen it: shown full-width on a ~390 px phone, a 540 px layout shrinks tags to about 9 px.
- In `.pc-static`, empty image walls (`.is-empty-gallery`) are hidden and the last block's bottom margin is removed, so AI cards with an empty fave-picture slot don't end in a gap.
- html2canvas does not draw `inset` box-shadows correctly, so outlined tags use real borders (with the padding reduced by 1px).
- html2canvas has two limits that matter here:
  - Nested inline tag text can disappear from canvas output; keep tag text spans as positioned inline blocks. It ignores `object-fit`, which is why the cropped gallery mode uses `background-image`.
  - It can't draw images served without CORS. Older saved avatars from `q.qlogo.cn` can come out blank in PNG exports. Blank profiles' inline placeholder and uploaded images export correctly.
- Import accepts ProfileCraft JSON (`userSettings` + `cards`) or Tintro JSON (`personalInfo` + `cards` + `globalCardStyles`). Both are normalized, and both replace the current data in an undoable way.

## Theming

- Themes are registered in `src/config/themes.json`. A non-default theme has a `path` to `public/themes/*.css`, which `ThemeContext` injects as `<link id="theme-link">`.
- The active theme is set as `data-theme` / `data-theme-scheme` on `<html>` and `<body>`. Theme CSS should be scoped by those attributes.
- Accent color: `applyThemeColors` (`utils/colorUtils.ts`) derives CSS variables from one hex value. `--theme-text-strong` is the accent darkened 55% so tag text stays ≥ 5:1 on the light tag backgrounds for every accent in `ACCENT_PRESETS`; text placed directly on the accent (strong tags, checkmarks) uses `--button-text-on-accent` (black or white by brightness). It is disabled for themes with `settings.isAccentColorEnabled: false` (e.g. cyberpunk).
- The cyberpunk theme sets `.ui-card { background: … }` with gradients, so custom card colors don't show there. The customize panel tells the user.

## i18n

- Locales: zh-CN (default/fallback), en-US, ja-JP, ko-KR (listed in `src/config/locales.json`). The files live in `public/locales/` and are fetched at runtime, then cached in memory. The loading screen prefetches all of them, and `useTranslation` reads the cache synchronously. Keep the key sets identical across all four files.
- `t('a.b', { x })` replaces every `{x}`. A missing key returns the key string itself.
- Templates are built with the current `t` (`templates.*`, `cardTypes.*`, `blockTypes.*`), so inserted content follows the UI language. The bundled sample profile (`getDefaultProfileData`) is intentionally in Chinese.
- These are intentionally left untranslated: the console banner, the hidden SEO block, the loading-screen tips (shown before translations load), and `ErrorBoundary` (bilingual, because it sits outside the providers).
- The user guide is static HTML, kept outside the i18n system: `public/guide/index.html` (zh-CN) and `en.html` (all other locales; see `utils/guide.ts`). Button names in the guide must match the UI strings. The guide uses abstract SVG diagrams instead of screenshots (they are easier to read and don't go stale). Each diagram has numbered markers but no text, so both languages share it; every marker is explained in the figure's `.legend` list in the HTML. Edit `scripts/guide-diagrams.cjs` and rerun `npm run guide:diagrams`, then keep the legends in sync. The add-card / add-block dialogs use the same visual language: `components/ui/TemplateThumb.tsx` draws each thumbnail **from the data the template actually builds**, at one fixed scale (1 thumbnail px ≈ 10 real px), so thumbnails can't drift from reality. Block thumbnails are laid out at single-column width and then scaled up. The guide diagrams are drawn by hand, so keep them consistent with the default templates.

## Build and deploy

- `vite.config.ts`: `base: './'` (relative asset paths), manual chunks (`react`, `layout`, `export`, `icons`), plus `VITE_BUILD_TIME` and `__APP_VERSION__` (taken from `package.json`) injected at build time.
- `index.html` contains the SEO meta tags, an inline pre-React loader, the Inter font from `fonts.loli.net`, and GoatCounter + 51.la analytics.
- `deplay.yml` at the repo root is **not** an active workflow. `.github/workflows/` was deleted in commit 278ccf7, and GitHub only runs workflows from that folder. This repo doesn't define how the live site is deployed, so ask before assuming.
- `package-lock.json` is committed. Bump `version` in `package.json` for releases; it feeds the console banner.

## Conventions

- Commit messages use Conventional Commits prefixes (`feat:`, `fix:`, `refactor:`, `docs:`), usually followed by a Chinese description.
- Code comments mix Chinese and English; match the surrounding file.
- ESLint has `exhaustive-deps` and `no-explicit-any` turned off. Keep effect dependencies correct by hand anyway.
