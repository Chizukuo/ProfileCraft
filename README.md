# 扩列条编辑器 (Profile Craft)

这是一个允许用户创建和自定义个人“扩列条”页面的 Web 应用。用户可以修改文本内容、样式、颜色主题、头像、二维码，并添加或删除不同的信息区块。最终可以将成果导出为 HTML 文件或图片。

This is a web application that allows users to create and customize their personal "profile card" pages. Users can modify text content, styles, color themes, avatars, QR codes, and add or remove different information blocks. The final result can be exported as an HTML file or an image.

---

## 📌 功能特点 (Features)

### ✏️ 实时编辑 (Live Editing)

- 直接在页面上点击文本即可进行修改。样式（如字重、字号）和内容会即时更新。
- *Click on text elements directly on the page to edit them. Styles (like font weight, font size) and content update in real-time.*

### 🎨 自定义配色 (Customizable Color Scheme)

- 通过颜色选择器更改主题强调色，其他相关颜色会自动调整以保持视觉和谐。
- *Change the main accent color via a color picker, and other related colors will adjust automatically to maintain visual harmony.*

### 🖼️ 头像上传 (Avatar Upload)

- 点击头像区域即可上传并更换自己的头像图片。图片数据保存在浏览器本地存储中。
- *Click on the avatar area to upload and change your own avatar image. Image data is saved in the browser's local storage.*

### 📱 二维码更新 (QR Code Update)

- 修改二维码指向的链接，二维码会相应更新。
- *Modify the link that the QR code points to, and the QR code will update accordingly.*

### 🧩 动态卡片与区块管理 (Dynamic Card & Block Management)

- **添加新卡片 (Add New Cards)**：添加新的信息卡片，并选择其在网格布局中的宽度。
- **添加区块 (Add Blocks to Cards)**：在卡片内添加不同类型的区块（如段落、标签组、推し信息等）。
- **删除卡片与区块 (Delete Cards & Blocks)**：通过悬浮时出现的删除按钮方便移除。
- **删除标签 (Delete Tags)**：标签组内的单个标签也可删除。

### 🔠 内容与样式调整 (Content & Style Adjustments)

- 大部分文本内容可编辑。
- 可调整文本元素的字重和字号。
- 使用浏览器快捷键（如 Ctrl/Cmd + B）可对选中文本加粗。

### 💾 数据持久化 (Data Persistence)

- 所有修改自动保存到浏览器 localStorage，下次打开自动加载。

### 📤 导出功能 (Export Functionality)

- **导出为 HTML**：生成自包含的 HTML 文件，适合分享和查看（不可编辑）。
- **导出为图片**：将扩列条渲染为 PNG 图片。

### ♻️ 恢复默认 (Reset to Default)

- 一键恢复到初始模板状态。

### 📱 移动端优化 (Mobile Optimization)

- 对移动设备界面进行优化，确保小屏幕可用性。

---

## 🛠️ 如何使用 (How to Use)

### 通过 GitHub Pages 访问 (Access via GitHub Pages)

直接在浏览器中打开以下链接即可开始使用：

https://chizukuo.github.io/ProfileCraft/



---

## ✍️ 开始编辑 (Start Editing)

### 📝 修改文本 (Modify Text)

- 点击页面上的文本（标题、段落、标签等）进入编辑。
- 编辑完成后点击空白处或按“应用样式”保存。

### 🎛️ 调整样式 (Adjust Styles)

- 编辑时会出现浮动面板，可调节字体大小与粗细。

### 🎨 更改主题色 (Change Theme Color)

- 使用顶部颜色选择器调整主题强调色。

### 🖼️ 上传头像 / 修改二维码 (Upload Avatar / Modify QR Code)

- 点击头像上传图片。
- 修改二维码下方的链接即可更新二维码。

### 🧱 管理卡片和区块 (Manage Cards and Blocks)

- 工具栏按钮可添加新卡片。
- 卡片内按钮可添加区块。
- 悬浮时会显示删除图标，可删除卡片或区块。

---

## 📦 导出 (Export)

- 使用顶部工具栏的：
  - “导出 HTML”
  - “导出图片”

---

## ⚙️ 技术栈 (Technology Stack)

- [HTML5](https://developer.mozilla.org/docs/Web/Guide/HTML/HTML5)  
- [CSS3](https://developer.mozilla.org/docs/Web/CSS)（使用 CSS 变量实现主题切换）  
- [JavaScript](https://developer.mozilla.org/docs/Web/JavaScript)（原生，无外部框架）  
- [`html2canvas.js`](https://github.com/niklasvh/html2canvas) - 用于将页面渲染为图片  
- [`qrcode.js`](https://github.com/davidshimjs/qrcodejs) - 用于生成二维码  
- [Google Material Icons](https://fonts.google.com/icons) - 用于界面图标

---

## ⚠️ 注意事项 (Notes)

- 所有数据保存在浏览器 `localStorage` 中，仅当前浏览器有效。
- 清除浏览器数据将会丢失编辑内容。
- `html2canvas` 对复杂 CSS 渲染有限制。
- 导出 HTML 文件需要联网才能正确加载 Google Fonts 和 Material Icons。

---

希望这个编辑器能帮助您轻松创建个性化的扩列条！  
*Hope this editor helps you create personalized profile cards with ease!*
