import { useState } from 'react';
import { readStorage } from './history';

// 聊天显示偏好：只保存在本机。
// avatarMode：sticky = 头像跟随滚动贴在一组消息底部（Telegram 式）；top = 固定在一组消息第一条旁边。
const KEY = 'linliao.chatPrefs';
export const DEFAULT_CHAT_PREFS = { avatarMode: 'sticky', showSelfInGroups: false, showBothInDirect: false };

export default function useChatPrefs() {
  const [prefs, setPrefs] = useState(() => {
    const saved = readStorage(KEY, {});
    return { ...DEFAULT_CHAT_PREFS, ...(saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {}) };
  });
  const update = change => setPrefs(previous => {
    const next = { ...previous, ...change };
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
    return next;
  });
  return [prefs, update];
}
