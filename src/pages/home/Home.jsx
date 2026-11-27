import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { SiteFooter, SiteNavbar } from "../../components/SiteChrome";

/* ---------- hooks ---------- */
function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.classList.add("in"); io.disconnect(); } }, { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}
const Reveal = ({ children, className = "", delay = 0 }) => {
  const ref = useReveal();
  return <div ref={ref} style={{ transitionDelay: `${delay}ms` }} className={`reveal ${className}`}>{children}</div>;
};

function useCountUp(target, duration = 1600) {
  const ref = useRef(null);
  const [val, setVal] = useState(0);
  useEffect(() => {
    const el = ref.current;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const tick = (t) => {
        const p = Math.min(1, (t - t0) / duration);
        setVal(Math.round(target * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [target, duration]);
  return [ref, val];
}

/* ---------- hero ---------- */
const WORDS = ["subscriptions", "invoices", "payments", "support tickets"];

function HeroMock() {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [mrrRef, mrr] = useCountUp(48250);
  const bars = [35, 52, 44, 68, 60, 82, 96];
  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    setTilt({ x: ((e.clientX - r.left) / r.width - 0.5) * 12, y: ((e.clientY - r.top) / r.height - 0.5) * -12 });
  };
  return (
    <div onMouseMove={onMove} onMouseLeave={() => setTilt({ x: 0, y: 0 })} className="[perspective:1000px] animate-floaty">
      <div className="card bg-base-100 shadow-2xl border border-base-200 transition-transform duration-200"
        style={{ transform: `rotateY(${tilt.x}deg) rotateX(${tilt.y}deg)` }}>
        <div className="card-body gap-4">
          <div className="flex items-center justify-between">
            <div><div className="text-xs text-base-content/60">Monthly recurring revenue</div>
              <div ref={mrrRef} className="text-3xl font-extrabold">${mrr.toLocaleString()}</div></div>
            <span className="badge badge-success gap-1">▲ 12.4%</span>
          </div>
          <div className="flex items-end gap-2 h-24">
            {bars.map((h, i) => (
              <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-primary to-secondary hover:opacity-80 transition-all" style={{ height: `${h}%` }} />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-box bg-base-200 p-2"><div className="font-bold text-lg">1,284</div>Active</div>
            <div className="rounded-box bg-base-200 p-2"><div className="font-bold text-lg text-warning">23</div>Past due</div>
            <div className="rounded-box bg-base-200 p-2"><div className="font-bold text-lg text-success">98%</div>SLA met</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Hero() {
  const { user } = useAuth();
  const [i, setI] = useState(0);
  useEffect(() => { const t = setInterval(() => setI((x) => (x + 1) % WORDS.length), 2200); return () => clearInterval(t); }, []);
  return (
    <section id="top" className="relative overflow-hidden pt-32 pb-24">
      <div className="absolute -top-20 -left-20 size-96 rounded-full bg-primary/30 blur-3xl animate-blob" />
      <div className="absolute top-40 -right-24 size-96 rounded-full bg-secondary/30 blur-3xl animate-blob [animation-delay:-5s]" />
      <div className="absolute bottom-0 left-1/3 size-72 rounded-full bg-accent/20 blur-3xl animate-blob [animation-delay:-9s]" />
      <div className="relative max-w-7xl mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <span className="badge badge-outline badge-primary mb-4">Multi-tenant billing + support platform</span>
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
            Run your <br />
            <span key={i} className="grad-text inline-block animate-wordin">{WORDS[i]}</span><br />
            on autopilot.
          </h1>
          <p className="mt-6 text-lg text-base-content/70 max-w-xl">
            SubFlow handles plans, proration, renewals, failed-payment retries and SLA-driven support, so your team can focus on growth instead of spreadsheets.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to={user ? "/dashboard" : "/register"} className="btn btn-primary btn-lg">{user ? "Open dashboard" : "Start free"} →</Link>
            <a href="#demo" className="btn btn-outline btn-lg">▶ Try the live demo</a>
          </div>
          <div className="mt-8 flex items-center gap-3 text-sm text-base-content/60">
            <div className="avatar-group -space-x-3">
              {["A", "B", "C", "D"].map((c) => <div key={c} className="avatar placeholder"><div className="bg-neutral text-neutral-content w-8"><span className="text-xs">{c}</span></div></div>)}
            </div>
            Trusted by growing SaaS teams
          </div>
        </div>
        <HeroMock />
      </div>
    </section>
  );
}

/* ---------- stats ---------- */
function Stat({ target, suffix = "", label }) {
  const [ref, v] = useCountUp(target);
  return <div ref={ref} className="text-center"><div className="text-4xl md:text-5xl font-extrabold grad-text">{v.toLocaleString()}{suffix}</div><div className="text-base-content/60 mt-1">{label}</div></div>;
}
const Stats = () => (
  <section className="py-12 bg-base-200/60">
    <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
      <Stat target={12000} suffix="+" label="Subscriptions managed" />
      <Stat target={99} suffix="%" label="Billing accuracy" />
      <Stat target={78} suffix="%" label="Failed payments recovered" />
      <Stat target={24} suffix="/7" label="Automated jobs" />
    </div>
  </section>
);

/* ---------- features ---------- */
const FEATURES = [
  ["💳", "Flexible plans", "Monthly or yearly plans with tax, activation toggles and instant plan changes."],
  ["⚖️", "Smart proration", "Upgrade or downgrade mid-cycle and customers are charged or credited fairly."],
  ["🔁", "Automatic retries", "Failed payments follow a retry schedule, so revenue is recovered without manual chasing."],
  ["🎫", "SLA-driven support", "Priority-based first-response and resolution timers with breach alerts and escalation."],
  ["🏢", "True multi-tenancy", "Every organization is isolated, with its own plans, customers, agents and audit trail."],
  ["📜", "Full audit trail", "Every change is logged with who, what and when, with old and new values."],
];
const Features = () => (
  <section id="features" className="py-24 max-w-7xl mx-auto px-4">
    <Reveal className="text-center max-w-2xl mx-auto mb-14">
      <h2 className="text-3xl md:text-4xl font-extrabold">Everything billing and support, <span className="grad-text">in one place</span></h2>
      <p className="mt-3 text-base-content/70">Built around the real lifecycle of a subscription business.</p>
    </Reveal>
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {FEATURES.map(([icon, t, d], i) => (
        <Reveal key={t} delay={i * 70}>
          <div className="card bg-base-100 border border-base-200 h-full transition hover:-translate-y-2 hover:shadow-xl hover:border-primary/40">
            <div className="card-body">
              <div className="text-4xl">{icon}</div>
              <h3 className="card-title">{t}</h3>
              <p className="text-base-content/70">{d}</p>
            </div>
          </div>
        </Reveal>
      ))}
    </div>
  </section>
);

/* ---------- interactive lifecycle demo ---------- */
const STEPS = {
  idle: { label: "Not subscribed", badge: "badge-ghost", note: "Pick a plan to begin." },
  active: { label: "Active", badge: "badge-success", note: "Customer is subscribed and billed on schedule." },
  past_due: { label: "Past due", badge: "badge-error", note: "Payment failed. Retry schedule started and the customer was notified." },
  paused: { label: "Paused", badge: "badge-warning", note: "Billing is paused until the customer resumes." },
  cancelled: { label: "Cancelled", badge: "badge-neutral", note: "Subscription ended." },
};
function Demo() {
  const [status, setStatus] = useState("idle");
  const [plan, setPlan] = useState("Starter");
  const [log, setLog] = useState([]);
  const go = (next, msg) => { setStatus(next); setLog((l) => [{ t: new Date().toLocaleTimeString(), msg }, ...l].slice(0, 6)); };
  const s = STEPS[status];
  const btn = (label, onClick, enabled, cls = "btn-outline") => (
    <button className={`btn btn-sm ${cls}`} disabled={!enabled} onClick={onClick}>{label}</button>
  );
  return (
    <section id="demo" className="py-24 bg-base-200/60">
      <div className="max-w-5xl mx-auto px-4">
        <Reveal className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-extrabold">Try the <span className="grad-text">subscription lifecycle</span></h2>
          <p className="mt-3 text-base-content/70">Click through what SubFlow automates behind the scenes.</p>
        </Reveal>
        <Reveal>
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body grid md:grid-cols-2 gap-8">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-lg font-semibold">{plan} plan</span>
                  <span className={`badge ${s.badge}`}>{s.label}</span>
                </div>
                <p className="text-sm text-base-content/70 min-h-10">{s.note}</p>
                <progress className={`progress w-full my-4 ${status === "past_due" ? "progress-error" : "progress-primary"}`}
                  value={{ idle: 0, active: 60, past_due: 85, paused: 40, cancelled: 100 }[status]} max="100" />
                <div className="flex flex-wrap gap-2">
                  {btn("Subscribe", () => go("active", `Subscribed to ${plan}; first invoice paid`), status === "idle" || status === "cancelled", "btn-primary")}
                  {btn("Upgrade to Pro", () => { setPlan("Pro"); go("active", "Upgraded to Pro; prorated credit applied"); }, status === "active" && plan !== "Pro")}
                  {btn("Payment fails", () => go("past_due", "Renewal payment failed; retry #1 scheduled in 1 day"), status === "active", "btn-error btn-outline")}
                  {btn("Retry succeeds", () => go("active", "Retry succeeded; subscription recovered"), status === "past_due", "btn-success")}
                  {btn("Pause", () => go("paused", "Subscription paused by customer"), status === "active")}
                  {btn("Resume", () => go("active", "Subscription resumed"), status === "paused")}
                  {btn("Cancel", () => go("cancelled", "Subscription cancelled"), ["active", "paused", "past_due"].includes(status), "btn-ghost")}
                  {btn("Reset", () => { setStatus("idle"); setPlan("Starter"); setLog([]); }, true, "btn-ghost")}
                </div>
              </div>
              <div>
                <div className="text-sm font-semibold mb-2">Event log</div>
                {log.length === 0 ? <div className="text-sm text-base-content/50">Events appear here as you click.</div> : (
                  <ul className="timeline timeline-vertical timeline-compact timeline-snap-icon">
                    {log.map((e, i) => (
                      <li key={e.t + i}><div className="timeline-middle text-primary">●</div>
                        <div className="timeline-end timeline-box text-xs">{e.msg}<div className="opacity-50">{e.t}</div></div><hr /></li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- roles ---------- */
const ROLES = {
  "Platform owner": { icon: "🛰️", points: ["Create and manage organizations", "Platform-wide MRR, ARR and health metrics", "Global audit visibility"] },
  "Org admin": { icon: "🧭", points: ["Design plans, tax and billing periods", "Track MRR, churn and revenue by month", "Manage agents, SLA policies and customers"] },
  "Support agent": { icon: "🎧", points: ["Prioritised queue with live SLA timers", "Billing context next to every ticket", "Internal notes, escalation and one-click resolve"] },
  Customer: { icon: "🙋", points: ["Self-serve plan changes, pause and cancel", "Clear invoices and payment history", "Open tickets and follow replies in one thread"] },
};
function Roles() {
  const keys = Object.keys(ROLES);
  const [tab, setTab] = useState(keys[1]);
  const r = ROLES[tab];
  return (
    <section id="roles" className="py-24 max-w-5xl mx-auto px-4">
      <Reveal className="text-center mb-10">
        <h2 className="text-3xl md:text-4xl font-extrabold">One platform, <span className="grad-text">four experiences</span></h2>
      </Reveal>
      <Reveal>
        <div role="tablist" className="tabs tabs-box justify-center flex-wrap">
          {keys.map((k) => <button key={k} role="tab" className={`tab ${tab === k ? "tab-active" : ""}`} onClick={() => setTab(k)}>{k}</button>)}
        </div>
        <div key={tab} className="card bg-base-100 border border-base-200 mt-6 animate-wordin">
          <div className="card-body md:flex-row items-center gap-8">
            <div className="text-8xl">{r.icon}</div>
            <ul className="space-y-3 text-lg">
              {r.points.map((p) => <li key={p} className="flex gap-3"><span className="text-success">✔</span>{p}</li>)}
            </ul>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ---------- pricing ---------- */
const PLANS = [
  { name: "Starter", monthly: 29, desc: "For early-stage teams", feats: ["Up to 100 customers", "2 support agents", "Email notifications"] },
  { name: "Pro", monthly: 79, desc: "For growing businesses", feats: ["Up to 2,000 customers", "10 support agents", "SLA policies and escalation", "Audit logs"], hot: true },
  { name: "Enterprise", monthly: 199, desc: "For large organizations", feats: ["Unlimited customers", "Unlimited agents", "Priority support", "Custom retry schedules"] },
];
function Pricing() {
  const [yearly, setYearly] = useState(false);
  return (
    <section id="pricing" className="py-24 bg-base-200/60">
      <div className="max-w-6xl mx-auto px-4">
        <Reveal className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-extrabold">Simple, <span className="grad-text">transparent pricing</span></h2>
          <label className="mt-6 inline-flex items-center gap-3 cursor-pointer">
            <span className={yearly ? "opacity-50" : "font-semibold"}>Monthly</span>
            <input type="checkbox" className="toggle toggle-primary" checked={yearly} onChange={(e) => setYearly(e.target.checked)} />
            <span className={yearly ? "font-semibold" : "opacity-50"}>Yearly</span>
            <span className="badge badge-success badge-sm">Save 20%</span>
          </label>
        </Reveal>
        <div className="grid md:grid-cols-3 gap-6 items-stretch">
          {PLANS.map((p, i) => {
            const price = yearly ? Math.round(p.monthly * 0.8) : p.monthly;
            return (
              <Reveal key={p.name} delay={i * 100}>
                <div className={`card bg-base-100 h-full transition hover:-translate-y-2 hover:shadow-2xl ${p.hot ? "border-2 border-primary shadow-xl" : "border border-base-200"}`}>
                  <div className="card-body">
                    {p.hot && <span className="badge badge-primary self-start">Most popular</span>}
                    <h3 className="card-title">{p.name}</h3>
                    <p className="text-sm text-base-content/60">{p.desc}</p>
                    <div className="my-3"><span className="text-5xl font-extrabold">${price}</span><span className="text-base-content/60"> / mo{yearly ? ", billed yearly" : ""}</span></div>
                    <ul className="space-y-2 flex-1">{p.feats.map((f) => <li key={f} className="flex gap-2 text-sm"><span className="text-success">✔</span>{f}</li>)}</ul>
                    <Link to="/register" className={`btn mt-4 ${p.hot ? "btn-primary" : "btn-outline"}`}>Get started</Link>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
        <p className="text-center text-xs text-base-content/50 mt-6">Sample pricing for illustration.</p>
      </div>
    </section>
  );
}

/* ---------- FAQ ---------- */
const FAQS = [
  ["What happens when a payment fails?", "SubFlow marks the subscription past due, notifies the customer and retries on a schedule. If a retry succeeds, the subscription returns to active automatically."],
  ["How does proration work?", "When a customer changes plans mid-cycle, the unused portion of the old plan is credited and the new plan is charged for the remaining time."],
  ["Is my organization's data isolated?", "Yes. Every record is scoped to an organization, and all queries are filtered by tenant on the server."],
  ["Can customers manage their own subscription?", "Yes. Customers can subscribe, change plan, pause, resume and cancel from their own portal."],
  ["How are support SLAs enforced?", "Each priority level has first-response and resolution targets. Live timers show time remaining, and breaches are flagged and can be escalated."],
];
const Faq = () => (
  <section id="faq" className="py-24 max-w-3xl mx-auto px-4">
    <Reveal className="text-center mb-10"><h2 className="text-3xl md:text-4xl font-extrabold">Frequently asked <span className="grad-text">questions</span></h2></Reveal>
    <Reveal className="space-y-3">
      {FAQS.map(([q, a], i) => (
        <div key={q} className="collapse collapse-plus bg-base-100 border border-base-200">
          <input type="radio" name="faq" defaultChecked={i === 0} />
          <div className="collapse-title font-semibold">{q}</div>
          <div className="collapse-content text-base-content/70">{a}</div>
        </div>
      ))}
    </Reveal>
  </section>
);

/* ---------- CTA + footer ---------- */
const Cta = () => (
  <section className="px-4 pb-24">
    <Reveal>
      <div className="max-w-5xl mx-auto rounded-box bg-gradient-to-r from-primary via-secondary to-accent p-10 md:p-16 text-center text-primary-content relative overflow-hidden">
        <div className="absolute -top-10 -right-10 size-52 rounded-full bg-white/20 blur-2xl animate-blob" />
        <h2 className="text-3xl md:text-5xl font-extrabold relative">Ready to put billing on autopilot?</h2>
        <p className="mt-4 opacity-90 relative">Create your account and launch your first plan in minutes.</p>
        <div className="mt-8 flex justify-center gap-3 flex-wrap relative">
          <Link to="/register" className="btn btn-lg bg-white text-primary border-0 hover:scale-105 transition">Get started free</Link>
          <Link to="/login" className="btn btn-lg btn-outline text-white border-white hover:bg-white/20">Log in</Link>
        </div>
      </div>
    </Reveal>
  </section>
);

export default function Home() {
  return (
    <div className="bg-base-100">
      <SiteNavbar />
      <main>
        <Hero />
        <Stats />
        <Features />
        <Demo />
        <Roles />
        <Pricing />
        <Faq />
        <Cta />
      </main>
      <SiteFooter />
    </div>
  );
}
