import React, { useEffect } from 'react';
import { RotateCcw, X } from 'lucide-react';
import { useProfileDataCtx, useProfileActions } from '../../context/ProfileContext';
import { useTranslation } from '../../hooks/useTranslation';

const UNDO_VISIBLE_MS = 8000;

/** 删除、导入、AI 生成、恢复默认之后的撤销提示；Ctrl/⌘+Z 在 App 里全局监听 */
const UndoToast: React.FC = () => {
  const { pendingUndo } = useProfileDataCtx();
  const { undo, dismissUndo } = useProfileActions();
  const { t } = useTranslation();

  useEffect(() => {
    if (!pendingUndo) return;
    const timer = window.setTimeout(dismissUndo, UNDO_VISIBLE_MS);
    return () => window.clearTimeout(timer);
  }, [pendingUndo, dismissUndo]);

  if (!pendingUndo) return null;

  return (
    <div className="undo-toast" role="status" aria-live="polite" key={pendingUndo.at}>
      <span>{t(`undo.${pendingUndo.label}`)}</span>
      <button type="button" className="undo-toast-action" onClick={undo}>
        <RotateCcw size={14} /> {t('undo.action')}
        <kbd className="undo-toast-kbd">{/Mac|iPhone|iPad/.test(navigator.platform) ? '⌘Z' : 'Ctrl+Z'}</kbd>
      </button>
      <button type="button" className="undo-toast-close" onClick={dismissUndo} aria-label={t('common.close')}>
        <X size={14} />
      </button>
    </div>
  );
};

export default UndoToast;
