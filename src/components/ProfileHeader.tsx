import React from 'react';
import { useProfile } from '../context/ProfileContext';
import { UserSettings } from '../types/data';
import EditableText from './ui/EditableText';

const ProfileHeader: React.FC = () => {
    const { profileData, updateProfileData } = useProfile();

    if (!profileData) return null;

    const handleUpdate = (field: keyof UserSettings, value: string | object) => {
        updateProfileData(prev => ({
            ...prev,
            userSettings: {
                ...prev.userSettings,
                [field]: value
            }
        }));
    };

    return (
        <header className="main-header-container">
            <EditableText
                as="h1"
                className="main-title main-title-text"
                html={profileData.userSettings.mainTitle}
                styles={profileData.userSettings.mainTitleStyles}
                onUpdate={(html) => handleUpdate('mainTitle', html)}
                onStyleUpdate={(styles) => handleUpdate('mainTitleStyles', styles)}
            />
            <EditableText
                as="p"
                className="subtitle subtitle-text"
                html={profileData.userSettings.subtitle}
                styles={profileData.userSettings.subtitleStyles}
                onUpdate={(html) => handleUpdate('subtitle', html)}
                onStyleUpdate={(styles) => handleUpdate('subtitleStyles', styles)}
            />
        </header>
    );
};

export default ProfileHeader;