import React, { Component, ErrorInfo, ReactNode } from 'react';
import { safeGetItem, safeRemoveItem } from '../utils/storage';

// 与 hooks/useProfileData.ts 的 DATA_KEY / BACKUP_KEY 保持一致；这里不 import hook 模块，避免错误页依赖业务代码
const DATA_KEY = 'kuolieProfileData';
const BACKUP_KEY = 'kuolieProfileData.unreadable';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  confirmReset: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, confirmReset: false };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, info.componentStack);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, confirmReset: false });
  };

  // 本地数据损坏时，重试和刷新都无济于事：先让用户把原始数据存下来，再清掉重来
  handleBackup = () => {
    const raw = safeGetItem(DATA_KEY) ?? safeGetItem(BACKUP_KEY);
    if (!raw) return;
    const url = URL.createObjectURL(new Blob([raw], { type: 'application/json;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `profilecraft-backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  handleResetData = () => {
    if (!this.state.confirmReset) {
      this.setState({ confirmReset: true });
      return;
    }
    safeRemoveItem(DATA_KEY);
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="error-boundary-root">
          <h2 className="error-boundary-title">出了点问题 (Something went wrong)</h2>
          <p className="error-boundary-message">
            {this.state.error?.message ?? '未知错误'}
          </p>
          <button
            onClick={this.handleReload}
            className="error-boundary-btn error-boundary-btn-primary"
          >
            重试 (Retry)
          </button>
          <button
            onClick={() => window.location.reload()}
            className="error-boundary-btn"
          >
            刷新页面 (Reload)
          </button>
          <p className="error-boundary-message">
            如果反复出错，可能是本地保存的数据损坏了。可以先下载备份，再清空数据重新开始。
            <br />
            If this keeps happening, your saved data may be corrupted. Download a backup, then reset.
          </p>
          <button onClick={this.handleBackup} className="error-boundary-btn">
            下载数据备份 (Download backup)
          </button>
          <button onClick={this.handleResetData} className="error-boundary-btn">
            {this.state.confirmReset ? '确定清空？再点一次 (Click again to confirm)' : '清空本地数据 (Reset data)'}
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
