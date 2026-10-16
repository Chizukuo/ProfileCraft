import React from 'react';
import { Settings, X } from 'lucide-react';
import type { CardElement } from '../../types/data';
import { useTranslation } from '../../hooks/useTranslation';
import { MoveControls, Popover, ToolButton } from '../ui/EditorControls';

/** Card 传给每个区块组件的统一 props */
export interface BlockProps<T extends CardElement> {
  element: T;
  cardIndex: number;
  elementIndex: number;
  isFirst: boolean;
  isLast: boolean;
  onDelete: () => void;
  onMove: (direction: -1 | 1) => void;
}

interface BlockShellProps {
  /** 设置面板标题，一般是区块类型名 */
  title: string;
  className?: string;
  /** 区块特有的设置项，显示在“上移 / 下移”上方 */
  settings?: (close: () => void) => React.ReactNode;
  isFirst: boolean;
  isLast: boolean;
  onDelete: () => void;
  onMove: (direction: -1 | 1) => void;
  children: React.ReactNode;
}

/**
 * 所有区块的统一外壳：右上角同一组控件（⚙ 设置、× 删除），悬停显示，触屏常显。
 * 删除不再弹确认框，由撤销提示兜底。
 */
const BlockShell: React.FC<BlockShellProps> = ({ title, className = '', settings, isFirst, isLast, onDelete, onMove, children }) => {
  const { t } = useTranslation();
  return (
    <div className={`element-container pc-hover-scope ${className}`}>
      {children}
      <div className="pc-controls editor-only">
        <Popover icon={<Settings size={14} />} title={title}>
          {(close) => (
            <>
              {settings?.(close)}
              <MoveControls onMove={onMove} isFirst={isFirst} isLast={isLast} />
            </>
          )}
        </Popover>
        <ToolButton danger icon={<X size={14} />} title={t('controls.deleteBlock')} onClick={onDelete} />
      </div>
    </div>
  );
};

export default BlockShell;
