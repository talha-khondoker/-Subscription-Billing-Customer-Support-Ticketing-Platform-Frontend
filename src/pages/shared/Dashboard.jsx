import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { customerApi, dashboardApi, orgApi, planApi, userApi } from "../../api";
import { useAuth } from "../../context/AuthContext";
import { ROLE, ROLE_LABEL } from "../../constants/enums";
import { Card, Empty, ErrorBox, Loading, Money, StatusBadge } from "../../components/ui";
import { formatDate } from "../../utils/format";

const pct = (v) => (v === null || v === undefined ? "—" : `${v}%`);
const TONES = {
  primary: ["bg-primary/10 text-primary", "border-t-primary"],
  success: ["bg-success/10 text-success", "border-t-success"],
  warning: ["bg-warning/10 text-warning", "border-t-warning"],
  error: ["bg-error/10 text-error", "border-t-error"],
  info: ["bg-info/10 text-info", "border-t-info"],
  secondary: ["bg-secondary/10 text-secondary", "border-t-secondary"],
};

function Kpi({ icon, label, value, sub, tone = "primary" }) {
  const [chip, border] = TONES[tone];
  return (
    <div className={`card bg-base-100 border border-base-200 border-t-4 ${border} shadow-sm hover:shadow-md transition`}>
      <div className="card-body p-4 flex-row items-center gap-4">
        <div className={`size-12 shrink-0 rounded-box grid place-items-center text-2xl ${chip}`}>{icon}</div>
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-wide text-base-content/60">{label}</div>
          <div className="text-2xl font-bold truncate">{value}</div>
          {sub && <div className="text-xs text-base-content/60">{sub}</div>}
        </div>
      </div>
    </div>
  );
}

function Gauge({ label, value }) {
  const v = value ?? 0;
  const color = v >= 90 ? "text-success" : v >= 70 ? "text-warning" : "text-error";
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`radial-progress ${value === null || value === undefined ? "text-base-300" : color}`} style={{ "--value": v, "--size": "5.5rem", "--thickness": "0.5rem" }} role="progressbar">
        <span className="text-lg font-bold text-base-content">{pct(value)}</span>
      </div>
      <div className="text-xs text-base-content/60 text-center">{label}</div>
    </div>
  );
}

function Welcome({ actions = [] }) {
  const { user } = useAuth();
  const h = new Date().getHours();
  const greet = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  return (
    <div className="rounded-box bg-gradient-to-r from-primary to-secondary text-primary-content p-6 mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <div className="text-sm opacity-80">{new Date().toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
        <h1 className="text-2xl md:text-3xl font-extrabold">{greet}, {user.full_name.split(" ")[0]}</h1>
        <span className="badge bg-white/20 border-0 text-primary-content mt-2">{ROLE_LABEL[user.role]}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {actions.map(([to, label]) => <Link key={to} to={to} className="btn btn-sm bg-white text-primary border-0 hover:scale-105 transition">{label}</Link>)}
      </div>
    </div>
  );
}

function ProfileSummary() {
  const { user } = useAuth();
  const isCustomer = user.role === ROLE.CUSTOMER;
  const isSA = user.role === ROLE.SUPER_ADMIN;
  const cust = useQuery({ queryKey: ["customer-me"], queryFn: customerApi.me, enabled: isCustomer });
  const org = useQuery({ queryKey: ["org-me"], queryFn: orgApi.me, enabled: !isSA });
  const item = (label, value) => (
    <div><div className="text-xs uppercase text-base-content/60">{label}</div><div className="font-medium break-words">{value || "—"}</div></div>
  );
  return (
    <Card title="My profile" actions={<Link to="/profile" className="btn btn-xs btn-primary">View &amp; edit</Link>}>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {item("Name", user.full_name)}
        {item("Email", user.email)}
        {item("Role", ROLE_LABEL[user.role])}
        {!isSA && item("Organization", org.data?.name)}
        {isCustomer && item("Phone", cust.data?.phone)}
        {isCustomer && item("Company", cust.data?.company_name)}
      </div>
    </Card>
  );
}

// Org Admin: quick numbers for what they manage, each linking to its page
function OrgSnapshot() {
  const plans = useQuery({ queryKey: ["plans"], queryFn: planApi.list });
  const agents = useQuery({ queryKey: ["agents"], queryFn: userApi.agents });
  const customers = useQuery({ queryKey: ["customers-count"], queryFn: () => customerApi.list({ page: 1, page_size: 1 }) });
  const tile = (to, icon, label, value) => (
    <Link to={to} className="rounded-box bg-base-200 hover:bg-base-300 transition p-4 text-center">
      <div className="text-2xl">{icon}</div><div className="text-2xl font-bold">{value ?? "…"}</div><div className="text-xs text-base-content/60">{label}</div>
    </Link>
  );
  return (
    <Card title="My organization">
      <div className="grid grid-cols-3 gap-3">
        {tile("/plans", "📦", "Plans", plans.data?.length)}
        {tile("/agents", "🎧", "Agents", agents.data?.length)}
        {tile("/customers", "👥", "Customers", customers.data?.total)}
      </div>
    </Card>
  );
}

const Grid = ({ children }) => <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">{children}</div>;
const Row = ({ left, right }) => <div className="flex justify-between items-center gap-2 text-sm py-2 border-b border-base-200 last:border-0"><span className="truncate">{left}</span><span className="flex items-center gap-2 shrink-0">{right}</span></div>;

function PlatformDashboard() {
  const { data, isLoading, error } = useQuery({ queryKey: ["dash", "platform"], queryFn: dashboardApi.platform });
  if (isLoading) return <Loading />;
  if (error) return <ErrorBox error={error} />;
  return (
    <>
      <Welcome actions={[["/organizations", "Manage organizations"], ["/audit-logs", "Audit logs"], ["/profile", "My profile"]]} />
      <Grid>
        <Kpi icon="🏢" label="Organizations" value={data.organizations_total} sub={`${data.organizations_active} active · ${data.organizations_disabled} disabled`} />
        <Kpi icon="👥" label="Customers" value={data.total_customers} sub={`${data.total_users} platform users`} tone="info" />
        <Kpi icon="💰" label="Platform MRR" value={<Money value={data.platform_mrr} />} sub={<>ARR <Money value={data.platform_arr} /></>} tone="success" />
        <Kpi icon="📦" label="Active subscriptions" value={data.active_subscriptions} tone="secondary" />
        <Kpi icon="🎫" label="Open tickets" value={data.open_tickets} tone="warning" />
        <Kpi icon="⚠️" label="Failed payments" value={data.failed_payments} tone={data.failed_payments ? "error" : "success"} />
      </Grid>
      <Card title="Top organizations by MRR">
        {data.top_organizations.length === 0 ? <Empty /> : (
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead><tr><th>#</th><th>Organization</th><th>Status</th><th>Customers</th><th>Active subs</th><th className="text-right">MRR</th></tr></thead>
              <tbody>{data.top_organizations.map((o, i) => (
                <tr key={o.id}><td>{i + 1}</td><td className="font-medium">{o.name}</td><td><StatusBadge value={o.status} /></td><td>{o.customers}</td><td>{o.active_subscriptions}</td><td className="text-right"><Money value={o.mrr} /></td></tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </Card>
      <div className="mt-4"><ProfileSummary /></div>
    </>
  );
}

function AdminDashboard() {
  const [days, setDays] = useState(30);
  const { data, isLoading, error } = useQuery({ queryKey: ["dash", "admin", days], queryFn: () => dashboardApi.admin(days) });
  const max = Math.max(1, ...(data?.revenue.by_month.map((m) => Number(m.revenue)) || [1]));
  return (
    <>
      <Welcome actions={[["/plans", "Plans"], ["/agents", "Agents"], ["/customers", "Customers"], ["/tickets", "Tickets"], ["/profile", "Profile & organization"]]} />
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Business overview</h2>
        <select className="select select-bordered select-sm" value={days} onChange={(e) => setDays(Number(e.target.value))}>
          {[7, 30, 90, 365].map((d) => <option key={d} value={d}>Last {d} days</option>)}
        </select>
      </div>
      {isLoading ? <Loading /> : error ? <ErrorBox error={error} /> : (
        <>
          <Grid>
            <Kpi icon="💰" label="MRR" value={<Money value={data.revenue.mrr} />} sub={<>ARR <Money value={data.revenue.arr} /></>} tone="success" />
            <Kpi icon="🧾" label="Collected" value={<Money value={data.revenue.collected} />} sub={<>Refunded <Money value={data.revenue.refunded} /></>} />
            <Kpi icon="📈" label="Net revenue" value={<Money value={data.revenue.net} />} tone="info" />
            <Kpi icon="📉" label="Churn rate" value={pct(data.subscriptions.churn_rate_percent)} sub={`${data.subscriptions.cancelled_in_period} cancelled`} tone="warning" />
            <Kpi icon="📦" label="Active subscriptions" value={data.subscriptions.active} sub={`${data.subscriptions.paused} paused · ${data.subscriptions.past_due} past due`} tone="secondary" />
            <Kpi icon="⚠️" label="Failed payments" value={data.payments.failed_count} sub={<><Money value={data.payments.failed_amount} /> at risk</>} tone={data.payments.failed_count ? "error" : "success"} />
            <Kpi icon="♻️" label="Recovered" value={data.payments.recovered_count} sub={<Money value={data.payments.recovered_amount} />} tone="success" />
            <Kpi icon="🎫" label="Open tickets" value={data.tickets.open} sub={`${data.tickets.unassigned} unassigned · ${data.tickets.escalated} escalated`} tone="warning" />
          </Grid>
          <div className="grid lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <Card title="Revenue by month">
                {data.revenue.by_month.length === 0 ? <Empty /> : data.revenue.by_month.map((m) => (
                  <div key={m.month} className="flex items-center gap-3 text-sm">
                    <span className="w-20 shrink-0 text-base-content/60">{m.month}</span>
                    <progress className="progress progress-primary flex-1" value={Number(m.revenue)} max={max} />
                    <span className="w-24 text-right font-medium"><Money value={m.revenue} /></span>
                  </div>
                ))}
              </Card>
            </div>
            <Card title="SLA performance">
              <div className="flex justify-around"><Gauge label="First response met" value={data.sla.first_response_met_percent} /><Gauge label="Resolution met" value={data.sla.resolution_met_percent} /></div>
              <div className="text-sm text-center mt-2">Open tickets in breach: <b className={data.sla.breached_open_tickets ? "text-error" : "text-success"}>{data.sla.breached_open_tickets}</b></div>
            </Card>
          </div>
        </>
      )}
      <div className="grid lg:grid-cols-2 gap-4 mt-4"><OrgSnapshot /><ProfileSummary /></div>
    </>
  );
}

function AgentDashboard() {
  const { data, isLoading, error } = useQuery({ queryKey: ["dash", "agent"], queryFn: () => dashboardApi.agent(30) });
  if (isLoading) return <Loading />;
  if (error) return <ErrorBox error={error} />;
  return (
    <>
      <Welcome actions={[["/tickets", "Open ticket queue"], ["/customers", "Find a customer"], ["/notifications", "Notifications"], ["/profile", "My profile"]]} />
      {data.overdue > 0 && <div role="alert" className="alert alert-error mb-4"><span>🔥 You have {data.overdue} overdue ticket(s). Please prioritise them.</span></div>}
      <Grid>
        <Kpi icon="📂" label="Open tickets" value={data.open_tickets} />
        <Kpi icon="⏳" label="Waiting on customer" value={data.waiting_customer} tone="info" />
        <Kpi icon="🚨" label="Escalated" value={data.escalated} tone="warning" />
        <Kpi icon="✅" label="Resolved (30 days)" value={data.resolved_in_period} tone="success" />
      </Grid>
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Card title="Needs your attention">
            {data.needs_attention.length === 0 ? <Empty text="You're all caught up 🎉" /> : data.needs_attention.map((t) => (
              <Row key={t.id} left={<Link to={`/tickets/${t.id}`} className="link link-hover">#{t.id} {t.subject}</Link>} right={<><StatusBadge value={t.priority} /><StatusBadge value={t.status} /></>} />
            ))}
          </Card>
        </div>
        <Card title="My SLA performance">
          <div className="flex justify-around"><Gauge label="First response met" value={data.sla.first_response_met_percent} /><Gauge label="Resolution met" value={data.sla.resolution_met_percent} /></div>
        </Card>
      </div>
      <div className="mt-4"><ProfileSummary /></div>
    </>
  );
}

function CustomerDashboard() {
  const { data, isLoading, error } = useQuery({ queryKey: ["dash", "customer"], queryFn: dashboardApi.customer });
  if (isLoading) return <Loading />;
  if (error) return <ErrorBox error={error} />;
  const sub = data.subscription;
  return (
    <>
      <Welcome actions={[["/plans", "Browse plans"], ["/subscriptions", "My subscription"], ["/invoices", "My invoices"], ["/tickets/new", "Get support"], ["/profile", "My profile"]]} />
      {data.has_failed_payment && <div role="alert" className="alert alert-error mb-4"><span>⚠️ A recent payment failed. Please review your invoices.</span><Link to="/invoices" className="btn btn-sm">View invoices</Link></div>}
      <Grid>
        <Kpi icon="📦" label="Current plan" value={sub ? sub.plan_name : "No plan"} sub={sub ? <><StatusBadge value={sub.status} /> · renews {formatDate(sub.next_billing_date || sub.current_period_end)}</> : <Link className="link" to="/plans">Choose a plan</Link>} />
        <Kpi icon="💳" label="Amount due" value={<Money value={data.amount_due} />} sub={`${data.unpaid_invoice_count} unpaid invoice(s)`} tone={data.unpaid_invoice_count ? "warning" : "success"} />
        <Kpi icon="🎫" label="Open tickets" value={data.open_tickets} tone="info" />
        <Kpi icon="🔔" label="Unread notifications" value={data.unread_notifications} tone="secondary" />
      </Grid>
      <div className="grid lg:grid-cols-3 gap-4">
        <Card title="Recent invoices" actions={<Link to="/invoices" className="link text-xs">View all</Link>}>
          {data.recent_invoices.length === 0 ? <Empty /> : data.recent_invoices.map((i) => <Row key={i.id} left={<Link className="link link-hover" to={`/invoices/${i.id}`}>{i.invoice_number} · {formatDate(i.issued_at)}</Link>} right={<><Money value={i.total} /><StatusBadge value={i.status} /></>} />)}
        </Card>
        <Card title="Recent payments" actions={<Link to="/payments" className="link text-xs">View all</Link>}>
          {data.recent_payments.length === 0 ? <Empty /> : data.recent_payments.map((p) => <Row key={p.id} left={formatDate(p.created_at)} right={<><Money value={p.amount} /><StatusBadge value={p.status} /></>} />)}
        </Card>
        <Card title="Recent tickets" actions={<Link to="/tickets/new" className="btn btn-xs btn-primary">New</Link>}>
          {data.recent_tickets.length === 0 ? <Empty /> : data.recent_tickets.map((t) => <Row key={t.id} left={<Link to={`/tickets/${t.id}`} className="link link-hover">{t.subject}</Link>} right={<StatusBadge value={t.status} />} />)}
        </Card>
      </div>
      <div className="mt-4"><ProfileSummary /></div>
    </>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  return { [ROLE.SUPER_ADMIN]: <PlatformDashboard />, [ROLE.ORG_ADMIN]: <AdminDashboard />, [ROLE.AGENT]: <AgentDashboard />, [ROLE.CUSTOMER]: <CustomerDashboard /> }[user.role];
}
