import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { planApi, subApi } from "../../api";
import { useAuth } from "../../context/AuthContext";
import { ROLE, BILLING_PERIODS } from "../../constants/enums";
import { Card, Empty, ErrorBox, Field, Loading, Modal, Money, PageHeader, StatusBadge } from "../../components/ui";
import { errorMessage, humanize } from "../../utils/format";

const EMPTY = { name: "", description: "", price: "", billing_period: "monthly", tax_percent: "0" };

function AdminPlans() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ["plans"], queryFn: planApi.list });
  const [editing, setEditing] = useState(null); // null | "new" | plan
  const [form, setForm] = useState(EMPTY);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const openForm = (plan) => {
    setEditing(plan);
    setForm(plan === "new" ? EMPTY : { name: plan.name, description: plan.description || "", price: plan.price, billing_period: plan.billing_period, tax_percent: plan.tax_percent });
  };
  const save = useMutation({
    mutationFn: () => {
      // send money as strings so no float rounding happens
      const body = { ...form, price: String(form.price), tax_percent: String(form.tax_percent || "0"), description: form.description || null };
      return editing === "new" ? planApi.create(body) : planApi.update(editing.id, body);
    },
    onSuccess: () => { toast.success("Plan saved"); setEditing(null); qc.invalidateQueries({ queryKey: ["plans"] }); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const toggle = useMutation({
    mutationFn: (p) => planApi.setStatus(p.id, !p.is_active),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["plans"] }),
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <>
      <PageHeader title="Plans"><button className="btn btn-primary btn-sm" onClick={() => openForm("new")}>New plan</button></PageHeader>
      {isLoading ? <Loading /> : error ? <ErrorBox error={error} /> : (
        <Card>
          {data.length === 0 ? <Empty text="No plans yet. Create your first one." /> : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead><tr><th>Name</th><th>Price</th><th>Period</th><th>Tax</th><th>Status</th><th /></tr></thead>
                <tbody>
                  {data.map((p) => (
                    <tr key={p.id}>
                      <td><div className="font-medium">{p.name}</div><div className="text-xs text-base-content/60">{p.description}</div></td>
                      <td><Money value={p.price} /></td><td>{humanize(p.billing_period)}</td><td>{p.tax_percent}%</td>
                      <td><StatusBadge value={p.is_active ? "active" : "cancelled"} /></td>
                      <td className="text-right space-x-1">
                        <button className="btn btn-xs" onClick={() => openForm(p)}>Edit</button>
                        <button className="btn btn-xs" onClick={() => toggle.mutate(p)}>{p.is_active ? "Deactivate" : "Activate"}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
      <Modal open={!!editing} title={editing === "new" ? "New plan" : "Edit plan"} onClose={() => setEditing(null)}>
        <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
          <Field label="Name"><input className="input input-bordered w-full" required minLength={2} maxLength={100} value={form.name} onChange={set("name")} /></Field>
          <Field label="Description"><textarea className="textarea textarea-bordered w-full" value={form.description} onChange={set("description")} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Price"><input type="number" step="0.01" min="0" className="input input-bordered w-full" required value={form.price} onChange={set("price")} /></Field>
            <Field label="Tax %"><input type="number" step="0.01" min="0" className="input input-bordered w-full" value={form.tax_percent} onChange={set("tax_percent")} /></Field>
          </div>
          <Field label="Billing period">
            <select className="select select-bordered w-full" value={form.billing_period} onChange={set("billing_period")}>
              {BILLING_PERIODS.map((b) => <option key={b} value={b}>{humanize(b)}</option>)}
            </select>
          </Field>
          <div className="modal-action"><button type="button" className="btn" onClick={() => setEditing(null)}>Cancel</button><button className="btn btn-primary" disabled={save.isPending}>Save</button></div>
        </form>
      </Modal>
    </>
  );
}

function PlanCards({ canSubscribe }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const plans = useQuery({ queryKey: ["plans"], queryFn: planApi.list });
  const mine = useQuery({ queryKey: ["my-subs"], queryFn: subApi.mine, enabled: canSubscribe });
  const subscribe = useMutation({
    mutationFn: (id) => subApi.create(id),
    onSuccess: () => { toast.success("Subscribed!"); qc.invalidateQueries(); navigate("/subscriptions"); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  if (plans.isLoading || (canSubscribe && mine.isLoading)) return <Loading />;
  if (plans.error) return <ErrorBox error={plans.error} />;
  const current = new Set((canSubscribe ? mine.data || [] : []).filter((s) => ["active", "paused", "past_due"].includes(s.status)).map((s) => s.plan_id));
  const active = plans.data.filter((p) => p.is_active);
  return (
    <>
      <PageHeader title={canSubscribe ? "Choose a plan" : "Plans"} />
      {active.length === 0 ? <Empty text="No plans are available right now." /> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {active.map((p) => (
            <div key={p.id} className="card bg-base-100 shadow-sm border border-base-200">
              <div className="card-body">
                <h2 className="card-title">{p.name}</h2>
                <p className="text-base-content/70 flex-grow-0">{p.description}</p>
                <div className="text-3xl font-bold my-2"><Money value={p.price} /><span className="text-sm font-normal text-base-content/60"> / {p.billing_period === "monthly" ? "mo" : "yr"}</span></div>
                {Number(p.tax_percent) > 0 && <div className="text-xs text-base-content/60">+ {p.tax_percent}% tax</div>}
                {canSubscribe && <div className="card-actions mt-2">
                  {current.has(p.id) ? <button className="btn btn-disabled w-full">Current plan</button>
                    : <button className="btn btn-primary w-full" disabled={subscribe.isPending} onClick={() => subscribe.mutate(p.id)}>Subscribe</button>}
                </div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default function Plans() {
  const { user } = useAuth();
  if (user.role === ROLE.ORG_ADMIN) return <AdminPlans />;
  return <PlanCards canSubscribe={user.role === ROLE.CUSTOMER} />;
}
