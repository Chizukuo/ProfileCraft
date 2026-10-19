import React from 'react';
import { useProfile } from '../context/ProfileContext';
import { UserSettings } from '../types/data';
import EditableText from './ui/EditableText';
import { defaultFooter } from '../utils/data';
import { useStartBlank } from '../hooks/useStartBlank';
import { useTranslation } from '../hooks/useTranslation';
import { AddButton } from './ui/EditorControls';

const ProfileHeader: React.FC<{ showSubtitle: boolean }> = ({ showSubtitle }) => {
    const { profileData, updateProfileData } = useProfile();
    const startBlank = useStartBlank();
    const { t } = useTranslation();

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
                onUpdate={(html) => updateProfileData(prev => ({
                    ...prev,
                    userSettings: {
                        ...prev.userSettings,
                        mainTitle: html,
                        // 页脚还是默认的“© 年份 旧称呼.”时跟着改，免得改了名字页脚还写着别人
                        ...(prev.userSettings.footerText === defaultFooter(prev.userSettings.mainTitle) ? { footerText: defaultFooter(html) } : {}),
                    },
                }))}
                onStyleUpdate={(styles) => handleUpdate('mainTitleStyles', styles)}
            />
            {showSubtitle && <EditableText
                as="p"
                className="subtitle subtitle-text"
                html={profileData.userSettings.subtitle}
                styles={profileData.userSettings.subtitleStyles}
                onUpdate={(html) => handleUpdate('subtitle', html)}
                onStyleUpdate={(styles) => handleUpdate('subtitleStyles', styles)}
            />}
            <div className="profile-start-actions editor-only">
                <AddButton label={t('toolbar.startBlank')} onClick={startBlank} />
            </div>
        </header>
    );
};

export default ProfileHeader;
