import React, { createContext, useContext, ReactNode } from 'react';
import { ProfileData } from '../types/data';
import { useProfileData } from '../hooks/useProfileData';

interface ProfileContextType {
  profileData: ProfileData | null;
  updateProfileData: (updater: (prev: ProfileData) => ProfileData) => void;
  resetProfileData: () => void;
  isLoaded: boolean;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider = ({ children }: { children: ReactNode }) => {
  const value = useProfileData();

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};