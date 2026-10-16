import React, { useRef } from 'react';
import { QrCodeElement } from '../../types/data';
import { useProfile } from '../../context/ProfileContext';
import { useSettingsImageUpload } from '../../hooks/useSettingsImageUpload';
import { useTranslation } from '../../hooks/useTranslation';
import QRCodeDisplay from '../QRCodeDisplay';
import BlockShell, { BlockProps } from './BlockShell';
import { SegmentedControl, SettingRow } from '../ui/EditorControls';

/** 二维码：用链接生成，或上传二维码图片（微信等无法用链接生成的场景）。数据存在 userSettings，全局共用 */
const QrCodeBlock: React.FC<BlockProps<QrCodeElement>> = ({ isFirst, isLast, onDelete, onMove }) => {
    const shell = { isFirst, isLast, onDelete, onMove };
    const { profileData, updateProfileData } = useProfile();
    const upload = useSettingsImageUpload('qrCodeImage');
    const { t } = useTranslation();
    const inputRef = useRef<HTMLInputElement>(null);

    if (!profileData) return null;
    const { qrCodeImage, qrCodeLink } = profileData.userSettings;
    const mode = qrCodeImage ? 'image' : 'link';

    const setLink = (link: string) => updateProfileData(prev => ({ ...prev, userSettings: { ...prev.userSettings, qrCodeLink: link } }));
    const switchToLink = () => updateProfileData(prev => ({ ...prev, userSettings: { ...prev.userSettings, qrCodeImage: undefined } }));

    return (
        <BlockShell
            title={t('blockTypes.qrCode')}
            className="qr-code-block"
            {...shell}
            settings={() => (
                <SettingRow label={t('controls.qrSource')}>
                    <SegmentedControl
                        value={mode}
                        options={[{ value: 'link', label: t('controls.qrFromLink') }, { value: 'image', label: t('controls.qrFromImage') }]}
                        onChange={(next) => (next === 'link' ? switchToLink() : inputRef.current?.click())}
                    />
                </SettingRow>
            )}
        >
            <div className="qr-code-wrapper">
                <button type="button" className="qr-replace pc-replaceable" onClick={() => inputRef.current?.click()} aria-label={t('block.uploadQrImage')}>
                    {qrCodeImage ? (
                        <div className="qr-code-container qr-code-image">
                            <img src={qrCodeImage} alt={t('block.qrAlt')} />
                        </div>
                    ) : (
                        <QRCodeDisplay link={qrCodeLink} />
                    )}
                </button>
                {mode === 'link' && (
                    <input
                        type="text"
                        className="qr-code-link-input editor-only"
                        value={qrCodeLink}
                        placeholder={t('block.qrLinkPlaceholder')}
                        aria-label={t('block.qrLinkPlaceholder')}
                        onChange={(e) => setLink(e.target.value)}
                    />
                )}
            </div>
            <input ref={inputRef} type="file" accept="image/*" className="hidden-file-input" onChange={upload} />
        </BlockShell>
    );
};

export default QrCodeBlock;
