// Maps a scan token prefix (e.g. "wo") to an in-app route path.
export const SCAN_ROUTES: Record<string, (v: string) => string> = {
  wo: (v) => `/work-orders/${v}`,
  lot: () => `/stock`,
  item: () => `/items`,
  inquiry: (v) => `/inquiries/${v}`,
  so: (v) => `/sales-orders/${v}`,
  po: (v) => `/purchase-orders/${v}`,
  inv: (v) => `/invoices/${v}`,
  dc: (v) => `/shipments/${v}`,
};

/**
 * Resolve a scanned value to an in-app route path, or null if unrecognized.
 * Accepts a token ("wo:<id>"), an app URL ("https://host/work-orders/<id>"),
 * or a bare path ("/work-orders/<id>") — so labels can encode full URLs.
 */
export function resolveScan(raw: string): string | null {
  const s = (raw ?? '').trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) {
    try { const u = new URL(s); return u.pathname + u.search; } catch { return null; }
  }
  if (s.startsWith('/')) return s;
  const m = s.match(/^(\w+)\s*:\s*(.+)$/);
  if (!m) return null;
  const fn = SCAN_ROUTES[m[1].toLowerCase()];
  return fn ? fn(m[2].trim()) : null;
}

/** Full URL to encode in a QR label so any phone scanner opens the app at that record. */
export function scanUrl(token: string): string {
  const path = resolveScan(token);
  const origin = typeof location !== 'undefined' ? location.origin : '';
  return path ? `${origin}${path}` : token;
}
