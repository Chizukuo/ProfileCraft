# ProfileCraft（芝士扩列条编辑器）

[English](../README.md) / [日本語](./README.ja-JP.md) / [한국어](./README.ko-KR.md)

ProfileCraft 是一个基于 React + TypeScript 的浏览器端扩列条编辑器。
它支持富文本编辑、卡片布局拖拽缩放、多语言与主题切换，并可一键导出为 HTML 或 PNG。

## 在线体验

- https://tools.chizunet.cc/

## 功能特性

- 富文本编辑（加粗、斜体、下划线、删除线）
- 动态卡片与内容区块管理
- 基于 react-grid-layout 的拖拽与缩放布局
- 头像上传与二维码链接更新
- 多语言界面（zh-CN、en-US、ja-JP、ko-KR）
- 内置主题（Default、Cyberpunk）
- localStorage 自动保存
- 导出为独立 HTML 或 PNG 图片

## 技术栈

- React 19
- TypeScript
- Vite
- Context API
- react-grid-layout
- html2canvas
- qrcode.react
- lucide-react

## 本地开发

### 环境要求

- Node.js 20+
- npm 10+

### 安装依赖

```bash
npm install
```

### 启动开发环境

```bash
npm run dev
```

### 打包生产版本

```bash
npm run build
```

### 本地预览

```bash
npm run preview
```

### 代码检查

```bash
npm run lint
```

## 目录结构

```text
src/
  components/      # 页面与业务组件
  context/         # Profile / Locale / Theme 状态上下文
  hooks/           # 复用逻辑（布局、节流、翻译等）
  config/          # 语言与主题配置注册
  utils/           # 导出、国际化、主题与颜色工具
  styles/          # 全局样式与模块样式
  types/           # TypeScript 类型定义
public/
  locales/         # 国际化文案文件
  themes/          # 主题样式文件
document/
  README.*.md      # 多语言文档
```

## 数据与导出说明

- 编辑数据默认保存在浏览器 localStorage。
- 清理浏览器存储会删除本地草稿。
- PNG 导出依赖 html2canvas，复杂 CSS 效果可能存在还原差异。
- 导出的 HTML 内嵌所需样式，若使用网络字体则需要联网加载。

## 许可证

MIT，详见 [LICENSE](../LICENSE)。
