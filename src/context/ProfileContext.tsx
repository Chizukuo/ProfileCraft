import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { ProfileData } from '../types/data';
import { useProfileData, type PendingUndo, type ReplaceReason, type UndoLabel } from '../hooks/useProfileData';

// --- 数据 Context（只读，订阅数据变化）---
interface ProfileDataContextType {
  profileData: ProfileData | null;
  isLoaded: boolean;
  /** 最近一次写入 localStorage 失败（通常是图片太多导致配额不足） */
  saveError: boolean;
  /** 启动时旧数据读取失败、已原样备份（SaveErrorBanner 提供下载） */
  unreadableBackup: boolean;
  pendingUndo: PendingUndo | null;
}

// --- 操作 Context（稳定引用，不随数据变化重渲染）---
interface ProfileActionsContextType {
  /** 用户修改；会清空撤销历史（之前的删除不能再撤销） */
  updateProfileData: (updater: (prev: ProfileData) => ProfileData) => void;
  /** 自动布局修正（高度同步、网格压实），不影响撤销历史 */
  updateLayout: (updater: (prev: ProfileData) => ProfileData) => void;
  /** 可撤销的修改（删除等），会显示撤销提示 */
  commitWithUndo: (updater: (prev: ProfileData) => ProfileData, label: UndoLabel) => void;
  replaceProfileData: (next: ProfileData, reason: ReplaceReason) => void;
  resetProfileData: () => void;
  undo: () => boolean;
  dismissUndo: () => void;
}

const ProfileDataContext = createContext<ProfileDataContextType | undefined>(undefined);
const ProfileActionsContext = createContext<ProfileActionsContextType | undefined>(undefined);

export const ProfileProvider = ({ children }: { children: ReactNode }) => {
  const {
    profileData, isLoaded, saveError, unreadableBackup, pendingUndo,
    updateProfileData, updateLayout, commitWithUndo, replaceProfileData, resetProfileData, undo, dismissUndo,
  } = useProfileData();

  const dataValue = useMemo(
    () => ({ profileData, isLoaded, saveError, unreadableBackup, pendingUndo }),
    [profileData, isLoaded, saveError, unreadableBackup, pendingUndo]
  );

  const actionsValue = useMemo(
    () => ({ updateProfileData, updateLayout, commitWithUndo, replaceProfileData, resetProfileData, undo, dismissUndo }),
    [updateProfileData, updateLayout, commitWithUndo, replaceProfileData, resetProfileData, undo, dismissUndo]
  );

  return (
    <ProfileDataContext.Provider value={dataValue}>
      <ProfileActionsContext.Provider value={actionsValue}>
        {children}
      </ProfileActionsContext.Provider>
    </ProfileDataContext.Provider>
  );
};

/** 只订阅数据层（推荐用于只读数据的组件）*/
export const useProfileDataCtx = () => {
  const context = useContext(ProfileDataContext);
  if (context === undefined) {
    throw new Error('useProfileDataCtx must be used within a ProfileProvider');
  }
  return context;
};

/** 只订阅操作层（推荐用于只触发数据变更的组件，不随数据变化重渲染）*/
export const useProfileActions = () => {
  const context = useContext(ProfileActionsContext);
  if (context === undefined) {
    throw new Error('useProfileActions must be used within a ProfileProvider');
  }
  return context;
};

/** 兼容原有用法：同时返回数据和操作 */
export const useProfile = () => {
  const data = useProfileDataCtx();
  const actions = useProfileActions();
  return { ...data, ...actions };
};
