import React from 'react';
import type { TagTone } from '../../types/data';
import { useTranslation } from '../../hooks/useTranslation';
import { SegmentedControl, SettingRow } from '../ui/EditorControls';

/** 标签组容器上的配色类名（样式见 App.css 的 .tone-*，会随导出一起带走） */
export const toneClass = (tone?: TagTone) => (tone && tone !== 'default' ? ` tone-${tone}` : '');

/** 标签区块 ⚙ 里的“配色”设置：默认 / 醒目 / 描边 / 雷点 */
const TagToneSetting: React.FC<{ value?: TagTone; onChange: (tone: TagTone) => void }> = ({ value = 'default', onChange }) => {
  const { t } = useTranslation();
  return (
    <SettingRow label={t('controls.tagTone')}>
      <SegmentedControl<TagTone>
        value={value}
        options={[
          { value: 'default', label: t('controls.toneDefault') },
          { value: 'strong', label: t('controls.toneStrong') },
          { value: 'outline', label: t('controls.toneOutline') },
          { value: 'ng', label: t('controls.toneNg') },
        ]}
        onChange={onChange}
      />
    </SettingRow>
  );
};

export default TagToneSetting;
