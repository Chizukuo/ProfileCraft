import type React from 'react';

/**
 * 输入法（拼音、假名等）组字时按回车是在确认候选词，不应触发提交。
 * keyCode 229 兼容 Safari 在 compositionend 之后才派发 keydown 的情况。
 */
export const isImeComposing = (e: React.KeyboardEvent) =>
  e.nativeEvent.isComposing || e.keyCode === 229;

export const isSubmitEnter = (e: React.KeyboardEvent) => e.key === 'Enter' && !isImeComposing(e);
