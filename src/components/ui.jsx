import { BADGE_COLOR } from "../constants/enums";
import { formatDuration, formatMoney, humanize } from "../utils/format";

export function StatusBadge({ value }) {
  if (!value) return null;
  return <span className={`badge badge-sm ${BADGE_COLOR[value] || "badge-ghost"}`}>{humanize(value)}</span>;
}

export function Money({ value }) {
  return <span className="tabular-nums">{formatMoney(value)}</span>;
}

export function StatCard({ title, value, desc, tone }) {
  return (
    <div className="stat bg-base-100 rounded-box shadow-sm border border-base-200">
      <div className="stat-title">{title}</div>
      <div className={`stat-value text-2xl ${tone || ""}`}>{value}</div>
      {desc && <div className="stat-desc">{desc}</div>}
    </div>
  );
}

export function PageHeader({ title, children }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
      <h1 className="text-2xl font-bold">{title}</h1>
      <div className="flex gap-2 items-center">{children}</div>
    </div>
  );
}

export function Loading() {
  return <div className="flex justify-center py-16"><span className="loading loading-spinner loading-lg" /></div>;
}

export function ErrorBox({ error }) {
  if (!error) return null;
  const msg = error?.response?.data?.detail || error.message;
  return <div role="alert" className="alert alert-error"><span>{typeof msg === "string" ? msg : "Request failed"}</span></div>;
}

export function Empty({ text = "Nothing here yet." }) {
  return <div className="text-center text-base-content/60 py-10">{text}</div>;
}

export function Card({ title, children, actions }) {
  return (
    <div className="card bg-base-100 shadow-sm border border-base-200">
      <div className="card-body">
        {(title || actions) && (
          <div className="flex items-center justify-between">
            {title && <h2 className="card-title text-base">{title}</h2>}
            {actions}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export function Pagination({ page, pageSize, total, onChange }) {
  const pages = Math.max(1, Math.ceil((total || 0) / pageSize));
  if (pages <= 1) return null;
  return (
    <div className="join justify-center mt-4 w-full">
      <button className="join-item btn btn-sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>«</button>
      <button className="join-item btn btn-sm no-animation">Page {page} / {pages}</button>
      <button className="join-item btn btn-sm" disabled={page >= pages} onClick={() => onChange(page + 1)}>»</button>
    </div>
  );
}

export function Modal({ open, title, onClose, children }) {
  if (!open) return null;
  return (
    <dialog className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">{title}</h3>
        {children}
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </dialog>
  );
}

export function Field({ label, children }) {
  return (
    <label className="form-control w-full mb-3">
      <div className="label"><span className="label-text">{label}</span></div>
      {children}
    </label>
  );
}

// Shows time left (or overdue) for an SLA deadline using the seconds the backend computed.
export function SlaTimer({ label, seconds, breached, doneAt }) {
  let cls = "badge-ghost", text = "—";
  if (doneAt) { cls = "badge-success"; text = "Done"; }
  else if (breached || (seconds !== null && seconds < 0)) { cls = "badge-error"; text = formatDuration(seconds ?? -1); }
  else if (seconds !== null && seconds !== undefined) { cls = seconds < 3600 ? "badge-warning" : "badge-info"; text = formatDuration(seconds); }
  return <div className="flex items-center gap-2 text-sm"><span className="text-base-content/60">{label}</span><span className={`badge badge-sm ${cls}`}>{text}</span></div>;
}

