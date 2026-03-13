import { useState, useEffect, useCallback, useRef } from 'react';
import { ProfileData } from '../types/data';
import { getDefaultProfileData } from '../utils/data';

const DATA_KEY = 'kuolieProfileData';
const SAVE_DEBOUNCE_MS = 500;

export const useProfileData = () => {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const saveTimerRef = useRef<number | null>(null);

  // 初始化：从 localStorage 加载数据
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
      console.error('Failed to load or parse profile data, using default.', error);
      setProfileData(getDefaultProfileData());
    }
    setIsLoaded(true);
  }, []);

  // 防抖持久化：数据变更后 500ms 才写入 localStorage，避免频繁写入
  useEffect(() => {
    if (!isLoaded || !profileData) return;

    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = window.setTimeout(() => {
      try {
        localStorage.setItem(DATA_KEY, JSON.stringify(profileData));
      } catch (error) {
        console.error('Failed to save profile data.', error);
      }
      saveTimerRef.current = null;
    }, SAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, [profileData, isLoaded]);

  const updateProfileData = useCallback((updater: (prev: ProfileData) => ProfileData) => {
    setProfileData(prev => (prev ? updater(prev) : null));
  }, []);

  const resetProfileData = useCallback(() => {
    setProfileData(getDefaultProfileData());
  }, []);

  return { profileData, updateProfileData, resetProfileData, isLoaded };
};