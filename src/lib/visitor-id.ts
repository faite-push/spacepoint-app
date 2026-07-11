const VISITOR_KEY = "sp_visitor_id";

export function getVisitorId(): string | null {
  if (typeof window === "undefined") return null;

  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}
