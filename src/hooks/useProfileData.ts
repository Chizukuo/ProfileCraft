import { useState, useEffect, useCallback } from 'react';
import { ProfileData } from '../types/data';
import { getDefaultProfileData } from '../utils/data';

const DATA_KEY = 'kuolieProfileData';

export const useProfileData = () => {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const savedData = localStorage.getItem(DATA_KEY);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        if (parsedData && parsedData.userSettings && parsedData.cards) {
          setProfileData(parsedData);
        } else {
          setProfileData(getDefaultProfileData());
        }
      } else {
        setProfileData(getDefaultProfileData());
      }
    } catch (error) {
      console.error("Failed to load or parse profile data, using default.", error);
      setProfileData(getDefaultProfileData());
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded && profileData) {
      try {
        localStorage.setItem(DATA_KEY, JSON.stringify(profileData));
      } catch (error) {
        console.error("Failed to save profile data.", error);
      }
    }
  }, [profileData, isLoaded]);

  const updateProfileData = useCallback((updater: (prev: ProfileData) => ProfileData) => {
    setProfileData(prev => prev ? updater(prev) : null);
  }, []);

  const resetProfileData = useCallback(() => {
    // REMOVED: The window.confirm logic is now handled in the Toolbar component.
    // This function now only handles the data reset.
    setProfileData(getDefaultProfileData());
  }, []);

  return { profileData, updateProfileData, resetProfileData, isLoaded };
};