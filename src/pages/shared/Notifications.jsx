import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationApi } from "../../api";
import { Card, Empty, ErrorBox, Loading, PageHeader, Pagination } from "../../components/ui";
import { formatDateTime, humanize } from "../../utils/format";

export default function Notifications() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const pageSize = 15;
  const params = { page, page_size: pageSize, unread_only: unreadOnly };
  const { data, isLoading, error } = useQuery({ queryKey: ["notifications", params], queryFn: () => notificationApi.list(params) });
  const refresh = () => { qc.invalidateQueries({ queryKey: ["notifications"] }); qc.invalidateQueries({ queryKey: ["unread-count"] }); qc.invalidateQueries({ queryKey: ["dash"] }); };
  const markOne = useMutation({ mutationFn: notificationApi.read, onSuccess: refresh });
  const markAll = useMutation({ mutationFn: notificationApi.readAll, onSuccess: refresh });

  return (
    <>
      <PageHeader title="Notifications">
        <label className="label cursor-pointer gap-2"><input type="checkbox" className="toggle toggle-sm" checked={unreadOnly} onChange={(e) => { setPage(1); setUnreadOnly(e.target.checked); }} /><span className="label-text">Unread only</span></label>
        <button className="btn btn-sm" disabled={!data?.unread_count} onClick={() => markAll.mutate()}>Mark all read</button>
      </PageHeader>
      {isLoading ? <Loading /> : error ? <ErrorBox error={error} /> : (
        <Card>
          {data.items.length === 0 ? <Empty text="No notifications." /> : (
            <ul className="divide-y divide-base-200">
              {data.items.map((n) => (
                <li key={n.id} className={`py-3 flex gap-3 items-start ${n.is_read ? "opacity-60" : ""}`}>
                  <span className={`mt-2 size-2 rounded-full shrink-0 ${n.is_read ? "bg-base-300" : "bg-primary"}`} />
                  <div className="flex-1">
                    <div className="font-medium">{n.title} <span className="badge badge-ghost badge-xs">{humanize(n.type)}</span></div>
                    <div className="text-sm">{n.message}</div>
                    <div className="text-xs text-base-content/50">{formatDateTime(n.created_at)}</div>
                  </div>
                  {!n.is_read && <button className="btn btn-xs" onClick={() => markOne.mutate(n.id)}>Mark read</button>}
                </li>
              ))}
            </ul>
          )}
          <Pagination page={page} pageSize={pageSize} total={data.total} onChange={setPage} />
        </Card>
      )}
    </>
  );
}
