# 🌈 チーズプロフィールカードエディター (Profile Craft)
### [English](./README.md) / [中文](./README.zh-CN.md) / [한국어](./README.ko-KR.md)
>開発者「小芝士（チーズちゃん）」より一言：  
>「芝士（チーズ）」は中国語の「これは（这是 / zhè shì）」と発音が似ています。  
>つまりこのツールの名前は「これはプロフィールカードエディターです！」という遊び心のある意味が込められています。ぜひ楽しんで使ってみてください。

チーズプロフィールカードエディターは、React + TypeScript を使った最新のプロフィールカード作成ツールです。  
テキスト編集、テーマカラーのカスタマイズ、アイコンやQRコードのアップロード、動的な情報ブロックの管理ができ、完成したカードは HTML ファイルまたは高画質 PNG 画像としてエクスポート可能。  
個性的な自己紹介や SNS でのシェアにぴったりのツールです。

## 👉 オンラインで試す → [GitHub Pages デモ](https://chizukuo.github.io/ProfileCraft/)

---

## 📋 目次
- [主な機能](#主な機能)
- [使い方](#使い方)
- [エクスポート](#エクスポート)
- [技術スタック](#技術スタック)
- [注意事項](#注意事項)

---

## 📌 主な機能
- 🖋️ **リアルタイムでリッチテキスト編集**  
  テキストを直接クリックして編集可能。  
  **太字**、*斜体*、~~取り消し線~~、<u>下線などをサポート</u>。

- 🎨 **テーマカラーの自由なカスタマイズ**  
  カラーピッカーでテーマカラーを選択。関連する色も自動で調整され、統一感のあるデザインに。

- 🖼️ **アバター画像とQRコードの即時更新**  
  任意のアバター画像をアップロード（Base64形式でブラウザに保存）。  
  QRコードはURL入力により即座に更新可能。

- 🗂️ **動的なカードと情報ブロック**  
  テンプレートから新しいカードを追加。  
  段落、タググループ、推し情報などを自由に追加可能。  
  カード・ブロック・タグはホバー時に削除ボタンが表示され、簡単に削除可能。

- 💾 **自動保存機能**  
  編集内容はブラウザの [localStorage](https://developer.mozilla.org/ja/docs/Web/API/Window/localStorage) に自動保存。リロードしても安心。

- 📤 **エクスポート対応**  
  作成したカードは HTML または PNG 画像としてエクスポート可能。  
  ワンクリックで初期テンプレートにリセットも可能。

- 📱 **モバイル最適化**  
  レスポンシブデザインに対応。モバイルではツールバーが折りたたまれ、快適な操作が可能。

---

## 🛠️ 使い方
- 🚀 **オンラインでアクセス**  
  👉 [https://chizukuo.github.io/ProfileCraft/](https://chizukuo.github.io/ProfileCraft/)

- ✨ **操作ガイド**  
  - テキストはクリックして直接編集。  
  - 範囲選択でフォーマット変更。  
  - サイドバーまたはツールバーでテーマカラーを変更。  
  - カードやブロックの追加・削除が自由に可能。

---

## 📦 エクスポート
- 上部ツールバーから HTML または PNG ファイルとしてエクスポート可能。  
- 初期テンプレートへのリセットもワンクリックで実行可能。

---

## ⚙️ 技術スタック

- フレームワーク：[React](https://reactjs.org/)  
- 言語：[TypeScript](https://www.typescriptlang.org/)  
- ビルドツール：[Vite](https://vitejs.dev/)  
- 状態管理：[React Context API](https://reactjs.org/docs/context.html)  
- スタイリング：[CSS3](https://developer.mozilla.org/ja/docs/Web/CSS) + [CSS Variables](https://developer.mozilla.org/ja/docs/Web/CSS/Using_CSS_custom_properties)  
- アイコン：[Lucide React](https://lucide.dev/)

### 使用ライブラリ
- [html2canvas](https://github.com/niklasvh/html2canvas) — PNG 画像のエクスポート用  
- [qrcode.react](https://github.com/zpao/qrcode.react) — QRコード生成コンポーネント

---

## ⚠️ 注意事項
- データはブラウザの [localStorage](https://developer.mozilla.org/ja/docs/Web/API/Window/localStorage) に保存されます。  
- キャッシュクリア時にデータが失われる場合があります。必要に応じてバックアップしてください。  
- [html2canvas](https://github.com/niklasvh/html2canvas) は複雑な CSS を正確に再現できない場合があります。  
- HTML エクスポート版では一部のフォント読み込みにインターネット接続が必要となります。

自分だけの素敵なプロフィールカードを作成してください！ 🎉
