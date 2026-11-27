import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { auditApi } from "../../api";
import { Card, Empty, ErrorBox, Loading, PageHeader, Pagination } from "../../components/ui";
import { formatDateTime } from "../../utils/format";

export default function AuditLogs() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ entity: "", actor: "", date_from: "", date_to: "" });
  const pageSize = 20;
  const params = { page, page_size: pageSize, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) };
  const { data, isLoading, error } = useQuery({ queryKey: ["audit", params], queryFn: () => auditApi.list(params) });
  const set = (k) => (e) => { setPage(1); setFilters({ ...filters, [k]: e.target.value }); };

  return (
    <>
      <PageHeader title="Audit logs" />
      <div className="flex flex-wrap gap-2 mb-4">
        <input className="input input-bordered input-sm" placeholder="Entity (e.g. subscription)" value={filters.entity} onChange={set("entity")} />
        <input type="number" min="1" className="input input-bordered input-sm w-32" placeholder="Actor user id" value={filters.actor} onChange={set("actor")} />
        <input type="date" className="input input-bordered input-sm" value={filters.date_from} onChange={set("date_from")} />
        <input type="date" className="input input-bordered input-sm" value={filters.date_to} onChange={set("date_to")} />
      </div>
      {isLoading ? <Loading /> : error ? <ErrorBox error={error} /> : (
        <Card>
          {data.items.length === 0 ? <Empty /> : (
            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead><tr><th>When</th><th>Actor</th><th>Action</th><th>Entity</th><th>Changes</th></tr></thead>
                <tbody>
                  {data.items.map((l) => (
                    <tr key={l.id}>
                      <td className="whitespace-nowrap">{formatDateTime(l.created_at)}</td>
                      <td>{l.actor_name || (l.actor_id ? `User #${l.actor_id}` : "System")}</td>
                      <td><code>{l.action}</code></td>
                      <td>{l.entity_type}{l.entity_id ? ` #${l.entity_id}` : ""}</td>
                      <td>
                        {(l.old_values || l.new_values) && (
                          <details><summary className="cursor-pointer text-xs">View</summary>
                            <pre className="text-xs max-w-xs overflow-auto">{JSON.stringify({ old: l.old_values, new: l.new_values }, null, 1)}</pre>
                          </details>
                        )}
                      </td>
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
