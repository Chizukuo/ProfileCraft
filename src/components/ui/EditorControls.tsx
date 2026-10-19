import React, { useCallback, useRef, useState } from 'react';
import { Plus, ArrowUp, ArrowDown } from 'lucide-react';
import { useDismissable } from '../../hooks/useDismissable';
import { useTranslation } from '../../hooks/useTranslation';
import { isSubmitEnter } from '../../utils/keyboard';

// 编辑器里所有控件的统一外观与行为。新增的编辑控件请优先复用这里的组件，
// 让用户在卡片、区块、标签、图片上看到的是同一套按钮。

// ---- 图标按钮：工具栏、删除、隐藏都用它 ----
interface ToolButtonProps {
  icon: React.ReactNode;
  title: string;
  onClick: () => void;
  danger?: boolean;
  active?: boolean;
  size?: 'md' | 'sm';
  className?: string;
  disabled?: boolean;
  ariaExpanded?: boolean;
}

export const ToolButton: React.FC<ToolButtonProps> = ({ icon, title, onClick, danger, active, size = 'md', className = '', disabled, ariaExpanded }) => (
  <button
    type="button"
    className={['pc-tool-btn', `is-${size}`, danger ? 'is-danger' : '', active ? 'is-active' : '', className].filter(Boolean).join(' ')}
    title={title}
    aria-label={title}
    aria-expanded={ariaExpanded}
    disabled={disabled}
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
  >
    {icon}
  </button>
);

// ---- 弹出面板：卡片 / 区块的 ⚙ 设置都用它 ----
interface PopoverProps {
  icon: React.ReactNode;
  title: string;
  children: (close: () => void) => React.ReactNode;
  className?: string;
}

export const Popover: React.FC<PopoverProps> = ({ icon, title, children, className = '' }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismissable(open, ref, close);

  return (
    <div className={`pc-popover-anchor ${open ? 'is-open' : ''}`} ref={ref}>
      <ToolButton icon={icon} title={title} active={open} ariaExpanded={open} onClick={() => setOpen(o => !o)} />
      {open && (
        <div className={`pc-popover ${className}`} role="dialog" aria-label={title}>
          <div className="pc-popover-title">{title}</div>
          {children(close)}
        </div>
      )}
    </div>
  );
};

/** 设置面板里的一行：左侧标签，右侧控件 */
export const SettingRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="pc-setting-row">
    <span className="pc-setting-label">{label}</span>
    <div className="pc-setting-control">{children}</div>
  </div>
);

export function SegmentedControl<T extends string | number>({ value, options, onChange }: { value: T; options: { value: T; label: React.ReactNode }[]; onChange: (v: T) => void }) {
  return (
    <div className="pc-segmented" role="radiogroup">
      {options.map(opt => (
        <button key={String(opt.value)} type="button" role="radio" aria-checked={value === opt.value} className={value === opt.value ? 'is-active' : ''} onClick={() => onChange(opt.value)}>
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export const SwitchControl: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label: string }> = ({ checked, onChange, label }) => (
  <label className="pc-switch">
    <input type="checkbox" role="switch" checked={checked} aria-label={label} onChange={(e) => onChange(e.target.checked)} />
    <span className="pc-switch-track" aria-hidden="true" />
  </label>
);

/** 所有设置面板底部统一的“上移 / 下移” */
export const MoveControls: React.FC<{ onMove: (dir: -1 | 1) => void; isFirst: boolean; isLast: boolean }> = ({ onMove, isFirst, isLast }) => {
  const { t } = useTranslation();
  return (
    <SettingRow label={t('controls.position')}>
      <div className="pc-segmented">
        <button type="button" disabled={isFirst} onClick={() => onMove(-1)}><ArrowUp size={13} /> {t('controls.moveUp')}</button>
        <button type="button" disabled={isLast} onClick={() => onMove(1)}><ArrowDown size={13} /> {t('controls.moveDown')}</button>
      </div>
    </SettingRow>
  );
};

// ---- 添加按钮：所有“添加 xx”都是同一个虚线样式 ----
interface AddButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'chip' | 'block' | 'tile';
  icon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export const AddButton: React.FC<AddButtonProps> = ({ label, onClick, variant = 'chip', icon, disabled, className = '' }) => (
  <button type="button" className={`pc-add-btn is-${variant} editor-only ${className}`} onClick={onClick} disabled={disabled}>
    {icon ?? <Plus size={variant === 'tile' ? 20 : 14} />}
    <span>{label}</span>
  </button>
);

/** 先显示“+ 添加标签”，点开后变成输入框；回车添加并保持输入状态，方便连续添加 */
export const InlineAdder: React.FC<{ label: string; placeholder: string; onAdd: (text: string) => void }> = ({ label, placeholder, onAdd }) => {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState('');
  // Esc 取消后输入框卸载，部分浏览器仍会触发 blur，用它避免把已取消的内容提交出去
  const cancelledRef = useRef(false);

  if (!editing) {
    return <AddButton label={label} onClick={() => { cancelledRef.current = false; setEditing(true); }} />;
  }

  const submit = () => {
    const value = text.trim();
    if (value) onAdd(value);
    setText('');
  };

  return (
    <span className="pc-inline-adder editor-only">
      <input
        autoFocus
        value={text}
        placeholder={placeholder}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (isSubmitEnter(e)) {
            e.preventDefault();
            submit();
          } else if (e.key === 'Escape') {
            e.stopPropagation();
            cancelledRef.current = true;
            setText('');
            setEditing(false);
          }
        }}
        onBlur={() => {
          if (!cancelledRef.current) submit();
          setEditing(false);
        }}
      />
    </span>
  );
};
