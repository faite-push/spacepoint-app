type OrderDeliveryFields = {
  deliveryOption?: string | null;
  deliveryFee?: number | null;
  adminNotes?: string | null;
};

const EXPRESS_NOTE = /\[ENTREGA EXPRESSA\]/i;

export function isExpressDelivery(order?: OrderDeliveryFields | null): boolean {
  if (!order) return false;
  if (String(order.deliveryOption || '').toLowerCase() === 'express') return true;
  return EXPRESS_NOTE.test(order.adminNotes || '');
};

export function getDeliveryOptionLabel(order?: OrderDeliveryFields | null): string {
  if (isExpressDelivery(order)) return 'Entrega expressa';
  if (String(order?.deliveryOption || '').toLowerCase() === 'standard') return 'Entrega padrão';
  return 'Entrega padrão';
};

export function stripExpressAdminNote(notes?: string | null): string {
  if (!notes) return '';
  return notes.replace(/^\[ENTREGA EXPRESSA\]\s*/i, '').trim();
};

export const CHECKOUT_FIELD_LABELS: Record<string, string> = {
  name: 'Nome',
  nome: 'Nome',
  email: 'E-mail',
  cpf: 'CPF',
  phone: 'Celular',
  celular: 'Celular',
};

export function formatCheckoutFieldLabel(key: string): string {
  return CHECKOUT_FIELD_LABELS[key.toLowerCase()] || key.replace(/_/g, ' ');
};

export function getChatListRowClass(opts: { isExpress: boolean; isResolved?: boolean; isSelected: boolean; }): string {
  const { isExpress, isResolved, isSelected } = opts;

  if (isExpress) {
    if (isSelected) {
      return 'bg-linear-to-r from-amber-500/15 to-amber-500/0 border border-amber-500/30';
    }
    if (isResolved) {
      return 'bg-linear-to-r from-amber-500/5 to-transparent border-b border-white/5';
    }
    return 'bg-linear-to-r from-amber-500/5 to-transparent border-b border-white/5';
  }

  if (isResolved) {
    return isSelected
      ? 'bg-linear-to-r from-emerald-500/15 to-emerald-500/0 border border-emerald-500/30'
      : 'bg-linear-to-r from-emerald-500/5 to-emerald-500/0 border-b border-white/5';
  }

  return isSelected
    ? 'bg-linear-to-r from-[#fcb64c]/15 to-[#fcb64c]/0 border border-[#fcb64c]/30'
    : 'bg-linear-to-r from-[#fcb64c]/5 to-[#fcb64c]/0 border-b border-white/5';
};