// AI 生成卡片时用的占位头像 / 二维码。
// 示例数据里的头像和二维码是作者本人的（小芝士），AI 给别人生成扩列条时不能沿用。
// 用内联 SVG：不依赖外部图片，导出 PNG 时不会因为跨域变成空白；点击即可换成自己的图。
// 必须写明 width / height：否则固有尺寸按 300×150 算，html2canvas 不支持 object-fit，导出时会被裁歪。

const svg = (body: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">${body}</svg>`)}`;

/** 首页展示作者本人的头像和二维码链接；空白起步及给访客生成资料时使用下方占位图。 */
export const LEGACY_SAMPLE_AVATAR = 'https://q.qlogo.cn/g?b=qq&nk=2723258712&s=160';
export const LEGACY_SAMPLE_QR_LINK = 'https://qm.qq.com/q/fVHvvY6jGo';

/** 灰色人像剪影 */
export const MOCK_AVATAR = svg(
  '<rect width="160" height="160" fill="#E9E6F2"/>' +
  '<circle cx="80" cy="64" r="28" fill="#fff"/>' +
  '<path d="M30 146c4-30 25-46 50-46s46 16 50 46z" fill="#fff"/>',
);

/** 一看就是占位的“二维码”：虚线框 + 三个定位角，没有可扫描的内容 */
export const MOCK_QR = svg(
  '<rect x="3" y="3" width="154" height="154" rx="14" fill="#fff" stroke="#C9C3D6" stroke-width="3" stroke-dasharray="9 7"/>' +
  [[24, 24], [100, 24], [24, 100]].map(([x, y]) =>
    `<rect x="${x}" y="${y}" width="36" height="36" rx="6" fill="none" stroke="#B9B2C8" stroke-width="6"/><rect x="${x + 12}" y="${y + 12}" width="12" height="12" rx="2" fill="#B9B2C8"/>`).join('') +
  '<path d="M118 104v28M104 118h28" stroke="#B9B2C8" stroke-width="6" stroke-linecap="round"/>',
);
