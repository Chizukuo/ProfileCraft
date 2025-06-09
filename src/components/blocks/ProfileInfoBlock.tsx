import React from 'react';
import { useProfile } from '../../context/ProfileContext';
import { ProfileInfoElement } from '../../types/data';
import EditableText from '../ui/EditableText';
import QRCodeDisplay from '../QRCodeDisplay';
import ActionButton from '../ui/ActionButton';
import { X } from 'lucide-react';

interface ProfileInfoBlockProps {
    element: ProfileInfoElement;
    cardIndex: number;
    elementIndex: number;
    onDelete: () => void;
}

const ProfileInfoBlock: React.FC<ProfileInfoBlockProps> = ({ element, cardIndex, elementIndex, onDelete }) => {
    const { profileData, updateProfileData } = useProfile();

    const handleUpdate = (field: keyof ProfileInfoElement | 'qrCodeLink' | 'avatarSrc', value: any) => {
        if (field === 'qrCodeLink' || field === 'avatarSrc') {
            updateProfileData(prev => ({
                ...prev!,
                userSettings: { ...prev!.userSettings, [field]: value }
            }));
        } else {
            updateProfileData(prev => ({
                ...prev!,
                cards: prev!.cards.map((card, i) => {
                    if (i === cardIndex) {
                        return {
                            ...card,
                            elements: card.elements.map((el, j) => {
                                if (j === elementIndex) {
                                    return { ...el, [field]: value };
                                }
                                return el;
                            })
                        };
                    }
                    return card;
                })
            }));
        }
    };

    const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                handleUpdate('avatarSrc', event.target?.result);
            };
            reader.readAsDataURL(file);
        }
    };
    
    if(!profileData) return null;

    const labels: Record<keyof Omit<ProfileInfoElement, 'type'|'styles'|'textStyles'>, string> = { nickname: '昵称', gender: '性别', age: '年龄', location: '常驻', mbti: 'MBTI' };

    return (
        <div className="element-container profile-section-layout">
            <div className="avatar-container">
                <img src={profileData.userSettings.avatarSrc} alt="用户头像" onClick={() => document.getElementById('avatarUploadInput')?.click()} />
                <input type="file" id="avatarUploadInput" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />
            </div>

            <div className="profile-info-text">
                {(Object.keys(labels) as Array<keyof typeof labels>).map(key => (
                    <p className="content-text mb-1" key={key}>
                        <strong>{labels[key]}: </strong>
                        <EditableText
                            as="span"
                            html={element[key]}
                            styles={element.textStyles}
                            onUpdate={(html) => handleUpdate(key, html)}
                            onStyleUpdate={(styles) => handleUpdate('textStyles', styles)}
                        />
                    </p>
                ))}
            </div>

            <div className="qr-code-wrapper">
                <QRCodeDisplay link={profileData.userSettings.qrCodeLink} />
                <input
                    type="text"
                    className="qr-code-link-input"
                    value={profileData.userSettings.qrCodeLink}
                    placeholder="二维码链接"
                    onChange={(e) => handleUpdate('qrCodeLink', e.target.value)}
                />
                 <p className="text-sm text-gray-500 mt-1">编辑上方链接并回车更新二维码</p>
            </div>
            {/* ProfileInfoBlock is not deletable, so no delete button */}
        </div>
    );
};

export default ProfileInfoBlock;
