import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { ProfileData } from '../types/data';
import { useProfileData } from '../hooks/useProfileData';

// --- 数据 Context（只读，订阅数据变化）---
interface ProfileDataContextType {
  profileData: ProfileData | null;
  isLoaded: boolean;
}

// --- 操作 Context（稳定引用，不随数据变化重渲染）---
interface ProfileActionsContextType {
  updateProfileData: (updater: (prev: ProfileData) => ProfileData) => void;
  resetProfileData: () => void;
}

const ProfileDataContext = createContext<ProfileDataContextType | undefined>(undefined);
const ProfileActionsContext = createContext<ProfileActionsContextType | undefined>(undefined);

export const ProfileProvider = ({ children }: { children: ReactNode }) => {
  const { profileData, isLoaded, updateProfileData, resetProfileData } = useProfileData();

  const dataValue = useMemo(
    () => ({ profileData, isLoaded }),
    [profileData, isLoaded]
  );

  const actionsValue = useMemo(
    () => ({ updateProfileData, resetProfileData }),
    [updateProfileData, resetProfileData]
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