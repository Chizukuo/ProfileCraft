import { useEffect, type RefObject } from 'react';

/** 弹出层打开时，点击容器外部或按 Esc 关闭 */
export const useDismissable = (isOpen: boolean, containerRef: RefObject<HTMLElement | null>, onDismiss: () => void) => {
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const container = containerRef.current;
      if (container && !container.contains(event.target as Node)) onDismiss();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onDismiss();
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown, { passive: true });
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, containerRef, onDismiss]);
};
