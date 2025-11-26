import React, { useEffect } from 'react';
import { useProfile } from '../../context/ProfileContext';
import { ProfileInfoElement, ProfileItem } from '../../types/data';
import EditableText from '../ui/EditableText';
import QRCodeDisplay from '../QRCodeDisplay';
import ActionButton from '../ui/ActionButton';
import { X, Plus, Trash2 } from 'lucide-react';

interface ProfileInfoBlockProps {
    element: ProfileInfoElement;
    cardIndex: number;
    elementIndex: number;
    onDelete: () => void;
}

const ProfileInfoBlock: React.FC<ProfileInfoBlockProps> = ({ element, cardIndex, elementIndex, onDelete }) => {
    const { profileData, updateProfileData } = useProfile();

    // Migration effect: Convert old fields to items array if items is missing
    useEffect(() => {
        if (!element.items && profileData) {
            const newItems: ProfileItem[] = [
                { label: '昵称', value: element.nickname || '你的昵称' },
                { label: '性别', value: element.gender || '保密' },
                { label: '年龄', value: element.age || '18' },
                { label: '常驻', value: element.location || '虚拟世界' },
                { label: 'MBTI', value: element.mbti || 'INFP' },
            ];
            
            updateProfileData(prev => ({
                ...prev!,
                cards: prev!.cards.map((card, i) => {
                    if (i === cardIndex) {
                        return {
                            ...card,
                            elements: card.elements.map((el, j) => {
                                if (j === elementIndex) {
                                    return { ...el, items: newItems };
                                }
                                return el;
                            })
                        };
                    }
                    return card;
                })
            }));
        }
    }, [element.items, cardIndex, elementIndex, updateProfileData, element.nickname, element.gender, element.age, element.location, element.mbti, profileData]);

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

    const handleItemUpdate = (index: number, field: keyof ProfileItem, value: string) => {
        if (!element.items) return;
        const newItems = [...element.items];
        newItems[index] = { ...newItems[index], [field]: value };
        handleUpdate('items', newItems);
    };

    const handleAddItem = () => {
        const newItems = [...(element.items || []), { label: '新项目', value: '内容' }];
        handleUpdate('items', newItems);
    };

    const handleDeleteItem = (index: number) => {
        if (!element.items) return;
        const newItems = element.items.filter((_, i) => i !== index);
        handleUpdate('items', newItems);
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

    return (
        <div className="element-container profile-section-layout">
            <div className="avatar-container">
                <img src={profileData.userSettings.avatarSrc} alt="用户头像" onClick={() => document.getElementById('avatarUploadInput')?.click()} />
                <input type="file" id="avatarUploadInput" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />
            </div>

            <div className="profile-info-text">
                {element.items?.map((item, index) => (
                    <div className="content-text mb-1 profile-item-row" key={index} style={{ display: 'flex', alignItems: 'baseline', gap: '4px', position: 'relative' }}>
                        <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', flexShrink: 0 }}>
                            <EditableText
                                as="span"
                                html={item.label}
                                onUpdate={(val) => handleItemUpdate(index, 'label', val)}
                            />
                            <span style={{ marginLeft: '2px' }}>:</span>
                        </div>
                        <div style={{ wordBreak: 'break-word' }}>
                            <EditableText
                                as="span"
                                html={item.value}
                                styles={element.textStyles}
                                onUpdate={(val) => handleItemUpdate(index, 'value', val)}
                                onStyleUpdate={(styles) => handleUpdate('textStyles', styles)}
                            />
                        </div>
                        <button 
                            onClick={() => handleDeleteItem(index)} 
                            className="delete-item-btn action-button"
                            style={{ 
                                position: 'absolute',
                                right: '-28px',
                                top: '0',
                                width: '24px', 
                                height: '24px', 
                                padding: '4px', 
                                opacity: 0, 
                                transition: 'opacity 0.2s',
                                zIndex: 10
                            }}
                            title="删除此项"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}>
                    <button 
                        onClick={handleAddItem} 
                        className="add-item-btn action-button"
                        style={{ width: 'auto', height: 'auto', padding: '4px 12px', fontSize: '12px', borderRadius: '12px' }}
                    >
                        <Plus size={12} style={{ marginRight: '4px' }} /> 添加信息
                    </button>
                </div>
                
                <style>{`
                    .profile-item-row:hover .delete-item-btn {
                        opacity: 1 !important;
                    }
                    /* Hide buttons during export */
                    @media print {
                        .delete-item-btn, .add-item-btn { display: none !important; }
                    }
                `}</style>
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
