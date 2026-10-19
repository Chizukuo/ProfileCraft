import { useState, useEffect, useCallback, useRef } from 'react';
import { ProfileData } from '../types/data';
import { getDefaultProfileData } from '../utils/data';
import { normalizeProfileData, fixCardLayouts } from '../utils/profileSchema';
import { safeGetItem, safeSetItem } from '../utils/storage';

export const DATA_KEY = 'kuolieProfileData';
const SAVE_DEBOUNCE_MS = 500;

const MAX_UNDO_STEPS = 30;

/** 可撤销操作的类型，对应撤销提示文案 undo.<label> */
export type UndoLabel =
  | 'import' | 'ai' | 'style' | 'reset' | 'blank'
  | 'deleteCard' | 'deleteBlock' | 'deleteTag' | 'deleteItem' | 'deleteImage';

/** 整体替换数据的来源 */
export type ReplaceReason = Extract<UndoLabel, 'import' | 'ai' | 'style' | 'reset' | 'blank'>;

export interface PendingUndo {
  label: UndoLabel;
  at: number;
}

/** 读不出来的旧数据先原样备份，避免随后的自动保存用默认模板把它覆盖掉 */
export const BACKUP_KEY = 'kuolieProfileData.unreadable';

const loadInitialData = (): { data: ProfileData; backedUp: boolean } => {
  const saved = safeGetItem(DATA_KEY);
  if (saved) {
    try {
      const normalized = normalizeProfileData(JSON.parse(saved));
      if (normalized) return { data: normalized, backedUp: false };
      console.error('Saved profile data has an unknown shape; backed up and using default.');
    } catch (error) {
      console.error('Failed to load saved profile data; backed up and using default.', error);
    }
    safeSetItem(BACKUP_KEY, saved);
  }
  const data = getDefaultProfileData();
  return { data: { ...data, cards: fixCardLayouts(data.cards) }, backedUp: Boolean(saved) };
};

export const useProfileData = () => {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [pendingUndo, setPendingUndo] = useState<PendingUndo | null>(null);
  /** 启动时发现读不出来的旧数据，已备份到 BACKUP_KEY */
  const [unreadableBackup, setUnreadableBackup] = useState(false);
  const saveTimerRef = useRef<number | null>(null);
  const latestRef = useRef<ProfileData | null>(null);
  // 当前渲染时的数据；撤销快照取自这里，而不是在 setState 的 updater 里做副作用（StrictMode 会调用两次）
  const currentRef = useRef<ProfileData | null>(null);
  currentRef.current = profileData;
  const historyRef = useRef<ProfileData[]>([]);

  useEffect(() => {
    const { data, backedUp } = loadInitialData();
    setProfileData(data);
    setUnreadableBackup(backedUp);
    setIsLoaded(true);
  }, []);

  const writeNow = useCallback(() => {
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    if (!latestRef.current) return;
    const ok = safeSetItem(DATA_KEY, JSON.stringify(latestRef.current));
    setSaveError(!ok);
    if (!ok) console.error('Failed to save profile data (storage full or unavailable).');
  }, []);

  // 防抖持久化：数据变更后 500ms 才写入 localStorage，避免频繁写入
  useEffect(() => {
    if (!isLoaded || !profileData) return;
    latestRef.current = profileData;
    if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(writeNow, SAVE_DEBOUNCE_MS);
  }, [profileData, isLoaded, writeNow]);

  // 关闭页面 / 切到后台时立刻落盘，避免丢掉防抖窗口内的修改
  useEffect(() => {
    const flush = () => {
      if (saveTimerRef.current !== null) writeNow();
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onVisibility);
      flush();
    };
  }, [writeNow]);

  /**
   * 撤销只在“删除 / 替换是最近一次修改”时有效：撤销是整份快照回滚，
   * 如果之后用户又做了别的修改，再回滚会把那些修改一起丢掉。所以任何用户修改都会清空撤销历史。
   */
  const clearHistory = useCallback(() => {
    if (historyRef.current.length === 0) return;
    historyRef.current = [];
    setPendingUndo(null);
  }, []);

  /** 用户发起的修改（会让之前的删除不可再撤销） */
  const updateProfileData = useCallback((updater: (prev: ProfileData) => ProfileData) => {
    clearHistory();
    setProfileData(prev => (prev ? updater(prev) : null));
  }, [clearHistory]);

  /** 自动的布局修正（高度同步、网格压实），不影响撤销历史 */
  const updateLayout = useCallback((updater: (prev: ProfileData) => ProfileData) => {
    setProfileData(prev => (prev ? updater(prev) : null));
  }, []);

  /** 执行一次可撤销的修改：删除、整体替换等。底部会出现撤销提示，也可以按 Ctrl/⌘+Z */
  const commitWithUndo = useCallback((updater: (prev: ProfileData) => ProfileData, label: UndoLabel) => {
    const snapshot = currentRef.current;
    if (!snapshot) return;
    historyRef.current = [...historyRef.current.slice(-(MAX_UNDO_STEPS - 1)), snapshot];
    setProfileData(prev => (prev ? updater(prev) : prev));
    setPendingUndo({ label, at: Date.now() });
  }, []);

  /** 整体替换（导入、AI 生成、恢复默认） */
  const replaceProfileData = useCallback((next: ProfileData, reason: ReplaceReason) => {
    commitWithUndo(() => ({ ...next, cards: fixCardLayouts(next.cards) }), reason);
  }, [commitWithUndo]);

  const resetProfileData = useCallback(() => {
    replaceProfileData(getDefaultProfileData(), 'reset');
  }, [replaceProfileData]);

  /** 撤销最近一次可撤销操作；返回是否有可撤销的内容 */
  const undo = useCallback(() => {
    const snapshot = historyRef.current[historyRef.current.length - 1];
    if (!snapshot) return false;
    historyRef.current = historyRef.current.slice(0, -1);
    setProfileData(snapshot);
    setPendingUndo(null);
    return true;
  }, []);

  const dismissUndo = useCallback(() => {
    setPendingUndo(null);
  }, []);

  return {
    profileData,
    isLoaded,
    saveError,
    unreadableBackup,
    pendingUndo,
    updateProfileData,
    updateLayout,
    commitWithUndo,
    replaceProfileData,
    resetProfileData,
    undo,
    dismissUndo,
  };
};
