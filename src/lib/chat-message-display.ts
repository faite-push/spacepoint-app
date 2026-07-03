import type { ChatMessage } from "@/lib/admin-api";

export type ChatMessageSide = "left" | "right";

export function isSupportSender(msg: Pick<ChatMessage, "senderId" | "type" | "senderRole">): boolean {
  if (msg.senderRole === "STAFF" || msg.senderRole === "SYSTEM" || msg.senderRole === "BOT") {
    return true;
  }
  return msg.senderId === "ADMIN" || msg.senderId === "SYSTEM" || msg.type === "AUTOMATED";
}

export function getMessageSide(
  msg: Pick<ChatMessage, "senderId" | "type" | "senderRole">,
  viewer: "client" | "admin",
  clientUserId?: string
): ChatMessageSide {
  const support = isSupportSender(msg);

  if (viewer === "admin") {
    return support ? "right" : "left";
  }

  if (support) return "left";
  if (clientUserId && msg.senderId === clientUserId) return "right";
  return "left";
}

export function getSenderDisplayName(
  msg: Pick<ChatMessage, "senderId" | "senderName" | "senderRole" | "type">,
  fallback?: { clientName?: string; staffName?: string }
): string | null {
  if (msg.senderName?.trim()) return msg.senderName.trim();

  if (msg.senderRole === "BOT" || (msg.senderId === "SYSTEM" && msg.type === "AUTOMATED")) {
    return "Space Bot Assistant";
  }

  if (isSupportSender(msg)) {
    return fallback?.staffName || "Suporte";
  }

  return fallback?.clientName || null;
}

export function shouldShowStaffBadge(msg: Pick<ChatMessage, "senderId" | "senderRole" | "type">): boolean {
  if (msg.senderRole === "BOT" || msg.senderId === "SYSTEM") return msg.type === "AUTOMATED";
  return msg.senderRole === "STAFF" || msg.senderId === "ADMIN";
}

export function shouldShowBotBadge(msg: Pick<ChatMessage, "senderId" | "senderRole" | "type">): boolean {
  return msg.senderRole === "BOT" || (msg.senderId === "SYSTEM" && msg.type === "AUTOMATED");
}

export function getStaffBadgeLabel(
  msg: Pick<ChatMessage, "senderId" | "senderRole" | "type" | "senderStaffTitle">
): string | null {
  if (shouldShowBotBadge(msg)) return "Bot";
  if (shouldShowStaffBadge(msg)) return msg.senderStaffTitle?.trim() || "Staff";
  return null;
}
