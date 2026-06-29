import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function AdminChatMessagesSkeleton() {
  return (
    <div className="flex-1 overflow-hidden p-6 flex flex-col gap-4">
      {/* Mensagem recebida (cliente) */}
      <div className="flex justify-start">
        <Skeleton className="h-14 w-[55%] rounded-md" />
      </div>
      {/* Mensagem enviada (admin) */}
      <div className="flex justify-end">
        <Skeleton className="h-10 w-[40%] rounded-md" />
      </div>
      {/* Card de pedido aprovado */}
      <div className="flex justify-end">
        <Skeleton className="h-28 w-[65%] rounded-md" />
      </div>
      {/* Mensagem recebida */}
      <div className="flex justify-start">
        <Skeleton className="h-16 w-[50%] rounded-md" />
      </div>
      {/* Mensagem enviada */}
      <div className="flex justify-end">
        <Skeleton className={cn('h-12 w-[35%] rounded-md')} />
      </div>
      {/* Entrega */}
      <div className="flex justify-end">
        <Skeleton className="h-24 w-[60%] rounded-md" />
      </div>
    </div>
  );
}

export function AdminChatHeaderSkeleton() {
  return (
    <div className="p-4 border-b border-white/5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-8 w-24 rounded" />
        <Skeleton className="h-8 w-28 rounded" />
        <Skeleton className="h-8 w-24 rounded" />
      </div>
    </div>
  );
}
