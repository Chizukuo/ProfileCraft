import React, { useEffect, useState } from 'react';

// 加载屏出现时翻译文件可能还没加载完，提示保持中文；内容与使用指南的“统一交互规则”一致
const LOADING_TIPS = [
  '点文字直接改，点图片直接换。',
  '鼠标移到卡片或区块上，右上角 ⚙ 是设置、× 是删除。',
  '删错了？按 Ctrl+Z 或点底部的「撤销」。',
  '「外观」里可以换背景、卡片颜色、间距和字体。',
  '点「预览」看导出效果，再一键导出图片或 HTML。',
];

const getRandomTipIndex = (excludeIndex?: number) => {
  if (LOADING_TIPS.length <= 1) return 0;
  let next = Math.floor(Math.random() * LOADING_TIPS.length);
  while (next === excludeIndex) {
    next = Math.floor(Math.random() * LOADING_TIPS.length);
  }
  return next;
};

interface LoadingScreenProps {
  isExiting?: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ isExiting = false }) => {
  const [tipIndex, setTipIndex] = useState(() => getRandomTipIndex());

  useEffect(() => {
    if (isExiting) return;

    const timer = window.setInterval(() => {
      setTipIndex((prev) => getRandomTipIndex(prev));
    }, 1800);

    return () => {
      window.clearInterval(timer);
    };
  }, [isExiting]);

  return (
    <div
      className={`app-loading${isExiting ? ' is-exiting' : ''}`}
      role="status"
      aria-live="polite"
      aria-label="页面正在加载"
    >
      <div className="loading-backdrop" aria-hidden="true" />
      <div className="loading-panel">
        <p className="loading-kicker">ProfileCraft</p>
        <h2 className="loading-title">正在准备你的扩列条</h2>
        <div className="loading-progress" aria-hidden="true">
          <span className="loading-progress-bar" />
        </div>
        <p className="loading-subtitle">
          加载中<span className="loading-dots" />
        </p>
        <p className="loading-tip" aria-live="off">
          小提示：<span className="loading-tip-text" key={tipIndex}>{LOADING_TIPS[tipIndex]}</span>
        </p>
      </div>
    </div>
  );
};

export default LoadingScreen;
