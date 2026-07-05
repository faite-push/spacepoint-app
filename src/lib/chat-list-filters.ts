export const CHAT_STATUS_FILTERS = [
  'ALL',
  'OPEN',
  'ARCHIVED',
  'EXPRESS',
  'RESOLVED',
  'UNRESOLVED',
] as const;

export type ChatStatusFilter = (typeof CHAT_STATUS_FILTERS)[number];

export function parseChatStatusFilter(value: string | null): ChatStatusFilter {
  if (value && CHAT_STATUS_FILTERS.includes(value as ChatStatusFilter)) {
    return value as ChatStatusFilter;
  }
  return 'ALL';
}

export function buildChatListQueryParams(
  statusFilter: ChatStatusFilter,
  labelFilter: string,
  search: string,
  sortBy: 'activity' | 'created'
) {
  const isExpress = statusFilter === 'EXPRESS';
  return {
    search: search.trim() || undefined,
    status: isExpress ? 'ALL' : statusFilter,
    labelId: labelFilter !== 'ALL' ? labelFilter : undefined,
    deliveryFilter: isExpress ? 'express' : undefined,
    sortBy,
  };
}

export function buildChatFiltersSearchParams(
  statusFilter: ChatStatusFilter,
  labelFilter: string,
  search: string,
  sortBy: 'activity' | 'created'
) {
  const params = new URLSearchParams();
  if (statusFilter !== 'ALL') params.set('status', statusFilter);
  if (labelFilter !== 'ALL') params.set('label', labelFilter);
  if (search.trim()) params.set('q', search.trim());
  if (sortBy !== 'activity') params.set('sort', sortBy);
  return params;
}

export function readChatFiltersFromSearchParams(searchParams: URLSearchParams) {
  return {
    statusFilter: parseChatStatusFilter(searchParams.get('status')),
    labelFilter: searchParams.get('label') || 'ALL',
    search: searchParams.get('q') || '',
    sortBy: searchParams.get('sort') === 'created' ? ('created' as const) : ('activity' as const),
  };
}
