import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { slaApi } from "../../api";
import { TICKET_PRIORITIES } from "../../constants/enums";
import { Card, Empty, ErrorBox, Field, Loading, Modal, PageHeader, StatusBadge } from "../../components/ui";
import { errorMessage, humanize } from "../../utils/format";

const EMPTY = { name: "", priority: "medium", first_response_minutes: 60, resolution_minutes: 1440 };
const mins = (m) => (m >= 1440 && m % 1440 === 0 ? `${m / 1440}d` : m >= 60 && m % 60 === 0 ? `${m / 60}h` : `${m}m`);

export default function SlaPolicies() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ["sla"], queryFn: slaApi.list });
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const openForm = (p) => {
    setEditing(p);
    setForm(p === "new" ? EMPTY : { name: p.name, priority: p.priority, first_response_minutes: p.first_response_minutes, resolution_minutes: p.resolution_minutes });
  };

  const save = useMutation({
    mutationFn: () => {
      if (Number(form.resolution_minutes) < Number(form.first_response_minutes)) {
        return Promise.reject(new Error("Resolution time must be at least the first-response time"));
      }
      const body = { ...form, first_response_minutes: Number(form.first_response_minutes), resolution_minutes: Number(form.resolution_minutes) };
      if (editing === "new") return slaApi.create(body);
      const { priority, ...rest } = body; // SlaPolicyUpdate has no priority field
      return slaApi.update(editing.id, rest);
    },
    onSuccess: () => { toast.success("SLA policy saved"); setEditing(null); qc.invalidateQueries({ queryKey: ["sla"] }); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const toggle = useMutation({
    mutationFn: (p) => slaApi.update(p.id, { is_active: !p.is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sla"] }),
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <>
      <PageHeader title="SLA policies"><button className="btn btn-primary btn-sm" onClick={() => openForm("new")}>New policy</button></PageHeader>
      {isLoading ? <Loading /> : error ? <ErrorBox error={error} /> : (
        <Card>
          {data.length === 0 ? <Empty text="No SLA policies yet." /> : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead><tr><th>Name</th><th>Priority</th><th>First response</th><th>Resolution</th><th>Status</th><th /></tr></thead>
                <tbody>
                  {data.map((p) => (
                    <tr key={p.id}>
                      <td>{p.name}</td><td><StatusBadge value={p.priority} /></td>
                      <td>{mins(p.first_response_minutes)}</td><td>{mins(p.resolution_minutes)}</td>
                      <td><StatusBadge value={p.is_active ? "active" : "cancelled"} /></td>
                      <td className="text-right space-x-1">
                        <button className="btn btn-xs" onClick={() => openForm(p)}>Edit</button>
                        <button className="btn btn-xs" onClick={() => toggle.mutate(p)}>{p.is_active ? "Disable" : "Enable"}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
      <Modal open={!!editing} title={editing === "new" ? "New SLA policy" : "Edit SLA policy"} onClose={() => setEditing(null)}>
        <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
          <Field label="Name"><input className="input input-bordered w-full" required value={form.name} onChange={set("name")} /></Field>
          <Field label="Priority">
            <select className="select select-bordered w-full" disabled={editing !== "new"} value={form.priority} onChange={set("priority")}>
              {TICKET_PRIORITIES.map((p) => <option key={p} value={p}>{humanize(p)}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="First response (minutes)"><input type="number" min="1" max="43200" className="input input-bordered w-full" required value={form.first_response_minutes} onChange={set("first_response_minutes")} /></Field>
            <Field label="Resolution (minutes)"><input type="number" min="1" max="525600" className="input input-bordered w-full" required value={form.resolution_minutes} onChange={set("resolution_minutes")} /></Field>
          </div>
          <div className="modal-action"><button type="button" className="btn" onClick={() => setEditing(null)}>Cancel</button><button className="btn btn-primary" disabled={save.isPending}>Save</button></div>
        </form>
      </Modal>
    </>
  );
}
