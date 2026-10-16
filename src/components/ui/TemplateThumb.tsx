import React, { useId } from 'react';
import type { CardData, CardElement, TagData } from '../../types/data';

// 模板缩略图：直接根据模板“真正会插入的数据”画抽象图形（标签个数、文字长短、空图片墙、
// 头像 / 信息 / 二维码居中竖排……），模板改了缩略图自动跟着变，不会和实际效果对不上。
// 统一比例：缩略图 1px ≈ 实际 10px（K）。长度都按真实字号 / 尺寸换算，只有线条粗细略微夸大以便看清。
// 颜色来自 editor-controls.css 的 .tt-* 类，随主题变化。

type Node = React.ReactNode;
interface Drawn { node: Node; h: number }

const K = 0.1;
const LINE_H = 3;
const LINE_GAP = 2.4;
const PILL_H = 5;
const BLOCK_GAP = 4;
/** 实际字号（px），用于换算文字长度 */
const FONT = { body: 15, subheading: 18, cardTitle: 22, tag: 13, heading: { sm: 18, md: 24, lg: 32 } } as const;

const plain = (html = '') => html.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '').replace(/&[a-z]+;/g, ' ');
/** 视觉长度：中日韩字符算 1，其他算 0.55 */
const visualLength = (text: string) => [...text].reduce((n, ch) => n + (/[⺀-￿]/.test(ch) ? 1 : 0.55), 0);

const bar = (key: string, x: number, y: number, w: number, cls = 'tt-line', h = LINE_H) =>
  <rect key={key} x={x} y={y} width={Math.max(3, w)} height={h} rx={h / 2} className={cls} />;

/** 一段文字 → 若干行（按真实字号和长度折行，最多 maxLines 行） */
const textLines = (key: string, html: string, x: number, y: number, w: number, maxLines = 4, cls = 'tt-line', h = LINE_H, fontPx: number = FONT.body): Drawn => {
  const perLine = Math.max(2, w / (fontPx * K));
  const nodes: Node[] = [];
  let cy = y;
  plain(html).split('\n').forEach((para, pi) => {
    let len = visualLength(para.trim());
    if (len === 0) len = 0.5;
    while (len > 0 && nodes.length < maxLines) {
      const take = Math.min(len, perLine);
      nodes.push(bar(`${key}-${pi}-${nodes.length}`, x, cy, (take / perLine) * w, cls, h));
      cy += h + LINE_GAP;
      len -= take;
    }
  });
  return { node: <g key={key}>{nodes}</g>, h: Math.max(0, cy - y - LINE_GAP) };
};

/** 一组标签 → 胶囊，按文字长度定宽并自动换行 */
const pills = (key: string, tags: { text: string; cls: string }[], x: number, y: number, w: number, startX = x): Drawn => {
  const nodes: Node[] = [];
  let cx = startX;
  let cy = y;
  tags.forEach((tag, i) => {
    // 实际标签：文字宽 + 左右内边距约 26px
    const pw = Math.min(w, (visualLength(plain(tag.text)) * FONT.tag + 26) * K);
    if (cx + pw > x + w && cx > x) {
      cx = x;
      cy += PILL_H + 2;
    }
    nodes.push(<rect key={`${key}-${i}`} x={cx} y={cy} width={pw} height={PILL_H} rx={PILL_H / 2} className={tag.cls} />);
    cx += pw + 2;
  });
  return { node: <g key={key}>{nodes}</g>, h: tags.length ? cy - y + PILL_H : 0 };
};

const subheading = (key: string, html: string, x: number, y: number, w: number, fontPx: number = FONT.subheading): Drawn => {
  if (!plain(html).trim()) return { node: null, h: 0 };
  const width = Math.min(w, visualLength(plain(html)) * fontPx * K);
  return {
    node: <g key={key}>{bar(`${key}-t`, x, y, width, 'tt-head', 4.5)}<rect x={x} y={y + 6.5} width={w} height={0.6} className="tt-line" /></g>,
    h: 8,
  };
};

const tagCls = (tag: TagData, fallback = 'tt-pill') =>
  tag.type === 'oshi-meta-tag' ? 'tt-dash' : tag.type === 'oshi-tag' ? 'tt-pill2' : fallback;

const stack = (key: string, parts: Drawn[], gap = 3): Drawn => {
  let h = 0;
  const nodes = parts.filter(p => p.h > 0).map((p, i, arr) => {
    const node = <g key={`${key}-${i}`} transform={`translate(0 ${h})`}>{p.node}</g>;
    h += p.h + (i < arr.length - 1 ? gap : 0);
    return node;
  });
  return { node: <g key={key}>{nodes}</g>, h };
};

/** 画一个区块（坐标以 (x, 0) 为左上角，宽 w），返回图形和占用高度 */
const drawElement = (el: CardElement, key: string, x: number, w: number): Drawn => {
  switch (el.type) {
    case 'paragraph':
      return textLines(key, el.text, x, 0, w);
    case 'heading': {
      const h = el.size === 'lg' ? 5 : el.size === 'sm' ? 3.6 : 4.2;
      return textLines(key, el.text, x, 0, w, 2, 'tt-head', h, FONT.heading[el.size]);
    }
    case 'avatar': {
      // 实际直径 64 / 100 / 140px
      const r = ((el.size === 'lg' ? 140 : el.size === 'sm' ? 64 : 100) * K) / 2;
      const cx = x + w / 2;
      return {
        node: el.shape === 'rounded'
          ? <rect key={key} x={cx - r} y={0} width={r * 2} height={r * 2} rx={r * 0.4} className="tt-avatar" />
          : <circle key={key} cx={cx} cy={r} r={r} className="tt-avatar" />,
        h: r * 2,
      };
    }
    case 'infoList': {
      // 实际效果：整块居中，每行左对齐“标签: 内容”
      const rows = el.items.slice(0, 6);
      const unit = FONT.body * K;
      const labelW = Math.max(...rows.map(r => visualLength(plain(r.label))), 1) * unit + unit;
      const valueW = Math.max(...rows.map(r => visualLength(plain(r.value))), 1) * unit;
      const total = Math.min(w, labelW + 3 + valueW);
      const left = x + (w - total) / 2;
      return {
        node: (
          <g key={key}>
            {rows.map((row, i) => (
              <g key={i}>
                {bar(`${key}-l${i}`, left, i * 5.5, Math.min(visualLength(plain(row.label)) * unit, total * 0.5), 'tt-head', LINE_H)}
                {bar(`${key}-v${i}`, left + Math.min(labelW, total * 0.5), i * 5.5, Math.min(visualLength(plain(row.value)) * unit, total - labelW), 'tt-line', LINE_H)}
              </g>
            ))}
          </g>
        ),
        h: rows.length ? rows.length * 5.5 - 2.5 : 0,
      };
    }
    case 'qrCode': {
      const s = 136 * K; // 实际 128px + 内边距
      const qx = x + (w - s) / 2;
      return {
        node: (
          <g key={key}>
            <rect x={qx} y={0} width={s} height={s} rx={1.5} className="tt-head" />
            {[[0, 0], [1, 0], [0, 1]].map(([i, j]) => (
              <rect key={`${i}${j}`} x={qx + s * 0.1 + i * s * 0.52} y={s * 0.1 + j * s * 0.52} width={s * 0.28} height={s * 0.28} className="tt-card-fill" />
            ))}
          </g>
        ),
        h: s,
      };
    }
    case 'divider':
      return el.variant === 'space'
        ? { node: null, h: 4 }
        : { node: <rect key={key} x={x} y={1.5} width={w} height={0.8} className={el.variant === 'dashed' ? 'tt-dash-line' : 'tt-head'} />, h: 4 };
    case 'tagSection':
      return stack(key, [subheading(`${key}-h`, el.subheading, x, 0, w), pills(`${key}-p`, el.tags.map(t => ({ text: t.text, cls: tagCls(t) })), x, 0, w)]);
    case 'tagSectionTwo':
      return stack(key, [
        subheading(`${key}-h`, el.subheading, x, 0, w),
        pills(`${key}-p`, [...el.oshis, ...el.meta].map(t => ({ text: t.text, cls: tagCls(t, 'tt-pill2') })), x, 0, w),
      ]);
    case 'groupedTagSection': {
      const group = (gk: string, label: string, tags: TagData[]): Drawn => {
        const lw = Math.min(w * 0.4, visualLength(plain(label)) * FONT.body * K);
        const row = pills(`${gk}-p`, tags.map(t => ({ text: t.text, cls: tagCls(t) })), x, 0, w, x + lw + 3);
        return { node: <g key={gk}>{bar(`${gk}-l`, x, 1, lw, 'tt-head', 3.5)}{row.node}</g>, h: Math.max(PILL_H, row.h) };
      };
      return stack(key, [
        subheading(`${key}-h`, el.subheading, x, 0, w),
        group(`${key}-a`, el.arcadeLabel, el.arcade),
        group(`${key}-m`, el.mobileLabel, el.mobile),
      ]);
    }
    case 'imageGallery': {
      const cols = el.columns;
      const gap = 2;
      const cell = (w - gap * (cols - 1)) / cols;
      // 没有图片时，实际只显示一个虚线“添加图片”格子
      const count = el.images.length || 1;
      const nodes: Node[] = [];
      for (let i = 0; i < Math.min(count, cols * 2); i++) {
        const cx = x + (i % cols) * (cell + gap);
        const cy = Math.floor(i / cols) * (cell + gap);
        nodes.push(el.images.length
          ? <rect key={`${key}-${i}`} x={cx} y={cy} width={cell} height={cell} rx={2} className={`tt-img${(i % 3) + 1}`} />
          : (
            <g key={`${key}-${i}`}>
              <rect x={cx} y={cy} width={cell} height={cell} rx={2} className="tt-dash" />
              <path className="tt-plus" d={`M${cx + cell / 2 - 2.5} ${cy + cell / 2}h5M${cx + cell / 2} ${cy + cell / 2 - 2.5}v5`} />
            </g>
          ));
      }
      const rows = Math.ceil(Math.min(count, cols * 2) / cols);
      return { node: <g key={key}>{nodes}</g>, h: rows * cell + (rows - 1) * gap };
    }
    default:
      return { node: null, h: 0 };
  }
};

const VIEW_W = 120;
const VIEW_H = 64;
const PAD = 6;

/** 卡片模板：三列网格里高亮出卡片实际占的列数，卡片里画模板真正包含的标题和区块 */
export const CardTemplateThumb: React.FC<{ width: number; card: Pick<CardData, 'title' | 'elements' | 'style'> }> = ({ width, card }) => {
  const clipId = useId();
  const gap = 4;
  const colW = (VIEW_W - PAD * 2 - gap * 2) / 3;
  const cardW = colW * width + gap * (width - 1);
  const cardH = VIEW_H - PAD * 2;
  const inner = 4;
  const contentW = cardW - inner * 2;

  const parts: Drawn[] = [];
  if (!card.style?.hideTitle && plain(card.title).trim()) parts.push(subheading('title', card.title, PAD + inner, 0, contentW, FONT.cardTitle));
  card.elements.forEach((el, i) => parts.push(drawElement(el, `el${i}`, PAD + inner, contentW)));
  const content = stack('content', parts, BLOCK_GAP);

  return (
    <svg className="template-thumb" viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} aria-hidden="true">
      <defs>
        <clipPath id={clipId}><rect x={PAD} y={PAD} width={cardW} height={cardH} rx={5} /></clipPath>
      </defs>
      {[0, 1, 2].map(i => (
        <rect key={i} x={PAD + i * (colW + gap)} y={PAD} width={colW} height={cardH} rx={4} className="tt-slot" />
      ))}
      <rect x={PAD} y={PAD} width={cardW} height={cardH} rx={5} className="tt-card" />
      <g clipPath={`url(#${clipId})`}>
        <g transform={`translate(0 ${PAD + inner})`}>{content.node}</g>
      </g>
    </svg>
  );
};

/** 单列卡片的实际内容宽度约 270px，区块缩略图按这个宽度排版后再整体放大 */
const ONE_COLUMN_W = 270 * K;

/** 区块模板：按“放进单列卡片”的真实比例排版，再放大到填满缩略图，垂直居中 */
export const BlockTemplateThumb: React.FC<{ element: CardElement }> = ({ element }) => {
  const clipId = useId();
  const drawn = drawElement(element, 'el', 0, ONE_COLUMN_W);
  const availW = VIEW_W - PAD * 2 - 20;
  const availH = VIEW_H - PAD * 2 - 12;
  const scale = Math.min(availW / ONE_COLUMN_W, drawn.h > 0 ? availH / drawn.h : Infinity);
  const left = (VIEW_W - ONE_COLUMN_W * scale) / 2;
  const top = (VIEW_H - drawn.h * scale) / 2;
  return (
    <svg className="template-thumb" viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} aria-hidden="true">
      <defs>
        <clipPath id={clipId}><rect x={PAD} y={PAD} width={VIEW_W - PAD * 2} height={VIEW_H - PAD * 2} rx={5} /></clipPath>
      </defs>
      <rect x={PAD} y={PAD} width={VIEW_W - PAD * 2} height={VIEW_H - PAD * 2} rx={5} className="tt-card" />
      <g clipPath={`url(#${clipId})`}>
        <g transform={`translate(${left} ${top}) scale(${scale})`}>{drawn.node}</g>
      </g>
    </svg>
  );
};
