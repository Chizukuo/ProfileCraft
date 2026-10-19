import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';

// 编辑器界面状态（与数据无关）：预览模式、外观面板开关。
// 放在 Context 里，让卡片里的“全局外观设置”链接、预览条、底部 Dock 共用同一份状态。
interface EditorUIContextType {
  isPreview: boolean;
  setPreview: (value: boolean) => void;
  isCustomizeOpen: boolean;
  setCustomizeOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
}

const EditorUIContext = createContext<EditorUIContextType | undefined>(undefined);

export const EditorUIProvider = ({ children }: { children: ReactNode }) => {
  const [isPreview, setPreview] = useState(false);
  const [isCustomizeOpen, setCustomizeOpen] = useState(false);

  // 预览模式与导出共用 .pc-static 样式（隐藏所有 .editor-only 控件）
  useEffect(() => {
    document.body.classList.toggle('pc-static', isPreview);
    if (!isPreview) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.querySelector('.modal-overlay, .customize-panel')) setPreview(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isPreview]);

  const setPreviewStable = useCallback((value: boolean) => setPreview(value), []);

  const value = useMemo(
    () => ({ isPreview, setPreview: setPreviewStable, isCustomizeOpen, setCustomizeOpen }),
    [isPreview, setPreviewStable, isCustomizeOpen]
  );

  return <EditorUIContext.Provider value={value}>{children}</EditorUIContext.Provider>;
};

export const useEditorUI = () => {
  const context = useContext(EditorUIContext);
  if (!context) throw new Error('useEditorUI must be used within an EditorUIProvider');
  return context;
};
