# ProfileCraft（チーズプロフィールカードエディター）

[English](../README.md) / [中文](./README.zh-CN.md) / [한국어](./README.ko-KR.md)

ProfileCraft は React + TypeScript で作られた、ブラウザ完結型のプロフィールカードエディターです。
リッチテキスト編集、カードレイアウトのドラッグ/リサイズ、多言語対応、テーマ切り替え、HTML/PNG エクスポートを提供します。

## デモ

- https://tools.chizunet.cc/

## 主な機能

- リッチテキスト編集（太字、斜体、下線、取り消し線）
- 動的なカードとコンテンツブロック管理
- react-grid-layout ベースのドラッグ&リサイズ
- アバター画像アップロードと QR コード更新
- 多言語 UI（zh-CN、en-US、ja-JP、ko-KR）
- 内蔵テーマ（Default、Cyberpunk）
- localStorage 自動保存
- HTML / PNG エクスポート

## 技術スタック

- React 19
- TypeScript
- Vite
- Context API
- react-grid-layout
- html2canvas
- qrcode.react
- lucide-react

## ローカル開発

### 前提環境

- Node.js 20+
- npm 10+

### 依存関係をインストール

```bash
npm install
```

### 開発サーバー起動

```bash
npm run dev
```

### 本番ビルド

```bash
npm run build
```

### ビルド結果のプレビュー

```bash
npm run preview
```

### Lint

```bash
npm run lint
```

## ディレクトリ構成

```text
src/
  components/      # 画面・カード・モーダル・UI コンポーネント
  context/         # Profile / Locale / Theme のコンテキスト
  hooks/           # レイアウト、スロットル、翻訳などの再利用ロジック
  config/          # ロケール・テーマの設定
  utils/           # エクスポート、i18n、テーマ、色操作ユーティリティ
  styles/          # グローバル/モジュール CSS
  types/           # TypeScript 型定義
public/
  locales/         # 翻訳ファイル
  themes/          # テーマ CSS
document/
  README.*.md      # 多言語ドキュメント
```

## データ保存とエクスポートの注意

- 編集データはブラウザ localStorage に保存されます。
- ブラウザのストレージを削除すると下書きも削除されます。
- PNG 出力は html2canvas を利用するため、複雑な CSS は完全再現できない場合があります。
- HTML 出力は必要なスタイルを内包しますが、Web フォントはネット接続が必要な場合があります。

## ライセンス

MIT。詳細は [LICENSE](../LICENSE) を参照してください。
