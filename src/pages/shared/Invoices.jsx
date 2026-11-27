import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { invoiceApi } from "../../api";
import { useAuth } from "../../context/AuthContext";
import { ROLE } from "../../constants/enums";
import { Card, Empty, ErrorBox, Loading, Money, PageHeader, Pagination, StatusBadge } from "../../components/ui";
import { errorMessage, formatDate, humanize } from "../../utils/format";

const STATUSES = ["open", "paid", "failed", "void", "refunded"];

export function InvoiceList() {
  const { user } = useAuth();
  const customer = user.role === ROLE.CUSTOMER;
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const pageSize = 10;
  const params = { page, page_size: pageSize, ...(status ? { status } : {}) };
  const { data, isLoading, error } = useQuery({
    queryKey: ["invoices", customer, params],
    queryFn: () => (customer ? invoiceApi.mine(params) : invoiceApi.list(params)),
  });
  return (
    <>
      <PageHeader title="Invoices">
        <select className="select select-bordered select-sm" value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{humanize(s)}</option>)}
        </select>
      </PageHeader>
      {isLoading ? <Loading /> : error ? <ErrorBox error={error} /> : (
        <Card>
          {data.items.length === 0 ? <Empty text="No invoices found." /> : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead><tr><th>Invoice</th>{!customer && <th>Customer</th>}<th>Period</th><th>Total</th><th>Status</th><th>Due</th></tr></thead>
                <tbody>
                  {data.items.map((i) => (
                    <tr key={i.id} className="hover">
                      <td><Link className="link link-primary" to={`/invoices/${i.id}`}>{i.invoice_number}</Link></td>
                      {!customer && <td>{i.customer_name || `#${i.customer_id}`}</td>}
                      <td className="whitespace-nowrap">{formatDate(i.period_start)} – {formatDate(i.period_end)}</td>
                      <td><Money value={i.total} /></td><td><StatusBadge value={i.status} /></td><td>{formatDate(i.due_date)}</td>
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

export function InvoiceDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: inv, isLoading, error } = useQuery({ queryKey: ["invoice", id], queryFn: () => invoiceApi.get(id) });
  const pay = useMutation({
    mutationFn: () => invoiceApi.pay(id),
    onSuccess: () => { toast.success("Payment submitted"); qc.invalidateQueries(); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  if (isLoading) return <Loading />;
  if (error) return <ErrorBox error={error} />;
  const canPay = user.role === ROLE.CUSTOMER && ["open", "failed"].includes(inv.status) && Number(inv.total) > 0;
  return (
    <>
      <PageHeader title={inv.invoice_number}>
        <Link to="/invoices" className="btn btn-sm">← Back</Link>
        {canPay && <button className="btn btn-primary btn-sm" disabled={pay.isPending} onClick={() => pay.mutate()}>{inv.status === "failed" ? "Retry payment" : "Pay now"}</button>}
      </PageHeader>
      <Card>
        <div className="flex flex-wrap gap-6 text-sm mb-4">
          <div><div className="text-base-content/60">Status</div><StatusBadge value={inv.status} /></div>
          <div><div className="text-base-content/60">Issued</div>{formatDate(inv.issued_at)}</div>
          <div><div className="text-base-content/60">Due</div>{formatDate(inv.due_date)}</div>
          <div><div className="text-base-content/60">Paid</div>{formatDate(inv.paid_at)}</div>
          <div><div className="text-base-content/60">Period</div>{formatDate(inv.period_start)} – {formatDate(inv.period_end)}</div>
        </div>
        <div className="overflow-x-auto">
          <table className="table table-sm">
            <thead><tr><th>Description</th><th>Type</th><th className="text-right">Qty</th><th className="text-right">Unit</th><th className="text-right">Amount</th></tr></thead>
            <tbody>
              {(inv.items || []).map((it) => (
                <tr key={it.id}><td>{it.description}</td><td>{humanize(it.item_type)}</td><td className="text-right">{it.quantity}</td>
                  <td className="text-right"><Money value={it.unit_amount} /></td><td className="text-right"><Money value={it.amount} /></td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="ml-auto w-full max-w-xs text-sm space-y-1 mt-4">
          <div className="flex justify-between"><span>Subtotal</span><Money value={inv.subtotal} /></div>
          <div className="flex justify-between"><span>Discount</span><Money value={inv.discount_amount} /></div>
          <div className="flex justify-between"><span>Tax</span><Money value={inv.tax_amount} /></div>
          <div className="flex justify-between font-bold text-base border-t border-base-300 pt-1"><span>Total</span><Money value={inv.total} /></div>
        </div>
      </Card>
    </>
  );
}
