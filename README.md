# ProfileCraft

[中文](./document/README.zh-CN.md) / [日本語](./document/README.ja-JP.md) / [한국어](./document/README.ko-KR.md)

ProfileCraft is a browser-based profile card editor built with React + TypeScript.
It is designed for creating "扩列条" style cards quickly, with rich text editing, flexible card layouts, and one-click export.

## Live Demo

- https://tools.chizunet.cc/

## Features

- Rich text editing (bold, italic, underline, strikethrough)
- Dynamic cards and content blocks
- Drag-and-resize layout based on react-grid-layout
- Avatar upload and QR code update
- Multi-language UI (zh-CN, en-US, ja-JP, ko-KR)
- Built-in themes (Default, Cyberpunk)
- Auto-save to localStorage
- Export as standalone HTML or PNG

## Tech Stack

- React 19
- TypeScript
- Vite
- Context API
- react-grid-layout
- html2canvas
- qrcode.react
- lucide-react

## Quick Start

### Requirements

- Node.js 20+
- npm 10+

### Install

```bash
npm install
```

### Start Development Server

```bash
npm run dev
```

### Optional: Built-in Fallback AI API

This project supports a fallback AI config via Vite env vars.

1. Copy `.env.example` to `.env.local`
2. Fill your fallback values:

```bash
VITE_AI_FALLBACK_API_KEY=your_key
VITE_AI_FALLBACK_BASE_URL=https://api.siliconflow.cn/v1
VITE_AI_FALLBACK_MODEL=Qwen/Qwen2.5-7B-Instruct
```

Notes:

- User input in AI settings still takes priority over fallback values.
- `VITE_*` variables are bundled into frontend output. Avoid long-lived production secrets; prefer a short-lived token or backend proxy.

Gemini example:

```bash
VITE_AI_FALLBACK_API_KEY=your_google_api_key
VITE_AI_FALLBACK_BASE_URL=https://generativelanguage.googleapis.com
VITE_AI_FALLBACK_MODEL=gemini-2.0-flash
```

### Build Production Bundle

```bash
npm run build
```

### Preview Build Output

```bash
npm run preview
```

### Lint

```bash
npm run lint
```

## Project Structure

```text
src/
  components/      # App shell, cards, modals, UI components
  context/         # Profile / Locale / Theme contexts
  hooks/           # Reusable logic (layout, throttle, translation, etc.)
  config/          # Locale and theme registries
  utils/           # Export, i18n, theme and color utilities
  styles/          # Global and modular styles
  types/           # Shared TypeScript types
public/
  locales/         # Translation files
  themes/          # Theme CSS files
document/
  README.*.md      # Localized documentation
```

## Data and Export Notes

- User data is saved in browser localStorage.
- Clearing browser storage will remove local drafts.
- PNG export relies on html2canvas and may not perfectly render very complex CSS effects.
- Exported HTML contains all required styles, and web font loading may require internet access.

## License

MIT. See [LICENSE](./LICENSE).