// 富文本里的“上色”和“大字”：用带 class 的 <span> 实现，而不是 execCommand 的内联颜色 / <font size>。
// 这样颜色能跟着主题色变化，深色卡片上也能换成更亮的同色系（样式见 App.css 的 .pc-c-* / .pc-big）。

export const TEXT_COLORS = ['accent', 'red', 'blue', 'green', 'purple'] as const;
export type TextColor = typeof TEXT_COLORS[number];

const COLOR_CLASSES = TEXT_COLORS.map((c) => `pc-c-${c}`);
const BIG_CLASS = 'pc-big';
const OWN_CLASSES = [...COLOR_CLASSES, BIG_CLASS];

const unwrap = (el: Element) => {
  const parent = el.parentNode;
  if (!parent) return;
  while (el.firstChild) parent.insertBefore(el.firstChild, el);
  parent.removeChild(el);
};

/** 选区在 root 内且不为空时返回它 */
const getRange = (root: HTMLElement): Range | null => {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const range = sel.getRangeAt(0);
  if (range.collapsed || !root.contains(range.commonAncestorContainer)) return null;
  return range;
};

const selectContents = (node: Node) => {
  const sel = window.getSelection();
  if (!sel) return;
  const range = document.createRange();
  range.selectNodeContents(node);
  sel.removeAllRanges();
  sel.addRange(range);
};

/** Split formatting ancestors at the selection edges, preserving the unselected text. */
const extractSelection = (range: Range, root: HTMLElement) => {
  const start = document.createComment('selection-start');
  const end = document.createComment('selection-end');
  const endRange = range.cloneRange();
  endRange.collapse(false);
  endRange.insertNode(end);
  range.collapse(true);
  range.insertNode(start);

  const lift = (marker: Comment) => {
    while (marker.parentNode && marker.parentNode !== root) {
      const parent = marker.parentNode;
      const before = parent.cloneNode(false);
      while (parent.firstChild && parent.firstChild !== marker) before.appendChild(parent.firstChild);
      if (before.hasChildNodes()) parent.parentNode!.insertBefore(before, parent);
      parent.parentNode!.insertBefore(marker, parent);
      if (!parent.hasChildNodes()) parent.parentNode!.removeChild(parent);
    }
  };
  lift(start);
  lift(end);
  const selected = document.createRange();
  selected.setStartAfter(start);
  selected.setEndBefore(end);
  return { start, end, selected, fragment: selected.extractContents() };
};

/** Apply a mutually exclusive format only to the selected text. */
const toggleClass = (root: HTMLElement, cls: string, group: string[]): boolean => {
  const range = getRange(root);
  if (!range) return false;
  const active = getActiveRichFormats(root);
  const turnOff = cls === BIG_CLASS ? active.big : active.color === cls.slice(5);
  const { start, end, selected, fragment } = extractSelection(range, root);
  // 选区里已有的同组 span 去掉对应 class，避免一层套一层
  fragment.querySelectorAll('span').forEach((span) => {
    group.forEach((c) => span.classList.remove(c));
    if (!span.className) unwrap(span);
  });
  const wrapper = document.createElement('span');
  if (!turnOff) wrapper.className = cls;
  wrapper.appendChild(fragment);
  selected.insertNode(wrapper);
  selectContents(wrapper);
  start.remove();
  end.remove();
  if (turnOff) unwrap(wrapper);
  return true;
};

export const toggleTextColor = (root: HTMLElement, color: TextColor) => toggleClass(root, `pc-c-${color}`, COLOR_CLASSES);
export const toggleBigText = (root: HTMLElement) => toggleClass(root, BIG_CLASS, [BIG_CLASS]);

/** 清除选区里的全部格式：加粗等交给 removeFormat，颜色 / 大字的 span 手动拆掉 */
export const clearFormatting = (root: HTMLElement): boolean => {
  const range = getRange(root);
  if (!range) return false;
  const { start, end, selected, fragment } = extractSelection(range, root);
  fragment.querySelectorAll('span').forEach((span) => {
    OWN_CLASSES.forEach((c) => span.classList.remove(c));
    if (!span.className) unwrap(span);
  });
  const wrapper = document.createElement('span');
  wrapper.appendChild(fragment);
  selected.insertNode(wrapper);
  selectContents(wrapper);
  start.remove();
  end.remove();
  document.execCommand('removeFormat', false, undefined);
  if (wrapper.isConnected) unwrap(wrapper);
  return true;
};

/** 光标所在位置当前的颜色 / 是否大字，用于工具栏高亮 */
export const getActiveRichFormats = (root: HTMLElement): { color?: TextColor; big: boolean } => {
  const sel = window.getSelection();
  let node: Node | null = sel && sel.rangeCount ? sel.getRangeAt(0).commonAncestorContainer : null;
  let color: TextColor | undefined;
  let big = false;
  while (node && node !== root) {
    if (node instanceof HTMLElement) {
      if (!color) color = TEXT_COLORS.find((c) => (node as HTMLElement).classList.contains(`pc-c-${c}`));
      if (node.classList.contains(BIG_CLASS)) big = true;
    }
    node = node.parentNode;
  }
  return { color, big };
};
