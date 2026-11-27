import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { paymentApi } from "../../api";
import { useAuth } from "../../context/AuthContext";
import { ROLE } from "../../constants/enums";
import { Card, Empty, ErrorBox, Field, Loading, Modal, Money, PageHeader, Pagination, StatusBadge } from "../../components/ui";
import { errorMessage, formatDate, formatDateTime } from "../../utils/format";

function AttemptsModal({ payment, onClose }) {
  const { data, isLoading, error } = useQuery({ queryKey: ["attempts", payment?.id], queryFn: () => paymentApi.attempts(payment.id), enabled: !!payment });
  const rows = Array.isArray(data) ? data : data?.items || [];
  return (
    <Modal open={!!payment} title={`Attempts for payment #${payment?.id}`} onClose={onClose}>
      {isLoading ? <Loading /> : error ? <ErrorBox error={error} /> : rows.length === 0 ? <Empty text="No attempts recorded." /> : (
        <ul className="space-y-2 text-sm">
          {rows.map((a) => (
            <li key={a.id} className="flex items-start justify-between gap-3 border-b border-base-200 pb-2">
              <div><div className="font-medium">Attempt {a.attempt_number}</div><div className="text-xs text-base-content/60">{formatDateTime(a.attempted_at)}</div>
                {a.next_retry_at && <div className="text-xs text-warning">Next retry {formatDateTime(a.next_retry_at)}</div>}</div>
              <StatusBadge value={a.status} />
            </li>
          ))}
        </ul>
      )}
      <div className="modal-action"><button className="btn" onClick={onClose}>Close</button></div>
    </Modal>
  );
}

function RefundModal({ payment, onClose }) {
  const qc = useQueryClient();
  const [amount, setAmount] = useState(payment ? String(payment.amount) : "");
  const [reason, setReason] = useState("");
  const refund = useMutation({
    mutationFn: () => paymentApi.refund(payment.id, { amount: String(amount), ...(reason ? { reason } : {}) }),
    onSuccess: () => { toast.success("Refund issued"); qc.invalidateQueries(); onClose(); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  return (
    <Modal open={!!payment} title={`Refund payment #${payment?.id}`} onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); refund.mutate(); }}>
        <p className="text-sm mb-3">Paid amount: <b><Money value={payment?.amount} /></b>. The amount is pre-filled for a full refund; lower it for a partial refund.</p>
        <Field label="Refund amount"><input type="number" step="0.01" min="0.01" className="input input-bordered w-full" required value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
        <Field label="Reason (optional)"><input className="input input-bordered w-full" maxLength={1000} value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
        <div className="modal-action"><button type="button" className="btn" onClick={onClose}>Cancel</button><button className="btn btn-warning" disabled={refund.isPending}>Issue refund</button></div>
      </form>
    </Modal>
  );
}

function RefundList() {
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const { data, isLoading, error } = useQuery({ queryKey: ["refunds", page], queryFn: () => paymentApi.refunds({ page, page_size: pageSize }) });
  if (isLoading) return <Loading />;
  if (error) return <ErrorBox error={error} />;
  return (
    <Card>
      {data.items.length === 0 ? <Empty text="No refunds yet." /> : (
        <div className="overflow-x-auto">
          <table className="table">
            <thead><tr><th>Date</th><th>Payment</th><th>Invoice</th><th>Amount</th><th>Reason</th><th>Status</th></tr></thead>
            <tbody>{data.items.map((r) => (
              <tr key={r.id}><td>{formatDate(r.created_at)}</td><td>#{r.payment_id}</td><td>#{r.invoice_id}</td><td><Money value={r.amount} /></td><td>{r.reason}</td><td><StatusBadge value={r.status} /></td></tr>
            ))}</tbody>
          </table>
        </div>
      )}
      <Pagination page={page} pageSize={pageSize} total={data.total} onChange={setPage} />
    </Card>
  );
}

export default function Payments() {
  const { user } = useAuth();
  const customer = user.role === ROLE.CUSTOMER;
  const isAdmin = user.role === ROLE.ORG_ADMIN;
  const [tab, setTab] = useState("payments");
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [attempts, setAttempts] = useState(null);
  const [refunding, setRefunding] = useState(null);
  const pageSize = 10;
  const params = { page, page_size: pageSize, ...(status ? { status } : {}) };
  const { data, isLoading, error } = useQuery({
    queryKey: ["payments", customer, params],
    queryFn: () => (customer ? paymentApi.mine(params) : paymentApi.list(params)),
    enabled: tab === "payments",
  });
  return (
    <>
      <PageHeader title="Payments">
        {tab === "payments" && (
          <select className="select select-bordered select-sm" value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}>
            <option value="">All statuses</option>
            {["pending", "succeeded", "failed", "refunded"].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
      </PageHeader>
      {isAdmin && (
        <div role="tablist" className="tabs tabs-box mb-4 w-fit">
          <button role="tab" className={`tab ${tab === "payments" ? "tab-active" : ""}`} onClick={() => setTab("payments")}>Payments</button>
          <button role="tab" className={`tab ${tab === "refunds" ? "tab-active" : ""}`} onClick={() => setTab("refunds")}>Refunds</button>
        </div>
      )}
      {tab === "refunds" ? <RefundList /> : isLoading ? <Loading /> : error ? <ErrorBox error={error} /> : (
        <Card>
          {data.items.length === 0 ? <Empty text="No payments found." /> : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead><tr><th>Date</th>{!customer && <th>Customer</th>}<th>Invoice</th><th>Amount</th><th>Status</th><th>Details</th><th /></tr></thead>
                <tbody>
                  {data.items.map((p) => (
                    <tr key={p.id}>
                      <td>{formatDate(p.created_at)}</td>
                      {!customer && <td>{p.customer_name || `#${p.customer_id}`}</td>}
                      <td>#{p.invoice_id}</td><td><Money value={p.amount} /></td><td><StatusBadge value={p.status} /></td>
                      <td className="text-xs text-error">{p.failure_reason}</td>
                      <td className="text-right space-x-1 whitespace-nowrap">
                        <button className="btn btn-xs" onClick={() => setAttempts(p)}>Attempts</button>
                        {isAdmin && p.status === "succeeded" && <button className="btn btn-xs btn-warning btn-outline" onClick={() => setRefunding(p)}>Refund</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pagination page={page} pageSize={pageSize} total={data.total} onChange={setPage} />
        </Card>
      )}
      {attempts && <AttemptsModal payment={attempts} onClose={() => setAttempts(null)} />}
      {refunding && <RefundModal payment={refunding} onClose={() => setRefunding(null)} />}
    </>
  );
}
