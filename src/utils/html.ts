// 卡片里的文字按 HTML 存储（EditableText 用 innerHTML 渲染）。
// 从输入框、AI 等纯文本来源写进去之前必须转义，否则“GL<BG”这类写法会被当成标签吞掉。
export const escapeHtml = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * 把一次输入的多个条目拆开：用户经常一口气写“初音未来、镜音铃、巡音流歌”。
 * 只按顿号、逗号、分号、竖线和换行拆；斜杠不拆（“BG/GL”“Phigros / Arcaea”是一个条目）。
 */
export const splitItems = (text: string) =>
  text.split(/[、，,；;｜|\n]+/).map((s) => s.trim()).filter(Boolean);
