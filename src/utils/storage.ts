// localStorage 在隐私模式、被禁用站点数据或配额满时都可能抛错，统一在这里兜住

export const safeGetItem = (key: string): string | null => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

/** 写入成功返回 true；配额不足等失败返回 false */
export const safeSetItem = (key: string, value: string): boolean => {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
};

export const safeRemoveItem = (key: string) => {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
};
