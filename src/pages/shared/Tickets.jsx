import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { ticketApi } from "../../api";
import { useAuth } from "../../context/AuthContext";
import { ROLE, TICKET_CATEGORIES, TICKET_PRIORITIES, TICKET_STATUSES } from "../../constants/enums";
import { Card, Empty, ErrorBox, Field, Loading, PageHeader, Pagination, SlaTimer, StatusBadge } from "../../components/ui";
import { errorMessage, formatDate, humanize } from "../../utils/format";

export function TicketList() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [f, setF] = useState({ status: "", priority: "", category: "", search: "" });
  const pageSize = 10;
  const params = { page, page_size: pageSize, ...Object.fromEntries(Object.entries(f).filter(([, v]) => v)) };
  const { data, isLoading, error } = useQuery({ queryKey: ["tickets", params], queryFn: () => ticketApi.list(params) });
  const set = (k) => (e) => { setPage(1); setF({ ...f, [k]: e.target.value }); };
  const staff = user.role !== ROLE.CUSTOMER;
  const Sel = ({ k, label, opts }) => (
    <select className="select select-bordered select-sm" value={f[k]} onChange={set(k)}>
      <option value="">{label}</option>
      {opts.map((o) => <option key={o} value={o}>{humanize(o)}</option>)}
    </select>
  );
  return (
    <>
      <PageHeader title={staff ? "Tickets" : "Support tickets"}>
        {user.role === ROLE.CUSTOMER && <Link to="/tickets/new" className="btn btn-primary btn-sm">New ticket</Link>}
      </PageHeader>
      <div className="flex flex-wrap gap-2 mb-4">
        <input className="input input-bordered input-sm" placeholder="Search…" value={f.search} onChange={set("search")} />
        <Sel k="status" label="All statuses" opts={TICKET_STATUSES} />
        <Sel k="priority" label="All priorities" opts={TICKET_PRIORITIES} />
        <Sel k="category" label="All categories" opts={TICKET_CATEGORIES} />
      </div>
      {isLoading ? <Loading /> : error ? <ErrorBox error={error} /> : (
        <Card>
          {data.items.length === 0 ? <Empty text="No tickets found." /> : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead><tr><th>#</th><th>Subject</th>{staff && <th>Customer</th>}<th>Priority</th><th>Status</th>{staff && <th>Assignee</th>}<th>SLA</th><th>Created</th></tr></thead>
                <tbody>
                  {data.items.map((t) => (
                    <tr key={t.id} className="hover">
                      <td>{t.id}</td>
                      <td><Link className="link link-primary" to={`/tickets/${t.id}`}>{t.subject}</Link><div className="text-xs text-base-content/60">{humanize(t.category)}</div></td>
                      {staff && <td>{t.customer_name}</td>}
                      <td><StatusBadge value={t.priority} /></td><td><StatusBadge value={t.status} /></td>
                      {staff && <td>{t.assigned_agent_name || <span className="text-base-content/50">Unassigned</span>}</td>}
                      <td>
                        {t.resolved_at ? <span className="badge badge-sm badge-success">Resolved</span>
                          : <SlaTimer label="" seconds={t.resolution_remaining_seconds} breached={t.resolution_breached} />}
                      </td>
                      <td>{formatDate(t.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pagination page={page} pageSize={pageSize} total={data.total} onChange={setPage} />
        </Card>
      )}
    </>
  );
}

export function NewTicket() {
  const navigate = useNavigate();
  const [f, setF] = useState({ subject: "", description: "", category: "general", priority: "medium" });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const create = useMutation({
    mutationFn: () => ticketApi.create(f),
    onSuccess: (t) => { toast.success("Ticket submitted"); navigate(`/tickets/${t.id}`); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  return (
    <>
      <PageHeader title="New support ticket" />
      <Card>
        <form className="max-w-xl" onSubmit={(e) => { e.preventDefault(); create.mutate(); }}>
          <Field label="Subject"><input className="input input-bordered w-full" required value={f.subject} onChange={set("subject")} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category"><select className="select select-bordered w-full" value={f.category} onChange={set("category")}>{TICKET_CATEGORIES.map((c) => <option key={c} value={c}>{humanize(c)}</option>)}</select></Field>
            <Field label="Priority"><select className="select select-bordered w-full" value={f.priority} onChange={set("priority")}>{TICKET_PRIORITIES.map((c) => <option key={c} value={c}>{humanize(c)}</option>)}</select></Field>
          </div>
          <Field label="Describe the problem"><textarea className="textarea textarea-bordered w-full h-36" required value={f.description} onChange={set("description")} /></Field>
          <button className="btn btn-primary" disabled={create.isPending}>Submit ticket</button>
        </form>
      </Card>
    </>
  );
}
