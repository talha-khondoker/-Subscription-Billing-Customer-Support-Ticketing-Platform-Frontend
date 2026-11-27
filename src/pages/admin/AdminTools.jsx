import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { adminToolsApi } from "../../api";
import { Card, PageHeader } from "../../components/ui";
import { errorMessage } from "../../utils/format";

const JOBS = [
  ["Run renewals", "Creates renewal invoices for subscriptions that are due and attempts payment.", adminToolsApi.runRenewals],
  ["Run payment retries", "Retries failed payments whose next retry time has passed.", adminToolsApi.runRetries],
  ["Run SLA check", "Flags breached tickets, escalates overdue ones and sends notifications.", adminToolsApi.runSlaCheck],
];
const MODES = [["always_success", "Always succeed"], ["always_fail", "Always fail"], ["random", "Random"]];

function JobCard({ label, desc, fn }) {
  const run = useMutation({
    mutationFn: fn,
    onSuccess: (r) => toast.success(`${label}: done${r && typeof r === "object" ? ` — ${JSON.stringify(r)}` : ""}`),
    onError: (e) => toast.error(errorMessage(e)),
  });
  return (
    <Card title={label}>
      <p className="text-sm text-base-content/70">{desc}</p>
      <button className="btn btn-primary btn-sm self-start" disabled={run.isPending} onClick={() => run.mutate()}>
        {run.isPending && <span className="loading loading-spinner loading-xs" />} Run now
      </button>
    </Card>
  );
}

export default function AdminTools() {
  const [mode, setMode] = useState("always_success");
  const save = useMutation({
    mutationFn: (m) => adminToolsApi.setMockConfig(m),
    onSuccess: (_, m) => { setMode(m); toast.success("Mock gateway updated"); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  return (
    <>
      <PageHeader title="Demo tools" />
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        {JOBS.map(([l, d, f]) => <JobCard key={l} label={l} desc={d} fn={f} />)}
      </div>
      <Card title="Mock payment gateway">
        <p className="text-sm text-base-content/70">Choose how the fake gateway answers payments, which is handy for showing the retry flow in a demo.</p>
        <div className="join">
          {MODES.map(([v, l]) => (
            <button key={v} className={`btn btn-sm join-item ${mode === v ? "btn-primary" : ""}`} disabled={save.isPending} onClick={() => save.mutate(v)}>{l}</button>
          ))}
        </div>
      </Card>
    </>
  );
}
