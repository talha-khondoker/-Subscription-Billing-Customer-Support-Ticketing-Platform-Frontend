import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { userApi } from "../../api";
import { Card, Empty, ErrorBox, Field, Loading, Modal, PageHeader, StatusBadge } from "../../components/ui";
import { errorMessage } from "../../utils/format";

const EMPTY = { full_name: "", email: "", password: "" };

export default function Agents() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ["agents"], queryFn: userApi.agents });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const create = useMutation({
    mutationFn: () => userApi.createAgent(form),
    onSuccess: () => { toast.success("Agent created"); setOpen(false); setForm(EMPTY); qc.invalidateQueries({ queryKey: ["agents"] }); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const toggle = useMutation({
    mutationFn: (a) => userApi.update(a.id, { is_active: !a.is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agents"] }),
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <>
      <PageHeader title="Agents"><button className="btn btn-primary btn-sm" onClick={() => setOpen(true)}>New agent</button></PageHeader>
      {isLoading ? <Loading /> : error ? <ErrorBox error={error} /> : (
        <Card>
          {data.length === 0 ? <Empty text="No agents yet." /> : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead><tr><th>Name</th><th>Email</th><th>Status</th><th /></tr></thead>
                <tbody>
                  {data.map((a) => (
                    <tr key={a.id}>
                      <td>{a.full_name}</td><td>{a.email}</td>
                      <td><StatusBadge value={a.is_active ? "active" : "cancelled"} /></td>
                      <td className="text-right"><button className="btn btn-xs" onClick={() => toggle.mutate(a)}>{a.is_active ? "Deactivate" : "Activate"}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
      <Modal open={open} title="New agent" onClose={() => setOpen(false)}>
        <form onSubmit={(e) => { e.preventDefault(); create.mutate(); }}>
          <Field label="Full name"><input className="input input-bordered w-full" required value={form.full_name} onChange={set("full_name")} /></Field>
          <Field label="Email"><input type="email" className="input input-bordered w-full" required value={form.email} onChange={set("email")} /></Field>
          <Field label="Password"><input type="password" className="input input-bordered w-full" required minLength={8} maxLength={72} value={form.password} onChange={set("password")} /></Field>
          <div className="modal-action"><button type="button" className="btn" onClick={() => setOpen(false)}>Cancel</button><button className="btn btn-primary" disabled={create.isPending}>Create</button></div>
        </form>
      </Modal>
    </>
  );
}
