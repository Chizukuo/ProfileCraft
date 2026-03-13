import React, { useEffect, useState } from 'react';

const LOADING_TIPS = [
  '所有内容都支持点击编辑，直接改就行。',
  '拖拽卡片标题区域可以自由调整布局。',
  '头像、标签和文本都能随时个性化。',
  '工具栏里可快速切换主题与强调色。',
  '完成后可导出图片或 HTML 进行分享。',
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
