import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { orgApi } from "../../api";
import { ErrorBox, Field, Loading, Modal, PageHeader, Pagination, StatusBadge, Card } from "../../components/ui";
import { errorMessage } from "../../utils/format";

const EMPTY = { name: "", admin_full_name: "", admin_email: "", admin_password: "" };

export default function Organizations() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [renaming, setRenaming] = useState(null);
  const [newName, setNewName] = useState("");
  const pageSize = 10;
  const { data, isLoading, error } = useQuery({ queryKey: ["orgs", page], queryFn: () => orgApi.list({ page, page_size: pageSize }) });

  const create = useMutation({
    mutationFn: () => orgApi.create(form),
    onSuccess: () => { toast.success("Organization created"); setOpen(false); setForm(EMPTY); qc.invalidateQueries({ queryKey: ["orgs"] }); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const toggle = useMutation({
    mutationFn: (o) => orgApi.update(o.id, { status: o.status === "active" ? "disabled" : "active" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orgs"] }),
    onError: (e) => toast.error(errorMessage(e)),
  });
  const rename = useMutation({
    mutationFn: () => orgApi.update(renaming.id, { name: newName }),
    onSuccess: () => { toast.success("Organization renamed"); setRenaming(null); qc.invalidateQueries({ queryKey: ["orgs"] }); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <>
      <PageHeader title="Organizations"><button className="btn btn-primary btn-sm" onClick={() => setOpen(true)}>New organization</button></PageHeader>
      {isLoading ? <Loading /> : error ? <ErrorBox error={error} /> : (
        <Card>
          <div className="overflow-x-auto">
            <table className="table">
              <thead><tr><th>ID</th><th>Name</th><th>Status</th><th /></tr></thead>
              <tbody>
                {data.items.map((o) => (
                  <tr key={o.id}>
                    <td>{o.id}</td><td>{o.name}</td><td><StatusBadge value={o.status} /></td>
                    <td className="text-right space-x-1">
                      <button className="btn btn-xs" onClick={() => { setRenaming(o); setNewName(o.name); }}>Rename</button>
                      <button className="btn btn-xs" onClick={() => toggle.mutate(o)}>{o.status === "active" ? "Disable" : "Enable"}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} pageSize={pageSize} total={data.total} onChange={setPage} />
        </Card>
      )}
      <Modal open={!!renaming} title="Rename organization" onClose={() => setRenaming(null)}>
        <form onSubmit={(e) => { e.preventDefault(); rename.mutate(); }}>
          <Field label="Organization name"><input className="input input-bordered w-full" required minLength={2} maxLength={150} value={newName} onChange={(e) => setNewName(e.target.value)} /></Field>
          <div className="modal-action"><button type="button" className="btn" onClick={() => setRenaming(null)}>Cancel</button><button className="btn btn-primary" disabled={rename.isPending}>Save</button></div>
        </form>
      </Modal>
      <Modal open={open} title="New organization" onClose={() => setOpen(false)}>
        <form onSubmit={(e) => { e.preventDefault(); create.mutate(); }}>
          <Field label="Organization name"><input className="input input-bordered w-full" required value={form.name} onChange={set("name")} /></Field>
          <Field label="Admin full name"><input className="input input-bordered w-full" required value={form.admin_full_name} onChange={set("admin_full_name")} /></Field>
          <Field label="Admin email"><input type="email" className="input input-bordered w-full" required value={form.admin_email} onChange={set("admin_email")} /></Field>
          <Field label="Admin password"><input type="password" className="input input-bordered w-full" required minLength={8} maxLength={72} value={form.admin_password} onChange={set("admin_password")} /></Field>
          <div className="modal-action"><button type="button" className="btn" onClick={() => setOpen(false)}>Cancel</button><button className="btn btn-primary" disabled={create.isPending}>Create</button></div>
        </form>
      </Modal>
    </>
  );
}
