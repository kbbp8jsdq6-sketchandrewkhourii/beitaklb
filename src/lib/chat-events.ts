export const OPEN_CHAT_EVENT = "beitak:open-chat";
export type OpenChatDetail = { listing?: { id: string; title: string } };
export function openChat(detail: OpenChatDetail = {}) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<OpenChatDetail>(OPEN_CHAT_EVENT, { detail }));
}