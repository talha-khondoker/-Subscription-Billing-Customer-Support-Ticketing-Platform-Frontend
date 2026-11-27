import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { authApi, customerApi, orgApi } from "../../api";
import { useAuth } from "../../context/AuthContext";
import { ROLE, ROLE_LABEL } from "../../constants/enums";
import { Card, ErrorBox, Field, Loading, PageHeader, StatusBadge } from "../../components/ui";
import { errorMessage, formatDate } from "../../utils/format";

function Avatar({ name }) {
  const initials = (name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return <div className="avatar placeholder"><div className="bg-primary text-primary-content rounded-full w-16"><span className="text-xl">{initials}</span></div></div>;
}

function AccountCard() {
  const { user, refreshUser } = useAuth();
  const qc = useQueryClient();
  const isCustomer = user.role === ROLE.CUSTOMER;
  const profile = useQuery({ queryKey: ["customer-me"], queryFn: customerApi.me, enabled: isCustomer });
  const [f, setF] = useState({ full_name: user.full_name, phone: "", company_name: "" });
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (profile.data) setF((x) => ({ ...x, full_name: profile.data.full_name, phone: profile.data.phone || "", company_name: profile.data.company_name || "" }));
  }, [profile.data]);

  const save = useMutation({
    mutationFn: () => (isCustomer
      ? customerApi.updateMe({ full_name: f.full_name, phone: f.phone || null, company_name: f.company_name || null })
      : authApi.updateMe({ full_name: f.full_name })),
    onSuccess: async () => { await refreshUser(); qc.invalidateQueries(); setEditing(false); toast.success("Profile updated"); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  if (isCustomer && profile.isLoading) return <Loading />;
  if (profile.error) return <ErrorBox error={profile.error} />;

  const row = (label, value) => (
    <div><div className="text-xs uppercase text-base-content/60">{label}</div><div className="font-medium break-words">{value || "—"}</div></div>
  );

  return (
    <Card title="My account" actions={!editing && <button className="btn btn-sm btn-primary" onClick={() => setEditing(true)}>Edit</button>}>
      <div className="flex items-center gap-4 mb-2">
        <Avatar name={user.full_name} />
        <div>
          <div className="text-xl font-bold">{user.full_name}</div>
          <span className="badge badge-primary badge-sm">{ROLE_LABEL[user.role]}</span>
        </div>
      </div>
      {!editing ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {row("Email", user.email)}
          {row("Status", user.is_active ? "Active" : "Disabled")}
          {isCustomer && row("Phone", profile.data?.phone)}
          {isCustomer && row("Company", profile.data?.company_name)}
          {isCustomer && row("Member since", formatDate(profile.data?.created_at))}
        </div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
          <Field label="Full name"><input className="input input-bordered w-full" required value={f.full_name} onChange={set("full_name")} /></Field>
          <Field label="Email (cannot be changed)"><input className="input input-bordered w-full" disabled value={user.email} /></Field>
          {isCustomer && (
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Phone"><input className="input input-bordered w-full" maxLength={30} value={f.phone} onChange={set("phone")} /></Field>
              <Field label="Company"><input className="input input-bordered w-full" maxLength={150} value={f.company_name} onChange={set("company_name")} /></Field>
            </div>
          )}
          <div className="flex gap-2 justify-end">
            <button type="button" className="btn" onClick={() => setEditing(false)}>Cancel</button>
            <button className="btn btn-primary" disabled={save.isPending}>Save changes</button>
          </div>
        </form>
      )}
    </Card>
  );
}

function OrganizationCard() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const isAdmin = user.role === ROLE.ORG_ADMIN;
  const org = useQuery({ queryKey: ["org-me"], queryFn: orgApi.me });
  const [name, setName] = useState("");
  const [editing, setEditing] = useState(false);
  useEffect(() => { if (org.data) setName(org.data.name); }, [org.data]);
  const save = useMutation({
    mutationFn: () => orgApi.updateMine({ name }),
    onSuccess: () => { qc.invalidateQueries(); setEditing(false); toast.success("Organization updated"); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  if (org.isLoading) return <Loading />;
  if (org.error) return <ErrorBox error={org.error} />;
  return (
    <Card title="Organization" actions={isAdmin && !editing && <button className="btn btn-sm btn-primary" onClick={() => setEditing(true)}>Edit</button>}>
      {!editing ? (
        <div className="grid sm:grid-cols-3 gap-4">
          <div><div className="text-xs uppercase text-base-content/60">Name</div><div className="font-medium">{org.data.name}</div></div>
          <div><div className="text-xs uppercase text-base-content/60">Status</div><StatusBadge value={org.data.status} /></div>
          <div><div className="text-xs uppercase text-base-content/60">Organization ID</div><div className="font-medium">#{org.data.id}</div></div>
        </div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
          <Field label="Organization name"><input className="input input-bordered w-full" required minLength={2} maxLength={150} value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <div className="flex gap-2 justify-end">
            <button type="button" className="btn" onClick={() => { setName(org.data.name); setEditing(false); }}>Cancel</button>
            <button className="btn btn-primary" disabled={save.isPending}>Save</button>
          </div>
        </form>
      )}
    </Card>
  );
}

function PasswordCard() {
  const [f, setF] = useState({ current_password: "", new_password: "", confirm: "" });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const change = useMutation({
    mutationFn: () => authApi.changePassword({ current_password: f.current_password, new_password: f.new_password }),
    onSuccess: () => { toast.success("Password changed"); setF({ current_password: "", new_password: "", confirm: "" }); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const ok = f.new_password.length >= 8 && f.new_password === f.confirm;
  return (
    <Card title="Change password">
      <form onSubmit={(e) => { e.preventDefault(); if (ok) change.mutate(); }} className="max-w-md">
        <Field label="Current password"><input type="password" className="input input-bordered w-full" required value={f.current_password} onChange={set("current_password")} /></Field>
        <Field label="New password (8–72 characters)"><input type="password" className="input input-bordered w-full" required minLength={8} maxLength={72} value={f.new_password} onChange={set("new_password")} /></Field>
        <Field label="Confirm new password">
          <input type="password" className={`input input-bordered w-full ${f.confirm && !ok ? "input-error" : ""}`} required value={f.confirm} onChange={set("confirm")} />
        </Field>
        <button className="btn btn-primary" disabled={!ok || change.isPending}>Update password</button>
      </form>
    </Card>
  );
}

export default function Profile() {
  const { user } = useAuth();
  return (
    <>
      <PageHeader title="My profile" />
      <div className="grid lg:grid-cols-2 gap-4">
        <AccountCard />
        <div className="space-y-4">
          {user.role !== ROLE.SUPER_ADMIN && <OrganizationCard />}
          <PasswordCard />
        </div>
      </div>
    </>
  );
}
