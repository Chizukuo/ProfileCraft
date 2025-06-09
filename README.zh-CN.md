# 🌈 芝士扩列条编辑器 (Profile Craft)
### [English](./README.md) / [日本語](./README.ja-JP.md) / [한국어](./README.ko-KR.md)

>开发者“小芝士”说：嘿！“芝士”的发音和“这是”一样，所以这个工具的名字，意思就是“这是一个扩列条编辑器！” 希望你喜欢这个由我带来的小工具。

芝士扩列条编辑器是一个基于 React + TypeScript 开发的现代化扩列条编辑器。  
它支持你自由编辑文本、主题色、上传头像和二维码，管理动态信息区块，并可导出为独立的 HTML 文件或高清 PNG 图片，是进行个性化展示和社交分享的利器。

## 👉 在线体验（[GitHub Pages 部署](https://chizukuo.github.io/ProfileCraft/)）



## 📌 功能特点
- 🖋️ **实时编辑与富文本**  
  所见即所得，直接点击文本即可修改。  
  支持 **加粗**、*斜体*、~~删除线~~、<u>下划线</u>等格式。

- 🎨 **自定义配色**  
  使用颜色选择器修改主题色，自动调整关联颜色，保持整体风格统一。

- 🖼️ **头像上传 & 二维码更新**  
  上传自定义头像（本地 Base64 存储），修改链接，实时生成新二维码。

- 🗂️ **动态卡片与内容区块**  
  添加卡片：从模板添加新卡片。  
  添加区块：段落、标签组、推し信息等。  
  删除卡片/区块/标签，悬浮时可删除。

- 💾 **自动保存**  
  自动保存到浏览器 [localStorage](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/localStorage)，刷新页面也不怕丢失。

- 📤 **导出功能**  
  支持导出为独立的 HTML 文件或高清 PNG 图片。  
  可一键重置为初始模板。

- 📱 **移动端优化**  
  响应式设计，移动端自动收纳工具栏，体验流畅。

---

## 🛠️ 如何使用
- 🚀 **在线访问**  
  👉 [https://chizukuo.github.io/ProfileCraft/](https://chizukuo.github.io/ProfileCraft/)

- ✨ **编辑指南**  
  - 点击文本即可编辑。  
  - 选中文本设置格式。  
  - 通过工具栏或侧边栏调整主题色。  
  - 支持卡片和区块自由新增与删除。

---

## 📦 导出
- 顶部工具栏可导出 HTML 或 PNG。  
- 支持一键重置到初始模板。

---

## ⚙️ 技术栈

- 框架：[React](https://reactjs.org/)
- 语言：[TypeScript](https://www.typescriptlang.org/)
- 构建工具：[Vite](https://vitejs.dev/)
- 状态管理：[React Context API](https://reactjs.org/docs/context.html)
- 样式：[CSS3](https://developer.mozilla.org/zh-CN/docs/Web/CSS) + [CSS Variables](https://developer.mozilla.org/zh-CN/docs/Web/CSS/Using_CSS_custom_properties)
- 图标：[Lucide React](https://lucide.dev/)

### 依赖库
- [html2canvas](https://github.com/niklasvh/html2canvas) — 用于导出 PNG 图片  
- [qrcode.react](https://github.com/zpao/qrcode.react) — 生成二维码组件

---

## ⚠️ 注意事项
- 数据存储于浏览器 [localStorage](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/localStorage)。  
- 清除缓存会导致数据丢失，请注意备份。  
- [html2canvas](https://github.com/niklasvh/html2canvas) 对复杂 CSS 效果支持有限。  
- 导出 HTML 需联网加载字体资源。

祝您制作出独一无二的扩列条！ 🎉
