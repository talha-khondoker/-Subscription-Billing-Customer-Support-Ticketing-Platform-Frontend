import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { ticketApi, userApi } from "../../api";
import { useAuth } from "../../context/AuthContext";
import { ROLE, TICKET_PRIORITIES } from "../../constants/enums";
import { Card, Empty, ErrorBox, Loading, Money, PageHeader, SlaTimer, StatusBadge } from "../../components/ui";
import { errorMessage, formatDate, formatDateTime, humanize } from "../../utils/format";

function BillingContext({ id }) {
  const { data, isLoading, error } = useQuery({ queryKey: ["billing-ctx", id], queryFn: () => ticketApi.billingContext(id) });
  if (isLoading) return <Loading />;
  if (error) return <ErrorBox error={error} />;
  const sub = data.subscription;
  return (
    <Card title="Billing context">
      {data.alerts.map((a, i) => <div key={i} role="alert" className="alert alert-warning py-2 text-sm"><span>{a}</span></div>)}
      <div className="text-sm">
        <div className="font-medium">{data.customer.name}</div>
        <div className="text-base-content/60">{data.customer.email}{data.customer.company_name ? ` · ${data.customer.company_name}` : ""}</div>
      </div>
      {sub ? (
        <div className="text-sm border-t border-base-200 pt-2">
          <div className="font-medium">{sub.plan_name} <StatusBadge value={sub.status} /></div>
          <div className="text-base-content/60"><Money value={sub.plan_price} /> / {sub.billing_period} · renews {formatDate(sub.next_billing_date || sub.current_period_end)}</div>
          {sub.cancel_at_period_end && <div className="badge badge-warning badge-sm mt-1">Cancels at period end</div>}
        </div>
      ) : <div className="text-sm text-base-content/60">No subscription</div>}
      <div className="text-sm border-t border-base-200 pt-2">
        <div className="font-medium mb-1">Recent invoices</div>
        {data.invoices.length === 0 ? <span className="text-base-content/60">None</span> : data.invoices.map((i) => (
          <div key={i.id} className="flex justify-between"><span>{i.invoice_number}</span><span className="flex gap-2"><Money value={i.total} /><StatusBadge value={i.status} /></span></div>
        ))}
      </div>
      <div className="text-sm border-t border-base-200 pt-2">
        <div className="font-medium mb-1">Payments {data.failed_attempt_count > 0 && <span className="badge badge-error badge-sm">{data.failed_attempt_count} failed attempt(s)</span>}</div>
        {data.payments.length === 0 ? <span className="text-base-content/60">None</span> : data.payments.map((p) => (
          <div key={p.id} className="flex justify-between"><span>{formatDate(p.created_at)}</span><span className="flex gap-2"><Money value={p.amount} /><StatusBadge value={p.status} /></span></div>
        ))}
        {data.failed_attempts.map((a) => (
          <div key={a.id} className="text-xs text-error mt-1">Attempt {a.attempt_number} failed{a.next_retry_at ? ` · retry ${formatDateTime(a.next_retry_at)}` : ""}</div>
        ))}
      </div>
      {data.refunds.length > 0 && (
        <div className="text-sm border-t border-base-200 pt-2">
          <div className="font-medium mb-1">Refunds</div>
          {data.refunds.map((r) => <div key={r.id} className="flex justify-between"><span>{formatDate(r.created_at)}</span><span className="flex gap-2"><Money value={r.amount} /><StatusBadge value={r.status} /></span></div>)}
        </div>
      )}
      {data.past_tickets.length > 0 && (
        <div className="text-sm border-t border-base-200 pt-2">
          <div className="font-medium mb-1">Past tickets</div>
          {data.past_tickets.map((t) => <div key={t.id}><Link className="link link-hover" to={`/tickets/${t.id}`}>#{t.id} {t.subject}</Link></div>)}
        </div>
      )}
    </Card>
  );
}

// Status changes the backend allows through PATCH (resolve / escalate have their own buttons).
const NEXT_STATUS = {
  open: ["in_progress", "waiting_customer"], in_progress: ["waiting_customer"], waiting_customer: ["in_progress"],
  escalated: ["in_progress"], resolved: ["in_progress", "closed"], closed: [],
};

export default function TicketDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const staff = user.role === ROLE.ORG_ADMIN || user.role === ROLE.AGENT;
  const isAdmin = user.role === ROLE.ORG_ADMIN;
  const [text, setText] = useState("");
  const [internal, setInternal] = useState(false);
  const isAgent = user.role === ROLE.AGENT;
  const internalMode = isAdmin || internal; // Org Admins can only add internal notes

  const { data: t, isLoading, error } = useQuery({ queryKey: ["ticket", id], queryFn: () => ticketApi.get(id) });
  const agents = useQuery({ queryKey: ["agents"], queryFn: userApi.agents, enabled: isAdmin });

  const refresh = () => { qc.invalidateQueries({ queryKey: ["ticket", id] }); qc.invalidateQueries({ queryKey: ["tickets"] }); };
  const ok = (msg) => () => { if (msg) toast.success(msg); refresh(); };
  const fail = (e) => toast.error(errorMessage(e));

  const send = useMutation({
    mutationFn: () => (internalMode ? ticketApi.note(id, text) : ticketApi.reply(id, text)),
    onSuccess: () => { setText(""); ok()(); }, onError: fail,
  });
  const update = useMutation({ mutationFn: (body) => ticketApi.update(id, body), onSuccess: ok("Ticket updated"), onError: fail });
  const assign = useMutation({ mutationFn: (agentId) => ticketApi.assign(id, Number(agentId)), onSuccess: ok("Ticket assigned"), onError: fail });
  const escalate = useMutation({ mutationFn: () => ticketApi.escalate(id, null), onSuccess: ok("Ticket escalated"), onError: fail });
  const resolve = useMutation({ mutationFn: () => ticketApi.resolve(id, null), onSuccess: ok("Ticket resolved"), onError: fail });

  if (isLoading) return <Loading />;
  if (error) return <ErrorBox error={error} />;
  const closed = ["resolved", "closed"].includes(t.status);
  const isClosed = t.status === "closed";

  return (
    <>
      <PageHeader title={`#${t.id} ${t.subject}`}><Link to="/tickets" className="btn btn-sm">← Back</Link></PageHeader>
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <div className="flex flex-wrap gap-2 mb-2">
              <StatusBadge value={t.status} /><StatusBadge value={t.priority} /><span className="badge badge-sm badge-outline">{humanize(t.category)}</span>
            </div>
            <p className="whitespace-pre-wrap">{t.description}</p>
            <div className="text-xs text-base-content/60">Opened by {t.customer_name} · {formatDateTime(t.created_at)}</div>
          </Card>

          <Card title="Conversation">
            {t.messages.length === 0 ? <Empty text="No replies yet." /> : t.messages.map((m) => {
              const mine = m.sender_id === user.id;
              return (
                <div key={m.id} className={`chat ${mine ? "chat-end" : "chat-start"}`}>
                  <div className="chat-header text-xs">
                    {m.sender_name} <span className="opacity-60">({humanize(m.sender_role)})</span>
                    {m.is_internal && <span className="badge badge-warning badge-xs ml-1">Internal note</span>}
                    <time className="opacity-50 ml-1">{formatDateTime(m.created_at)}</time>
                  </div>
                  <div className={`chat-bubble whitespace-pre-wrap ${m.is_internal ? "chat-bubble-warning" : mine ? "chat-bubble-primary" : ""}`}>{m.body}</div>
                </div>
              );
            })}
            {!isClosed && (
              <form className="mt-4" onSubmit={(e) => { e.preventDefault(); if (text.trim()) send.mutate(); }}>
                <textarea className="textarea textarea-bordered w-full" rows={3} placeholder={internalMode ? "Internal note (customer can't see this)…" : t.status === "resolved" && !staff ? "Reply to reopen this ticket…" : "Write a reply…"} value={text} onChange={(e) => setText(e.target.value)} />
                <div className="flex items-center justify-between mt-2">
                  {isAgent ? (
                    <label className="label cursor-pointer gap-2"><input type="checkbox" className="toggle toggle-warning toggle-sm" checked={internal} onChange={(e) => setInternal(e.target.checked)} /><span className="label-text">Internal note</span></label>
                  ) : isAdmin ? <span className="text-xs text-base-content/60">Org Admins add internal notes; the assigned agent replies to the customer.</span> : <span />}
                  <button className="btn btn-primary btn-sm" disabled={send.isPending || !text.trim()}>{internalMode ? "Add note" : t.status === "resolved" ? "Reply and reopen" : "Send reply"}</button>
                </div>
              </form>
            )}
            {isClosed && <div className="text-sm text-base-content/60 mt-2">This ticket is closed. Please open a new ticket if you need more help.</div>}
          </Card>
        </div>

        <div className="space-y-4">
          <Card title="SLA">
            <SlaTimer label="First response" seconds={t.first_response_remaining_seconds} breached={t.first_response_breached} doneAt={t.first_responded_at} />
            <SlaTimer label="Resolution" seconds={t.resolution_remaining_seconds} breached={t.resolution_breached} doneAt={t.resolved_at} />
            <div className="text-sm text-base-content/60">Assignee: {t.assigned_agent_name || "Unassigned"}</div>
          </Card>

          {staff && (
            <Card title="Manage">
              <label className="text-sm">Status
                <select className="select select-bordered select-sm w-full mt-1" value={t.status} disabled={!(NEXT_STATUS[t.status] || []).length}
                  onChange={(e) => update.mutate({ status: e.target.value })}>
                  {[t.status, ...(NEXT_STATUS[t.status] || [])].map((s) => <option key={s} value={s}>{humanize(s)}</option>)}
                </select>
              </label>
              <label className="text-sm">Priority
                <select className="select select-bordered select-sm w-full mt-1" value={t.priority} onChange={(e) => update.mutate({ priority: e.target.value })}>
                  {TICKET_PRIORITIES.map((s) => <option key={s} value={s}>{humanize(s)}</option>)}
                </select>
              </label>
              {isAdmin && (
                <label className="text-sm">Assign to
                  <select className="select select-bordered select-sm w-full mt-1" value={t.assigned_agent_id || ""} onChange={(e) => e.target.value && assign.mutate(e.target.value)}>
                    <option value="">Select agent…</option>
                    {(agents.data || []).filter((a) => a.is_active).map((a) => <option key={a.id} value={a.id}>{a.full_name}</option>)}
                  </select>
                </label>
              )}
              {!closed && (
                <div className="flex gap-2 mt-2">
                  {isAgent && <button className="btn btn-sm btn-warning btn-outline flex-1" disabled={escalate.isPending || t.status === "escalated"} onClick={() => escalate.mutate()}>Escalate</button>}
                  <button className="btn btn-sm btn-success flex-1" disabled={resolve.isPending} onClick={() => resolve.mutate()}>Resolve</button>
                </div>
              )}
            </Card>
          )}

          {staff && <BillingContext id={id} />}
        </div>
      </div>
    </>
  );
}
