import React, { useRef } from 'react';
import { AvatarElement } from '../../types/data';
import { useProfileDataCtx } from '../../context/ProfileContext';
import { useElementActions } from '../../hooks/useElementActions';
import { useSettingsImageUpload } from '../../hooks/useSettingsImageUpload';
import { useTranslation } from '../../hooks/useTranslation';
import BlockShell, { BlockProps } from './BlockShell';
import { SegmentedControl, SettingRow } from '../ui/EditorControls';

const AvatarBlock: React.FC<BlockProps<AvatarElement>> = ({ element, cardIndex, elementIndex, ...shell }) => {
    const { profileData } = useProfileDataCtx();
    const { update } = useElementActions<AvatarElement>(cardIndex, elementIndex);
    const upload = useSettingsImageUpload('avatarSrc');
    const { t } = useTranslation();
    const inputRef = useRef<HTMLInputElement>(null);

    return (
        <BlockShell
            title={t('blockTypes.avatar')}
            className="avatar-block"
            {...shell}
            settings={() => (
                <>
                    <SettingRow label={t('controls.size')}>
                        <SegmentedControl
                            value={element.size}
                            options={[{ value: 'sm', label: t('controls.sizeSm') }, { value: 'md', label: t('controls.sizeMd') }, { value: 'lg', label: t('controls.sizeLg') }]}
                            onChange={(size) => update({ size })}
                        />
                    </SettingRow>
                    <SettingRow label={t('controls.shape')}>
                        <SegmentedControl
                            value={element.shape}
                            options={[{ value: 'circle', label: t('controls.shapeCircle') }, { value: 'rounded', label: t('controls.shapeRounded') }]}
                            onChange={(shape) => update({ shape })}
                        />
                    </SettingRow>
                </>
            )}
        >
            <button
                type="button"
                className={`avatar-container pc-replaceable is-${element.size} is-${element.shape}`}
                onClick={() => inputRef.current?.click()}
                aria-label={t('block.changeAvatar')}
            >
                <img src={profileData?.userSettings.avatarSrc} alt={t('block.avatarAlt')} />
            </button>
            <input ref={inputRef} type="file" accept="image/*" className="hidden-file-input" onChange={upload} />
        </BlockShell>
    );
};

export default AvatarBlock;
