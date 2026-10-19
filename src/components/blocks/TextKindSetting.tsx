import React from 'react';
import type { CardElement } from '../../types/data';
import { useTranslation } from '../../hooks/useTranslation';
import { SegmentedControl, SettingRow } from '../ui/EditorControls';

type TextKind = 'paragraph' | 'heading';

/**
 * 段落和标题区块 ⚙ 里的“类型”切换：文字保留，只换区块类型。
 * 以前想把一句话变成大字标题，只能删掉段落再新加一个标题区块。
 */
const TextKindSetting: React.FC<{ kind: TextKind; text: string; onReplace: (next: CardElement) => void }> = ({ kind, text, onReplace }) => {
  const { t } = useTranslation();
  return (
    <SettingRow label={t('controls.blockKind')}>
      <SegmentedControl<TextKind>
        value={kind}
        options={[{ value: 'paragraph', label: t('blockTypes.paragraph') }, { value: 'heading', label: t('blockTypes.heading') }]}
        onChange={(next) => {
          if (next === kind) return;
          onReplace(next === 'heading'
            ? { type: 'heading', text, size: 'md', styles: { fontWeight: '700', fontFamily: '' } }
            : { type: 'paragraph', text, styles: { fontWeight: '400', fontSize: '15', fontFamily: '' } });
        }}
      />
    </SettingRow>
  );
};

export default TextKindSetting;
