const CURRENCY = import.meta.env.VITE_CURRENCY || "USD";

// Backend sends money as Decimal strings ("49.00"). Never do float math on them for display logic.
export function formatMoney(value) {
  if (value === null || value === undefined || value === "") return "—";
  return new Intl.NumberFormat(undefined, { style: "currency", currency: CURRENCY }).format(Number(value));
}

// Backend datetimes are naive UTC (no "Z"), so add it before parsing.
export function parseUtc(iso) {
  if (!iso) return null;
  return new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(iso) ? iso : iso + "Z");
}

export function formatDate(iso) {
  const d = parseUtc(iso);
  return d ? d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—";
}

export function formatDateTime(iso) {
  const d = parseUtc(iso);
  return d ? d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "—";
}

export function humanize(s) {
  return s ? s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "";
}

export function formatDuration(seconds) {
  if (seconds === null || seconds === undefined) return "—";
  const abs = Math.abs(seconds);
  const d = Math.floor(abs / 86400), h = Math.floor((abs % 86400) / 3600), m = Math.floor((abs % 3600) / 60);
  const txt = d ? `${d}d ${h}h` : h ? `${h}h ${m}m` : `${m}m`;
  return seconds < 0 ? `${txt} overdue` : `${txt} left`;
}

// FastAPI errors: {detail: "msg"} or {detail: [{loc, msg}]}
export function errorMessage(err) {
  const detail = err?.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((d) => `${d.loc?.slice(-1)[0] ?? ""}: ${d.msg}`).join(", ");
  return err?.message || "Something went wrong";
}
