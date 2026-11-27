import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { customerApi } from "../../api";
import { useAuth } from "../../context/AuthContext";
import { ROLE } from "../../constants/enums";
import { Card, Empty, ErrorBox, Field, Loading, Modal, Money, PageHeader, Pagination, StatusBadge } from "../../components/ui";
import { errorMessage, formatDate } from "../../utils/format";

export function CustomerList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const pageSize = 10;
  const params = { page, page_size: pageSize, ...(search ? { search } : {}) };
  const { data, isLoading, error } = useQuery({ queryKey: ["customers", params], queryFn: () => customerApi.list(params) });
  return (
    <>
      <PageHeader title="Customers">
        <input className="input input-bordered input-sm" placeholder="Search name or email…" value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} />
      </PageHeader>
      {isLoading ? <Loading /> : error ? <ErrorBox error={error} /> : (
        <Card>
          {data.items.length === 0 ? <Empty /> : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead><tr><th>Name</th><th>Email</th><th>Company</th><th>Status</th><th>Joined</th></tr></thead>
                <tbody>
                  {data.items.map((c) => (
                    <tr key={c.id} className="hover">
                      <td><Link className="link link-primary" to={`/customers/${c.id}`}>{c.full_name}</Link></td>
                      <td>{c.email}</td><td>{c.company_name || "—"}</td><td><StatusBadge value={c.is_active ? "active" : "cancelled"} /></td><td>{formatDate(c.created_at)}</td>
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

export function CustomerDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const isAdmin = user.role === ROLE.ORG_ADMIN;
  const { data: c, isLoading, error } = useQuery({ queryKey: ["customer", id], queryFn: () => customerApi.get(id) });
  const [editing, setEditing] = useState(false);
  const [f, setF] = useState({ full_name: "", phone: "", company_name: "" });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const refresh = () => { qc.invalidateQueries({ queryKey: ["customer", id] }); qc.invalidateQueries({ queryKey: ["customers"] }); };
  const save = useMutation({
    mutationFn: () => customerApi.update(id, { full_name: f.full_name, phone: f.phone || null, company_name: f.company_name || null }),
    onSuccess: () => { toast.success("Customer updated"); setEditing(false); refresh(); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const toggle = useMutation({
    mutationFn: () => customerApi.update(id, { is_active: !c.is_active }),
    onSuccess: () => { toast.success("Customer updated"); refresh(); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  if (isLoading) return <Loading />;
  if (error) return <ErrorBox error={error} />;
  const startEdit = () => { setF({ full_name: c.full_name, phone: c.phone || "", company_name: c.company_name || "" }); setEditing(true); };
  return (
    <>
      <PageHeader title={c.full_name}>
        <Link to="/customers" className="btn btn-sm">← Back</Link>
        {isAdmin && <button className="btn btn-sm btn-primary" onClick={startEdit}>Edit</button>}
        {isAdmin && <button className="btn btn-sm btn-outline" disabled={toggle.isPending} onClick={() => toggle.mutate()}>{c.is_active ? "Deactivate login" : "Activate login"}</button>}
      </PageHeader>
      <Card>
        <div className="grid sm:grid-cols-4 gap-4 text-sm">
          <div><div className="text-base-content/60">Email</div>{c.email}</div>
          <div><div className="text-base-content/60">Phone</div>{c.phone || "—"}</div>
          <div><div className="text-base-content/60">Company</div>{c.company_name || "—"}</div>
          <div><div className="text-base-content/60">Login</div><StatusBadge value={c.is_active ? "active" : "cancelled"} /></div>
        </div>
      </Card>
      <div className="grid lg:grid-cols-2 gap-4 mt-4">
        <Card title="Subscriptions">
          {c.subscriptions.length === 0 ? <Empty /> : c.subscriptions.map((s) => (
            <div key={s.id} className="flex justify-between text-sm py-1"><span>{s.plan_name} · renews {formatDate(s.next_billing_date || s.current_period_end)}</span><StatusBadge value={s.status} /></div>
          ))}
        </Card>
        <Card title="Invoices">
          {c.invoices.length === 0 ? <Empty /> : c.invoices.map((i) => (
            <div key={i.id} className="flex justify-between text-sm py-1"><Link className="link link-hover" to={`/invoices/${i.id}`}>{i.invoice_number} · {formatDate(i.issued_at)}</Link><span className="flex gap-2"><Money value={i.total} /><StatusBadge value={i.status} /></span></div>
          ))}
        </Card>
        <Card title="Payments">
          {c.payments.length === 0 ? <Empty /> : c.payments.map((p) => (
            <div key={p.id} className="flex justify-between text-sm py-1"><span>{formatDate(p.created_at)}{p.failure_reason ? ` · ${p.failure_reason}` : ""}</span><span className="flex gap-2"><Money value={p.amount} /><StatusBadge value={p.status} /></span></div>
          ))}
        </Card>
        <Card title="Tickets">
          {c.tickets.length === 0 ? <Empty /> : c.tickets.map((t) => (
            <div key={t.id} className="flex justify-between text-sm py-1"><Link className="link link-hover truncate" to={`/tickets/${t.id}`}>{t.subject}</Link><StatusBadge value={t.status} /></div>
          ))}
        </Card>
      </div>
      <Modal open={editing} title="Edit customer" onClose={() => setEditing(false)}>
        <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
          <Field label="Full name"><input className="input input-bordered w-full" required value={f.full_name} onChange={set("full_name")} /></Field>
          <Field label="Phone"><input className="input input-bordered w-full" maxLength={30} value={f.phone} onChange={set("phone")} /></Field>
          <Field label="Company"><input className="input input-bordered w-full" maxLength={150} value={f.company_name} onChange={set("company_name")} /></Field>
          <div className="modal-action"><button type="button" className="btn" onClick={() => setEditing(false)}>Cancel</button><button className="btn btn-primary" disabled={save.isPending}>Save</button></div>
        </form>
      </Modal>
    </>
  );
}
