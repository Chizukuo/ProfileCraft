// 生成使用指南（public/guide/）的抽象示意图：npm run guide:diagrams
// 图里只有图形和编号，没有文字，中英文指南共用；每个编号的说明写在 HTML 的 .legend 列表里。
// 修改编号位置或增删编号时，记得同步两份 HTML 的图例。
const fs = require('fs');
const path = require('path');
const out = process.argv[2] || path.join(__dirname, '..', 'public', 'guide', 'img');

const STYLE = `<style>
.pg{fill:#FFF8E7}.cd{fill:#fff;stroke:#E8E1CF;stroke-width:1.5}.ln{fill:#E6E0D2}.hd{fill:#BDB29C}
.pl{fill:#FFE9A8}.pl2{fill:#FFD866}.ac{fill:#FFC300}.acs{fill:none;stroke:#FFC300;stroke-width:2.5}
.ds{fill:none;stroke:#C4BBA5;stroke-width:1.5;stroke-dasharray:4 3}.dsa{fill:none;stroke:#E0A800;stroke-width:1.5;stroke-dasharray:4 3}
.bt{fill:#fff;stroke:#D6CEBA;stroke-width:1.2}.ic{fill:none;stroke:#7d7464;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}
.icw{fill:none;stroke:#fff;stroke-width:1.8;stroke-linecap:round}.dg{fill:#EF4444}
.hov{fill:#FFC300;fill-opacity:.07;stroke:#FFC300;stroke-width:1.5;stroke-dasharray:5 4}
.mk{fill:#8B4513}.mt{fill:#fff;font:700 12px -apple-system,"Segoe UI",sans-serif;text-anchor:middle;dominant-baseline:central}
.ar{fill:none;stroke:#8B4513;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
.num{fill:#9C9078;font:700 20px -apple-system,"Segoe UI",sans-serif;text-anchor:middle;dominant-baseline:central}
.key{fill:#5b5348;font:600 11px -apple-system,"Segoe UI",sans-serif;text-anchor:middle;dominant-baseline:central}
.im1{fill:#D6E6FF}.im2{fill:#FFD3E0}.im3{fill:#CFF0DD}.imf{fill:#fff;fill-opacity:.7}
.slot{fill:#FFC300;fill-opacity:.06}.toast{fill:#2b2b30}.tl{fill:#fff;fill-opacity:.55}.cur{fill:#1d1d1f;stroke:#fff;stroke-width:1.2}
.g1{stop-color:#FFD6E7}.g2{stop-color:#C9E4FF}.glass{fill:#fff;fill-opacity:.62;stroke:#fff;stroke-opacity:.8}
@media (prefers-color-scheme:dark){
.pg{fill:#1f1f24}.cd{fill:#2a2a30;stroke:#3d3d46}.ln{fill:#44444d}.hd{fill:#7d7d89}
.pl{fill:#5b4b16}.pl2{fill:#7a6214}.ds{stroke:#62626d}.bt{fill:#2a2a30;stroke:#50505b}.ic{stroke:#b9b9c4}
.mk{fill:#FFC300}.mt{fill:#1d1d1f}.ar{stroke:#FFC300}.num{fill:#8f8f9b}.key{fill:#d5d5de}
.im1{fill:#2d3f5e}.im2{fill:#5e2e3f}.im3{fill:#2e5c47}.imf{fill-opacity:.25}.slot{fill-opacity:.08}
.toast{fill:#e8e8ee}.tl{fill:#1d1d1f;fill-opacity:.5}
.g1{stop-color:#3a2a44}.g2{stop-color:#1f2e46}.glass{fill:#2a2a30;fill-opacity:.7;stroke:#4a4a55}
}
</style>`;

// ---- 基础图形 ----
const r = (x, y, w, h, cls, rx = 0, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" class="${cls}"${extra}/>`;
const line = (x, y, w, cls = 'ln', h = 7) => r(x, y, w, h, cls, h / 2);
const pill = (x, y, w, cls = 'pl', h = 18) => r(x, y, w, h, cls, h / 2);
const marker = (x, y, n) => `<circle cx="${x}" cy="${y}" r="11" class="mk"/><text x="${x}" y="${y + 0.5}" class="mt">${n}</text>`;
const plus = (cx, cy, s = 5) => `<path class="ic" d="M${cx - s} ${cy}h${2 * s}M${cx} ${cy - s}v${2 * s}"/>`;
const addChip = (x, y, w, h = 18) => r(x, y, w, h, 'ds', h / 2) + plus(x + 12, y + h / 2, 3.5) + line(x + 20, y + h / 2 - 2.5, w - 28, 'ln', 5);
// 齿轮轮廓取自 lucide 的 settings 图标（ISC 许可），与编辑器里的按钮一致
const GEAR_PATH = 'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z';
const gear = (cx, cy, size = 13) => {
  const k = size / 24;
  return `<g transform="translate(${cx - size / 2} ${cy - size / 2}) scale(${k.toFixed(3)})"><path class="ic" style="stroke-width:${(1.6 / k).toFixed(2)}" d="${GEAR_PATH}"/><circle cx="12" cy="12" r="3" class="ic" style="stroke-width:${(1.6 / k).toFixed(2)}"/></g>`;
};
const cross = (cx, cy, s = 4, cls = 'ic') => `<path class="${cls}" d="M${cx - s} ${cy - s}L${cx + s} ${cy + s}M${cx + s} ${cy - s}L${cx - s} ${cy + s}"/>`;
const btn = (cx, cy, rr, inner) => `<circle cx="${cx}" cy="${cy}" r="${rr}" class="bt"/>${inner}`;
const toolbar = (cx, cy, rr = 12) => btn(cx, cy, rr, gear(cx, cy)) + btn(cx + rr * 2 + 4, cy, rr, cross(cx + rr * 2 + 4, cy, rr / 3));
const itemX = (cx, cy) => `<circle cx="${cx}" cy="${cy}" r="7" class="dg"/>${cross(cx, cy, 2.6, 'icw')}`;
const dragDots = (cx, cy) => [-6, 0, 6].flatMap(dx => [-3, 3].map(dy => `<circle cx="${cx + dx}" cy="${cy + dy}" r="2" class="hd"/>`)).join('');
const cursor = (x, y) => `<path class="cur" d="M${x} ${y}l0 17l4.5-4.2l3 6.6l3-1.4l-3-6.5l6.2-.4z"/>`;
const arrow = (x1, y, x2) => `<path class="ar" d="M${x1} ${y}H${x2}M${x2 - 7} ${y - 6}L${x2} ${y}L${x2 - 7} ${y + 6}"/>`;
const avatar = (cx, cy, rr) => `<circle cx="${cx}" cy="${cy}" r="${rr}" class="im1"/><circle cx="${cx}" cy="${cy}" r="${rr}" class="acs"/>` +
  `<circle cx="${cx}" cy="${cy - rr * 0.22}" r="${rr * 0.3}" class="imf"/><path class="imf" d="M${cx - rr * 0.55} ${cy + rr * 0.62}a${rr * 0.55} ${rr * 0.42} 0 0 1 ${rr * 1.1} 0z"/>`;
const qr = (x, y, s) => {
  const c = s * 0.28, p = s * 0.08;
  return r(x, y, s, s, 'hd', 4) + [[x + p, y + p], [x + s - p - c, y + p], [x + p, y + s - p - c]].map(([a, b]) => r(a, b, c, c, 'cd', 2)).join('') +
    r(x + s * 0.56, y + s * 0.56, s * 0.14, s * 0.14, 'cd', 1) + r(x + s * 0.76, y + s * 0.74, s * 0.12, s * 0.12, 'cd', 1);
};
const picture = (x, y, w, h, cls) => r(x, y, w, h, cls, 8) +
  `<circle cx="${x + w * 0.72}" cy="${y + h * 0.3}" r="${Math.min(w, h) * 0.09}" class="imf"/>` +
  `<path class="imf" d="M${x + w * 0.12} ${y + h * 0.84}L${x + w * 0.4} ${y + h * 0.48}L${x + w * 0.62} ${y + h * 0.84}z"/>`;
const eyeOff = (cx, cy) => `<path class="ic" d="M${cx - 5} ${cy}q5 -5 10 0q-5 5 -10 0M${cx - 5} ${cy - 5}L${cx + 5} ${cy + 5}"/>`;
const eye = (cx, cy) => `<path class="ic" d="M${cx - 6} ${cy}q6 -6 12 0q-6 6 -12 0"/><circle cx="${cx}" cy="${cy}" r="1.8" class="hd"/>`;

const svg = (w, h, body, label) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${label}">${STYLE}${body}</svg>\n`;

const files = {};

// 1. 页面结构
files['d-layout.svg'] = svg(640, 440, [
  r(0, 0, 640, 440, 'pg', 18),
  r(270, 26, 100, 14, 'hd', 7), line(290, 48, 60, 'ln', 8), marker(394, 38, 1),
  // 卡片 A：个人信息
  r(40, 80, 170, 210, 'cd', 14), line(60, 98, 60, 'hd', 10), avatar(125, 140, 22),
  line(95, 174, 60), line(95, 188, 50), line(95, 202, 56), qr(105, 222, 44), marker(40, 80, 2),
  // 卡片 B：关于我
  r(226, 80, 374, 210, 'cd', 14), line(246, 98, 70, 'hd', 10), line(246, 122, 320), line(246, 136, 290),
  r(236, 152, 356, 56, 'hov', 10), line(246, 162, 44, 'hd', 8), pill(246, 180, 48), pill(300, 180, 60), pill(366, 180, 40), addChip(412, 180, 56),
  marker(592, 152, 3),
  line(246, 222, 52, 'hd', 8), pill(246, 240, 56), pill(308, 240, 44), pill(358, 240, 70),
  // 卡片 C：我的推
  r(40, 306, 560, 72, 'cd', 14), line(60, 322, 64, 'hd', 10), pill(60, 344, 52, 'pl2'), pill(118, 344, 64, 'pl2'), pill(188, 344, 46, 'pl2'), pill(240, 344, 58, 'pl2'), pill(304, 344, 50, 'pl2'),
  // 底部工具栏
  r(210, 394, 220, 34, 'bt', 17), ...[240, 280, 320, 360, 400].map((x, i) => `<circle cx="${x}" cy="411" r="7" class="${i === 0 ? 'ac' : 'hd'}"/>`),
  marker(446, 411, 4),
].join(''), 'Page layout');

// 2. 统一的控件
files['d-controls.svg'] = svg(640, 360, [
  r(0, 0, 640, 360, 'pg', 18),
  r(60, 34, 520, 300, 'cd', 16),
  dragDots(320, 56), marker(320, 16, 1),
  toolbar(516, 56), marker(516, 16, 2), marker(544, 16, 3),
  line(88, 82, 110, 'hd', 14), r(88, 106, 464, 2, 'ln'),
  line(88, 122, 400, 'ln', 8), line(88, 138, 360, 'ln', 8),
  r(80, 160, 480, 84, 'hov', 10), toolbar(504, 160, 11), marker(606, 160, 4),
  line(88, 174, 60, 'hd', 10),
  pill(88, 198, 58, 'pl', 22), pill(152, 198, 70, 'pl', 22), itemX(222, 198), pill(228, 198, 52, 'pl', 22), addChip(286, 198, 76, 22),
  cursor(196, 210),
  marker(222, 262, 5), marker(324, 262, 6),
  r(88, 284, 464, 34, 'ds', 10), plus(320, 301), marker(606, 301, 7),
].join(''), 'Editing controls');

// 3. 卡片宽度与手机排列
const deskCard = (x, y, w, h, n) => r(x, y, w, h, 'cd', 10) + `<text x="${x + w / 2}" y="${y + h / 2}" class="num">${n}</text>`;
files['d-widths.svg'] = svg(640, 300, [
  r(0, 0, 640, 300, 'pg', 18), r(20, 20, 380, 260, 'bt', 16),
  r(40, 40, 106, 224, 'slot', 6), r(157, 40, 106, 224, 'slot', 6), r(274, 40, 106, 224, 'slot', 6),
  deskCard(40, 44, 106, 70, 1), deskCard(157, 44, 223, 70, 2), deskCard(40, 126, 340, 60, 3),
  deskCard(40, 198, 106, 60, 1), deskCard(157, 198, 106, 60, 1), deskCard(274, 198, 106, 60, 1),
  marker(20, 20, 1),
  arrow(412, 150, 456),
  r(472, 20, 148, 260, 'bt', 20), r(526, 30, 40, 6, 'ln', 3),
  deskCard(486, 48, 120, 44, 1), deskCard(486, 100, 120, 44, 2), deskCard(486, 152, 120, 44, 3), deskCard(486, 204, 120, 44, 1),
  `<path class="ar" d="M596 110l5-5l5 5M596 134l5 5l5-5"/>`,
  marker(472, 20, 2), marker(620, 122, 3),
].join(''), 'Card widths');

// 4. 区块类型：与“添加区块”面板一致，按 文字 / 个人信息 / 标签 / 图片 四组排列；
//    图形按模板实际插入的内容画（标签个数、空图片墙等）
const tile = (x, y, n, body) => r(x, y, 190, 80, 'cd', 12) + body(x, y) + marker(x + 16, y + 16, n);
const infoRows = (cx, y, rows) => rows.map((lw, i) => line(cx - 22, y + i * 11, lw, 'hd', 6) + line(cx - 22 + lw + 4, y + i * 11, 22, 'ln', 6)).join('');
files['d-blocks.svg'] = svg(640, 396, [
  r(0, 0, 640, 396, 'pg', 18),
  // 文字
  tile(20, 12, 1, (x, y) => line(x + 34, y + 34, 64, 'hd', 12)),
  tile(225, 12, 2, (x, y) => line(x + 34, y + 36, 96)),
  tile(430, 12, 3, (x, y) => r(x + 34, y + 39, 136, 2, 'hd', 1)),
  // 个人信息
  tile(20, 106, 4, (x, y) => avatar(x + 95, y + 40, 24)),
  tile(225, 106, 5, (x, y) => infoRows(x + 95, y + 18, [14, 14, 14, 20])),
  tile(430, 106, 6, (x, y) => qr(x + 76, y + 14, 50)),
  // 标签
  tile(20, 200, 7, (x, y) => line(x + 34, y + 26, 54, 'hd', 9) + r(x + 34, y + 40, 136, 1.5, 'ln') + pill(x + 34, y + 50, 40) + pill(x + 80, y + 50, 40)),
  tile(225, 200, 8, (x, y) => line(x + 34, y + 26, 40, 'hd', 9) + r(x + 34, y + 40, 136, 1.5, 'ln') + pill(x + 34, y + 50, 52, 'pl2') + r(x + 92, y + 50, 62, 18, 'dsa', 9)),
  tile(430, 200, 9, (x, y) => line(x + 34, y + 18, 54, 'hd', 9) + r(x + 34, y + 31, 136, 1.5, 'ln') + line(x + 34, y + 42, 24, 'hd', 7) + pill(x + 64, y + 38, 40) + line(x + 34, y + 61, 24, 'hd', 7) + pill(x + 64, y + 57, 40)),
  // 图片
  tile(20, 294, 10, (x, y) => r(x + 34, y + 14, 52, 52, 'ds', 8) + plus(x + 60, y + 40, 6)),
].join(''), 'Block types');

// 5. 头像与二维码都是独立区块：点图片更换，用不到的区块直接删
files['d-media.svg'] = svg(640, 270, [
  r(0, 0, 640, 270, 'pg', 18),
  r(20, 16, 270, 238, 'cd', 14),
  avatar(155, 62, 30), cursor(160, 70), marker(108, 40, 1),
  infoRows(155, 108, [14, 14, 20]),
  r(40, 150, 230, 92, 'hov', 10), qr(127, 160, 56), toolbar(244, 150, 11), marker(266, 128, 2),
  r(107, 222, 96, 14, 'bt', 5), marker(222, 229, 3),
  arrow(302, 135, 340),
  r(352, 16, 268, 238, 'cd', 14),
  avatar(486, 82, 40), line(434, 140, 104, 'hd', 14), marker(580, 40, 4),
].join(''), 'Avatar and QR code blocks');

// 6. 图片墙
files['d-gallery.svg'] = svg(640, 250, [
  r(0, 0, 640, 250, 'pg', 18),
  r(20, 20, 600, 210, 'cd', 14),
  toolbar(560, 20, 11), marker(560, 52, 3),
  picture(40, 44, 140, 100, 'im1'),
  picture(196, 44, 140, 160, 'im2'),
  ...[0, 1, 2, 3].map(i => btn(258 + i * 20, 58, 8, i === 3 ? '' : '')),
  `<path class="ic" d="M260 55l-3 3l3 3M276 55l3 3l-3 3"/><path class="ic" d="M294 54h8M298 54v8"/>`, itemX(318, 58),
  cursor(240, 118), marker(268, 186, 1),
  picture(352, 44, 140, 116, 'im3'),
  r(508, 100, 92, 92, 'ds', 12), plus(554, 146, 8), marker(554, 212, 2),
].join(''), 'Image wall');

// 7. 外观：背景、卡片、间距、内边距、圆角
files['d-appearance.svg'] = svg(640, 330, [
  `<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" class="g1"/><stop offset="1" class="g2"/></linearGradient></defs>`,
  `<rect width="640" height="330" rx="18" fill="url(#bg)"/>`, marker(26, 26, 1),
  r(60, 52, 230, 176, 'glass', 22), r(80, 72, 190, 136, 'dsa', 8),
  line(96, 88, 90, 'hd', 10), line(96, 112, 150), line(96, 126, 130), line(96, 140, 150), pill(96, 162, 44), pill(146, 162, 52),
  marker(270, 212, 4),
  r(316, 52, 264, 176, 'glass', 22), line(340, 76, 80, 'hd', 10), line(340, 100, 200), line(340, 114, 180), pill(340, 140, 50), pill(396, 140, 64), pill(466, 140, 44),
  marker(448, 196, 2),
  `<path class="ar" d="M558 56a22 22 0 0 1 18 18"/>`, marker(604, 40, 5),
  `<path class="ar" d="M294 140h18M300 134l-6 6l6 6M306 134l6 6l-6 6"/>`, marker(303, 112, 3),
  r(60, 252, 520, 56, 'glass', 22), line(84, 272, 70, 'hd', 10), pill(84, 288, 46), pill(136, 288, 58),
  `<path class="ar" d="M175 232v16M169 238l6-6l6 6M169 242l6 6l6-6"/>`,
].join(''), 'Appearance settings');

// 8. 预览与导出
const miniCard = (x, y, withControls) => [
  r(x, y, 180, 160, 'cd', 12), line(x + 16, y + 20, 60, 'hd', 10), line(x + 16, y + 42, 140), line(x + 16, y + 56, 120),
  pill(x + 16, y + 76, 40), pill(x + 62, y + 76, 50), withControls ? addChip(x + 118, y + 76, 48) : '',
  pill(x + 16, y + 100, 46),
  withControls ? toolbar(x + 136, y + 14, 9) + r(x + 16, y + 126, 148, 22, 'ds', 8) + plus(x + 90, y + 137, 4) : '',
].join('');
const exportTile = (y, icon) => r(470, y, 150, 46, 'cd', 10) + icon + line(520, y + 15, 80, 'hd', 8) + line(520, y + 29, 60, 'ln', 6);
files['d-preview.svg'] = svg(640, 220, [
  r(0, 0, 640, 220, 'pg', 18),
  miniCard(20, 30, true), marker(20, 30, 1),
  arrow(208, 110, 234), eye(221, 90),
  miniCard(244, 30, false), marker(244, 30, 2),
  arrow(432, 110, 458),
  exportTile(26, picture(482, 34, 30, 30, 'im1')),
  exportTile(86, `<path class="ar" d="M488 102l-6 7l6 7M506 102l6 7l-6 7M500 100l-6 18"/>`),
  exportTile(146, `<path class="ar" d="M490 156q-5 0 -5 5v4q0 3 -3 4q3 1 3 4v4q0 5 5 5M504 156q5 0 5 5v4q0 3 3 4q-3 1 -3 4v4q0 5 -5 5"/>`),
  marker(470, 26, 3), marker(470, 86, 4), marker(470, 146, 5),
].join(''), 'Preview and export');

// 9. 撤销
const tagCard = (x, y, middle) => r(x, y, 180, 110, 'cd', 12) + line(x + 18, y + 20, 60, 'hd', 10) + pill(x + 18, y + 52, 44) + middle + pill(x + 128, y + 52, 34);
const keycap = (x, y, w, t) => r(x, y, w, 22, 'bt', 5) + `<text x="${x + w / 2}" y="${y + 11.5}" class="key">${t}</text>`;
files['d-undo.svg'] = svg(640, 200, [
  r(0, 0, 640, 200, 'pg', 18),
  tagCard(20, 40, pill(68, 92, 54, 'pl', 18).replace('class="pl"', 'class="pl" opacity=".55"') + itemX(122, 92) + cursor(118, 98)), marker(20, 40, 1),
  arrow(210, 95, 236),
  r(246, 76, 172, 38, 'toast', 19), r(262, 92, 60, 6, 'tl', 3), r(330, 83, 76, 24, 'ac', 12),
  `<path class="ar" d="M352 91a7 7 0 1 1 -2 7M350 89v5h5" style="stroke:#1d1d1f"/>`, line(364, 92, 32, 'tl', 6),
  keycap(286, 128, 40, 'Ctrl'), `<text x="334" y="139.5" class="key">+</text>`, keycap(342, 128, 24, 'Z'), marker(246, 70, 2),
  arrow(428, 95, 454),
  tagCard(462, 40, pill(510, 92, 54) + r(507, 89, 60, 24, 'acs', 12)), marker(462, 40, 3),
].join(''), 'Undo');

for (const [name, content] of Object.entries(files)) {
  fs.writeFileSync(path.join(out, name), content);
}
console.log(Object.keys(files).join(', '));
