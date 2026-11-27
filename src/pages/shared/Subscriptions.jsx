import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { planApi, subApi } from "../../api";
import { useAuth } from "../../context/AuthContext";
import { ROLE, SUBSCRIPTION_STATUSES } from "../../constants/enums";
import { Card, Empty, ErrorBox, Loading, Modal, Money, PageHeader, StatusBadge } from "../../components/ui";
import { errorMessage, formatDate, humanize } from "../../utils/format";

function CancelModal({ sub, onClose, onDone, pending, adminView }) {
  const live = sub?.status === "active";
  return (
    <Modal open={!!sub} title={`Cancel ${sub?.plan_name || "subscription"}`} onClose={onClose}>
      <p>
        {adminView ? `Cancel ${sub?.customer_name || "this customer"}'s subscription?` : "Do you want to keep access until the end of the current billing period?"}
        {!live && <span className="block text-sm text-base-content/60 mt-2">This subscription is not active, so it will end immediately.</span>}
      </p>
      <div className="modal-action">
        <button className="btn" onClick={onClose}>Keep subscription</button>
        {live && <button className="btn btn-warning" disabled={pending} onClick={() => onDone(true)}>Cancel at period end</button>}
        <button className="btn btn-error" disabled={pending} onClick={() => onDone(false)}>Cancel now</button>
      </div>
    </Modal>
  );
}

// Org Admin and Agent: everything in the organization (only the Org Admin can cancel)
function StaffSubscriptions({ canCancel }) {
  const qc = useQueryClient();
  const [status, setStatus] = useState("");
  const [cancelling, setCancelling] = useState(null);
  const params = status ? { subscription_status: status } : {};
  const { data, isLoading, error } = useQuery({ queryKey: ["subs", params], queryFn: () => subApi.list(params) });
  const cancel = useMutation({
    mutationFn: (atEnd) => subApi.cancel(cancelling.id, atEnd),
    onSuccess: () => { toast.success("Subscription updated"); setCancelling(null); qc.invalidateQueries(); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  return (
    <>
      <PageHeader title="Subscriptions">
        <select className="select select-bordered select-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {SUBSCRIPTION_STATUSES.map((s) => <option key={s} value={s}>{humanize(s)}</option>)}
        </select>
      </PageHeader>
      {isLoading ? <Loading /> : error ? <ErrorBox error={error} /> : (
        <Card>
          {data.length === 0 ? <Empty text="No subscriptions yet." /> : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead><tr><th>Customer</th><th>Plan</th><th>Price</th><th>Status</th><th>Started</th><th>Period ends</th><th>Ends at period end</th>{canCancel && <th />}</tr></thead>
                <tbody>
                  {data.map((s) => (
                    <tr key={s.id}>
                      <td><Link className="link link-primary" to={`/customers/${s.customer_id}`}>{s.customer_name || `#${s.customer_id}`}</Link></td>
                      <td>{s.plan_name}</td>
                      <td><Money value={s.plan_price} /> / {s.billing_period === "yearly" ? "yr" : "mo"}</td>
                      <td><StatusBadge value={s.status} /></td>
                      <td>{formatDate(s.start_date)}</td><td>{formatDate(s.current_period_end)}</td>
                      <td>{s.cancel_at_period_end ? "Yes" : "No"}</td>
                      {canCancel && <td className="text-right">{s.status !== "cancelled" && <button className="btn btn-xs btn-error btn-outline" onClick={() => setCancelling(s)}>Cancel</button>}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
      <CancelModal sub={cancelling} adminView onClose={() => setCancelling(null)} onDone={(atEnd) => cancel.mutate(atEnd)} pending={cancel.isPending} />
    </>
  );
}

// Customer: own subscriptions with change / pause / resume / cancel
function CustomerSubscriptions() {
  const qc = useQueryClient();
  const plans = useQuery({ queryKey: ["plans"], queryFn: planApi.list });
  const { data, isLoading, error } = useQuery({ queryKey: ["my-subs"], queryFn: subApi.mine });
  const [changing, setChanging] = useState(null);
  const [newPlan, setNewPlan] = useState("");
  const [cancelling, setCancelling] = useState(null);

  const done = (msg) => () => { toast.success(msg); qc.invalidateQueries(); setChanging(null); setCancelling(null); };
  const fail = (e) => toast.error(errorMessage(e));
  const pause = useMutation({ mutationFn: subApi.pause, onSuccess: done("Subscription paused"), onError: fail });
  const resume = useMutation({ mutationFn: subApi.resume, onSuccess: done("Subscription resumed"), onError: fail });
  const change = useMutation({ mutationFn: () => subApi.changePlan(changing.id, Number(newPlan)), onSuccess: done("Plan changed. Any difference appears on a new invoice."), onError: fail });
  const cancel = useMutation({ mutationFn: (atEnd) => subApi.cancel(cancelling.id, atEnd), onSuccess: done("Cancellation recorded"), onError: fail });

  if (isLoading) return <Loading />;
  if (error) return <ErrorBox error={error} />;
  const options = (plans.data || []).filter((p) => p.is_active && p.id !== changing?.plan_id);

  return (
    <>
      <PageHeader title="My subscription"><Link to="/plans" className="btn btn-sm btn-primary">Browse plans</Link></PageHeader>
      {data.length === 0 ? <Empty text="You have no subscriptions yet. Visit Plans to get started." /> : (
        <div className="grid gap-4">
          {data.map((s) => (
            <Card key={s.id}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-lg font-semibold">{s.plan_name} <StatusBadge value={s.status} /></div>
                  <div className="text-base-content/70"><Money value={s.plan_price} /> / {s.billing_period}</div>
                  <div className="text-sm text-base-content/60 mt-2">
                    Current period: {formatDate(s.current_period_start)} – {formatDate(s.current_period_end)}
                    {s.next_billing_date && s.status !== "cancelled" && <> · next bill {formatDate(s.next_billing_date)}</>}
                  </div>
                  {s.cancel_at_period_end && s.status !== "cancelled" && <div className="badge badge-warning mt-2">Ends on {formatDate(s.current_period_end)}</div>}
                  {s.status === "cancelled" && <div className="text-sm text-base-content/60 mt-1">Cancelled on {formatDate(s.cancelled_at)}</div>}
                </div>
                {s.status !== "cancelled" && (
                  <div className="flex flex-wrap gap-2">
                    {s.status === "active" && <button className="btn btn-sm" onClick={() => { setChanging(s); setNewPlan(""); }}>Change plan</button>}
                    {s.status === "paused"
                      ? <button className="btn btn-sm" disabled={resume.isPending} onClick={() => resume.mutate(s.id)}>Resume</button>
                      : s.status === "active" && <button className="btn btn-sm" disabled={pause.isPending} onClick={() => pause.mutate(s.id)}>Pause</button>}
                    {!(s.cancel_at_period_end && s.status === "active") && <button className="btn btn-sm btn-error btn-outline" onClick={() => setCancelling(s)}>Cancel</button>}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!changing} title="Change plan" onClose={() => setChanging(null)}>
        <select className="select select-bordered w-full" value={newPlan} onChange={(e) => setNewPlan(e.target.value)}>
          <option value="">Select a plan…</option>
          {options.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.price} / {p.billing_period}</option>)}
        </select>
        <p className="text-sm text-base-content/60 mt-3">Switching mid-period is prorated: you are charged or credited for the remaining days, and the difference is invoiced immediately.</p>
        <div className="modal-action">
          <button className="btn" onClick={() => setChanging(null)}>Back</button>
          <button className="btn btn-primary" disabled={!newPlan || change.isPending} onClick={() => change.mutate()}>Confirm change</button>
        </div>
      </Modal>
      <CancelModal sub={cancelling} onClose={() => setCancelling(null)} onDone={(atEnd) => cancel.mutate(atEnd)} pending={cancel.isPending} />
    </>
  );
}

export default function Subscriptions() {
  const { user } = useAuth();
  if (user.role === ROLE.CUSTOMER) return <CustomerSubscriptions />;
  return <StaffSubscriptions canCancel={user.role === ROLE.ORG_ADMIN} />;
}
