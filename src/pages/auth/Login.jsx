import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import AuthShell from "../../components/AuthShell";
import { errorMessage } from "../../utils/format";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState(localStorage.getItem("subflow_email") || "");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(!!localStorage.getItem("subflow_email"));
  const [show, setShow] = useState(false);
  const [caps, setCaps] = useState(false);
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(email, password);
      remember ? localStorage.setItem("subflow_email", email) : localStorage.removeItem("subflow_email");
      toast.success("Welcome back!");
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
    <AuthShell title="Welcome back" subtitle="Sign in to continue to your workspace" shake={shake}>
      <form onSubmit={submit} className="space-y-3">
        <label className="input input-bordered flex items-center gap-2 w-full">
          <span>✉️</span>
          <input type="email" className="grow" placeholder="Email address" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="input input-bordered flex items-center gap-2 w-full">
          <span>🔒</span>
          <input type={show ? "text" : "password"} className="grow" placeholder="Password" required value={password}
            onChange={(e) => setPassword(e.target.value)} onKeyUp={(e) => setCaps(e.getModifierState("CapsLock"))} />
          <button type="button" className="btn btn-ghost btn-xs" onClick={() => setShow(!show)}>{show ? "Hide" : "Show"}</button>
        </label>
        {caps && <div className="text-warning text-xs">⚠️ Caps Lock is on</div>}
        <div className="flex items-center justify-between">
          <label className="label cursor-pointer gap-2"><input type="checkbox" className="checkbox checkbox-sm" checked={remember} onChange={(e) => setRemember(e.target.checked)} /><span className="label-text">Remember my email</span></label>
          <Link to="/" className="link link-hover text-sm">← Back to home</Link>
        </div>
        <button className="btn btn-primary w-full" disabled={busy}>{busy && <span className="loading loading-spinner loading-sm" />} Sign in</button>
      </form>
      <div className="divider my-1 text-xs">New here?</div>
      <Link to="/register" className="btn btn-outline w-full">Create a customer account</Link>
    </AuthShell>
  );
}
