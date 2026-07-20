import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function formatLastAccess(lastAccessAt?: string | null) {
  if (!lastAccessAt) return 'Nunca acessou';
  const date = new Date(lastAccessAt);
  if (Number.isNaN(date.getTime())) return 'Nunca acessou';
  return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
}

export function formatLastAccessFull(lastAccessAt?: string | null) {
  if (!lastAccessAt) return 'Nunca acessou o site';
  const date = new Date(lastAccessAt);
  if (Number.isNaN(date.getTime())) return 'Nunca acessou o site';
  return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
}

export function formatDocument(value?: string | null) {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length === 11) {
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  if (digits.length === 14) {
    return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  return digits || '—';
}

export function formatPhone(value?: string | null) {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  if (digits.length === 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return digits || '—';
}
