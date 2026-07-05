/** Persiste scroll da lista entre navegações (mesma sessão). */
let savedChatListScrollTop = 0;

export const CHAT_LIST_SCROLL_CLASS =
  'flex-1 min-h-0 overflow-y-auto overscroll-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden';

export function saveChatListScrollTop(top: number) {
  savedChatListScrollTop = Math.max(0, top);
}

export function getChatListScrollTop() {
  return savedChatListScrollTop;
}

export function restoreChatListScroll(el: HTMLElement | null) {
  if (!el || savedChatListScrollTop <= 0) return;
  el.scrollTop = savedChatListScrollTop;
}
