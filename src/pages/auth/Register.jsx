import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { authApi, orgApi } from "../../api";
import { useAuth } from "../../context/AuthContext";
import AuthShell from "../../components/AuthShell";
import { errorMessage } from "../../utils/format";

function strength(p) {
  let n = 0;
  if (p.length >= 8) n++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) n++;
  if (/\d/.test(p)) n++;
  if (/[^A-Za-z0-9]/.test(p)) n++;
  return n;
}
const LEVELS = [["Too weak", "progress-error"], ["Weak", "progress-error"], ["Fair", "progress-warning"], ["Good", "progress-info"], ["Strong", "progress-success"]];

const Input = ({ icon, ...props }) => (
  <label className="input input-bordered flex items-center gap-2 w-full">
    <span>{icon}</span>
    <input className="grow" {...props} />
  </label>
);

export default function Register() {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [kind, setKind] = useState("customer"); // "customer" | "organization"
  const [f, setF] = useState({ full_name: "", email: "", password: "", confirm: "", organization_id: "", organization_name: "" });
  const [show, setShow] = useState(false);
  const [terms, setTerms] = useState(false);
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const orgs = useQuery({ queryKey: ["public-orgs"], queryFn: orgApi.publicList, enabled: kind === "customer" });

  if (user) return <Navigate to="/dashboard" replace />;

  const score = strength(f.password);
  const match = f.confirm.length > 0 && f.password === f.confirm;
  const valid = f.password.length >= 8 && f.password.length <= 72 && f.password === f.confirm && terms &&
    (kind === "customer" ? !!f.organization_id : f.organization_name.trim().length >= 2);

  const submit = async (e) => {
    e.preventDefault();
    if (!valid) return;
    setBusy(true);
    try {
      if (kind === "customer") {
        await authApi.register({ full_name: f.full_name, email: f.email, password: f.password, organization_id: Number(f.organization_id) });
      } else {
        await authApi.registerOrganization({
          organization_name: f.organization_name, admin_full_name: f.full_name,
          admin_email: f.email, admin_password: f.password,
        });
      }
      await login(f.email, f.password); // sign in right away
      toast.success(kind === "customer" ? "Welcome! Your account is ready." : "Your organization is ready. Next, create your plans.");
      navigate("/dashboard");
    } catch (err) {
      toast.error(errorMessage(err));
      setShake(true);
      setTimeout(() => setShake(false), 450);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Create your account" subtitle="Choose how you want to use SubFlow" shake={shake}>
      <div role="tablist" className="tabs tabs-box grid grid-cols-2">
        <button type="button" role="tab" className={`tab ${kind === "customer" ? "tab-active" : ""}`} onClick={() => setKind("customer")}>👤 I'm a customer</button>
        <button type="button" role="tab" className={`tab ${kind === "organization" ? "tab-active" : ""}`} onClick={() => setKind("organization")}>🏢 I'm an organization</button>
      </div>
      <p className="text-xs text-base-content/60">
        {kind === "customer" ? "Join an organization to manage your subscription, invoices and support tickets." : "Create your organization and its admin account to sell plans and run support."}
      </p>

      <form onSubmit={submit} className="space-y-3">
        {kind === "organization" && (
          <Input icon="🏢" placeholder="Organization name" required minLength={2} value={f.organization_name} onChange={set("organization_name")} />
        )}
        <Input icon="👤" placeholder={kind === "organization" ? "Your full name (admin)" : "Full name"} required autoFocus value={f.full_name} onChange={set("full_name")} />
        <Input icon="✉️" type="email" placeholder="Email address" required value={f.email} onChange={set("email")} />

        {kind === "customer" && (
          <>
            <label className="select select-bordered flex items-center gap-2 w-full">
              <span>🏢</span>
              <select className="grow" required value={f.organization_id} onChange={set("organization_id")}>
                <option value="">{orgs.isLoading ? "Loading organizations…" : "Select your organization"}</option>
                {(orgs.data || []).map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </label>
            {orgs.data && orgs.data.length === 0 && <div className="text-xs text-warning">No organizations are available yet. Ask your provider to sign up first.</div>}
          </>
        )}

        <label className="input input-bordered flex items-center gap-2 w-full"><span>🔒</span>
          <input type={show ? "text" : "password"} className="grow" placeholder="Password (8–72 characters)" required minLength={8} maxLength={72} value={f.password} onChange={set("password")} />
          <button type="button" className="btn btn-ghost btn-xs" onClick={() => setShow(!show)}>{show ? "Hide" : "Show"}</button></label>
        {f.password && (
          <div>
            <progress className={`progress w-full ${LEVELS[score][1]}`} value={score} max="4" />
            <div className="text-xs text-base-content/60">Strength: {LEVELS[score][0]}</div>
          </div>
        )}
        <label className={`input input-bordered flex items-center gap-2 w-full ${f.confirm && !match ? "input-error" : match ? "input-success" : ""}`}><span>🔁</span>
          <input type={show ? "text" : "password"} className="grow" placeholder="Confirm password" required value={f.confirm} onChange={set("confirm")} />
          {f.confirm && <span>{match ? "✅" : "❌"}</span>}</label>

        <label className="label cursor-pointer justify-start gap-2"><input type="checkbox" className="checkbox checkbox-sm" checked={terms} onChange={(e) => setTerms(e.target.checked)} /><span className="label-text">I agree to the terms and privacy policy</span></label>
        <button className="btn btn-primary w-full" disabled={busy || !valid}>{busy && <span className="loading loading-spinner loading-sm" />} {kind === "customer" ? "Create account" : "Create organization"}</button>
      </form>
      <div className="flex justify-between text-sm mt-1">
        <span>Have an account? <Link to="/login" className="link link-primary">Sign in</Link></span>
        <Link to="/" className="link link-hover">← Home</Link>
      </div>
    </AuthShell>
  );
}
