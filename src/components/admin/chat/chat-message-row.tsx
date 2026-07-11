"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { ChatMessage } from "@/lib/admin-api";
import { DeliveryCard, OrderApprovedCard, parseDelivery, parseOrderApproved, } from "@/components/admin/chat/chat-message-cards";
import { getMessageSide, getSenderDisplayName, getStaffBadgeLabel, isSupportSender, shouldShowBotBadge, } from "@/lib/chat-message-display";
import { cn } from "@/lib/utils";

type ChatMessageRowProps = {
  msg: ChatMessage;
  viewer: "client" | "admin";
  clientUserId?: string;
  clientName?: string;
  formatFileUrl: (url: string) => string;
  onLightboxOpen?: (url: string) => void;
  renderContent: (content: string) => React.ReactNode;
};

function MessageAvatar({ name, isBot }: { name: string; isBot?: boolean }) {
  const initial = (name || "?").trim().charAt(0).toLowerCase();
  return (
    <div
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm uppercase font-medium",
        isBot
          ? "bg-blue-600/30 text-blue-200"
          : "bg-white/10 text-white"
      )}
    >
      {isBot ? "B" : initial}
    </div>
  );
};

export function ChatMessageRow({ msg, viewer, clientUserId, clientName, formatFileUrl, onLightboxOpen, renderContent, }: ChatMessageRowProps) {
  const side = getMessageSide(msg, viewer, clientUserId);
  const isRight = side === "right";
  const isSupport = isSupportSender(msg);
  const senderName = getSenderDisplayName(msg, { clientName, staffName: "Suporte", });
  const showBot = shouldShowBotBadge(msg);
  const badgeLabel = getStaffBadgeLabel(msg);
  const showHeader = Boolean(senderName);

  return (
    <div className={cn("flex w-full", isRight ? "justify-end" : "justify-start")}>
      <div className={cn("flex max-w-[min(75%,420px)] flex-col gap-1", isRight ? "items-end" : "items-start")}>
        {showHeader && (
          <div className={cn("flex items-center select-none gap-2 px-0.5", isRight && "flex-row")}>
            <MessageAvatar name={senderName || "?"} isBot={showBot} />
            <span className="text-sm font-medium text-white/90">{senderName}</span>
          </div>
        )}

        <div className={cn("w-full select-none rounded-sm px-3 py-2 text-sm leading-relaxed", isSupport ? "bg-blue-500/50 text-white" : "bg-white/25 text-white")}>
          {msg.fileUrl && (
            <img
              src={formatFileUrl(msg.fileUrl)}
              alt="Anexo"
              className="mb-1 max-w-full cursor-pointer rounded-sm"
              onClick={() => onLightboxOpen?.(formatFileUrl(msg.fileUrl!))}
            />
          )}
          {msg.content ? (
            <p className="whitespace-pre-wrap break-words">{renderContent(msg.content)}</p>
          ) : null}
        </div>

        <span className="px-0.5 text-[10px] text-muted-foreground">
          {format(new Date(msg.createdAt), "HH:mm", { locale: ptBR })}
        </span>
      </div>
    </div>
  );
}

type ChatMessageItemProps = ChatMessageRowProps & {
  className?: string;
};

export function ChatMessageItem({ msg, viewer, clientUserId, clientName, formatFileUrl, onLightboxOpen, renderContent, className, }: ChatMessageItemProps) {
  const side = getMessageSide(msg, viewer, clientUserId);
  const isRight = side === "right";
  const orderApproved = msg.type === "ORDER_APPROVED" ? parseOrderApproved(msg.content) : null;
  const delivery = msg.type === "DELIVERY" ? parseDelivery(msg.content) : null;

  if (orderApproved) {
    return (
      <div className={cn("flex w-full", isRight ? "justify-end" : "justify-start", className)}>
        <div className={cn("flex max-w-[min(75%,520px)] flex-col gap-1", isRight ? "items-end" : "items-start")}>
          <OrderApprovedCard payload={orderApproved} />
          <span className="px-0.5 text-[10px] text-muted-foreground">
            {format(new Date(msg.createdAt), "HH:mm", { locale: ptBR })}
          </span>
        </div>
      </div>
    );
  }

  if (delivery) {
    return (
      <div className={cn("flex w-full", isRight ? "justify-end" : "justify-start", className)}>
        <div className={cn("flex max-w-[min(75%,520px)] flex-col gap-1", isRight ? "items-end" : "items-start")}>
          <DeliveryCard payload={delivery} />
          <span className="px-0.5 text-[10px] text-muted-foreground">
            {format(new Date(msg.createdAt), "HH:mm", { locale: ptBR })}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <ChatMessageRow
        msg={msg}
        viewer={viewer}
        clientUserId={clientUserId}
        clientName={clientName}
        formatFileUrl={formatFileUrl}
        onLightboxOpen={onLightboxOpen}
        renderContent={renderContent}
      />
    </div>
  );
}
