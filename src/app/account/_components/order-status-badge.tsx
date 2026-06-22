import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, XCircle, Truck } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_MAP: Record<string, { label: string; className: string; icon: typeof Clock }> = {
  PENDING: { label: "Aguardando pagamento", className: "bg-amber-500/10 text-amber-400", icon: Clock },
  PAID: { label: "Pago", className: "bg-emerald-500/10 text-emerald-400", icon: CheckCircle2 },
  DELIVERED: { label: "Entregue", className: "bg-emerald-500/10 text-emerald-400", icon: Truck },
  CANCELLED: { label: "Cancelado", className: "bg-red-500/10 text-red-400", icon: XCircle },
};

export function OrderStatusBadge({ status }: { status: string }) {
  const config = STATUS_MAP[status] || { label: status, className: "bg-white/5 text-zinc-400", icon: Clock };
  const Icon = config.icon;
  return (
    <Badge className={cn("border-none gap-1.5 font-medium", config.className)}>
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </Badge>
  );
}
