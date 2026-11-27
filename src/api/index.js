import api from "./client";

const V1 = "/api/v1";
const PLANS = `${V1}/plans`;
const SUBS = `${V1}/subscriptions`;

const data = (p) => p.then((r) => r.data);

export const authApi = {
  // OAuth2 password form: the field is called "username" but holds the email
  login: (email, password) =>
    data(api.post(`${V1}/auth/login`, new URLSearchParams({ username: email, password }), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    })),
  register: (body) => data(api.post(`${V1}/auth/register`, body)),
  registerOrganization: (body) => data(api.post(`${V1}/auth/register-organization`, body)),
  me: () => data(api.get(`${V1}/auth/me`)),
  updateMe: (body) => data(api.patch(`${V1}/auth/me`, body)),
  changePassword: (body) => data(api.post(`${V1}/auth/change-password`, body)),
};

export const orgApi = {
  list: (params) => data(api.get(`${V1}/organizations`, { params })),
  publicList: () => data(api.get(`${V1}/organizations/public`)),
  me: () => data(api.get(`${V1}/organizations/me`)),
  updateMine: (body) => data(api.patch(`${V1}/organizations/me`, body)),
  create: (body) => data(api.post(`${V1}/organizations`, body)),
  update: (id, body) => data(api.patch(`${V1}/organizations/${id}`, body)),
};

export const userApi = {
  agents: () => data(api.get(`${V1}/users/agents`)),
  createAgent: (body) => data(api.post(`${V1}/users/agents`, body)),
  update: (id, body) => data(api.patch(`${V1}/users/${id}`, body)),
};

export const planApi = {
  list: () => data(api.get(PLANS)),
  create: (body) => data(api.post(PLANS, body)),
  update: (id, body) => data(api.patch(`${PLANS}/${id}`, body)),
  setStatus: (id, is_active) => data(api.patch(`${PLANS}/${id}`, { is_active })),
};

export const subApi = {
  list: (params) => data(api.get(SUBS, { params })),
  mine: () => data(api.get(`${SUBS}/me`)),
  create: (plan_id) => data(api.post(SUBS, { plan_id })),
  changePlan: (id, new_plan_id) => data(api.post(`${SUBS}/${id}/change-plan`, { new_plan_id })),
  pause: (id) => data(api.post(`${SUBS}/${id}/pause`)),
  resume: (id) => data(api.post(`${SUBS}/${id}/resume`)),
  cancel: (id, at_period_end = true) => data(api.post(`${SUBS}/${id}/cancel`, { at_period_end })),
};

export const customerApi = {
  me: () => data(api.get(`${V1}/customers/me`)),
  updateMe: (body) => data(api.patch(`${V1}/customers/me`, body)),
  list: (params) => data(api.get(`${V1}/customers`, { params })),
  get: (id) => data(api.get(`${V1}/customers/${id}`)),
  update: (id, body) => data(api.patch(`${V1}/customers/${id}`, body)),
};

export const ticketApi = {
  list: (params) => data(api.get(`${V1}/tickets`, { params })),
  get: (id) => data(api.get(`${V1}/tickets/${id}`)),
  create: (body) => data(api.post(`${V1}/tickets`, body)),
  update: (id, body) => data(api.patch(`${V1}/tickets/${id}`, body)),
  assign: (id, agent_id) => data(api.post(`${V1}/tickets/${id}/assign`, { agent_id })),
  reply: (id, body) => data(api.post(`${V1}/tickets/${id}/messages`, { body })),
  note: (id, body) => data(api.post(`${V1}/tickets/${id}/notes`, { body })),
  escalate: (id, reason) => data(api.post(`${V1}/tickets/${id}/escalate`, { reason })),
  resolve: (id, note) => data(api.post(`${V1}/tickets/${id}/resolve`, { note })),
  billingContext: (id) => data(api.get(`${V1}/tickets/${id}/billing-context`)),
};

export const slaApi = {
  list: () => data(api.get(`${V1}/sla-policies`)),
  create: (body) => data(api.post(`${V1}/sla-policies`, body)),
  update: (id, body) => data(api.patch(`${V1}/sla-policies/${id}`, body)),
};

export const dashboardApi = {
  platform: () => data(api.get(`${V1}/dashboard/platform`)),
  admin: (days = 30) => data(api.get(`${V1}/dashboard/admin`, { params: { days } })),
  agent: (days = 30) => data(api.get(`${V1}/dashboard/agent`, { params: { days } })),
  customer: () => data(api.get(`${V1}/dashboard/customer`)),
};

export const notificationApi = {
  list: (params) => data(api.get(`${V1}/notifications`, { params })),
  unreadCount: () => data(api.get(`${V1}/notifications/unread-count`)),
  readAll: () => data(api.post(`${V1}/notifications/read-all`)),
  read: (id) => data(api.post(`${V1}/notifications/${id}/read`)),
};

export const auditApi = {
  list: (params) => data(api.get(`${V1}/audit-logs`, { params })),
};

// ---- Added from "SubFlow Backend Structure (Tier 1)" spec ----
// List endpoints should return {items,total,page,page_size}; tolerate a bare array too.
const paged = (d) => (Array.isArray(d) ? { items: d, total: d.length } : d);

export const invoiceApi = {
  mine: (params) => data(api.get(`${V1}/invoices/me`, { params })).then(paged),
  list: (params) => data(api.get(`${V1}/invoices`, { params })).then(paged),
  get: (id) => data(api.get(`${V1}/invoices/${id}`)),
  pay: (id) => data(api.post(`${V1}/invoices/${id}/pay`)),
};

export const paymentApi = {
  mine: (params) => data(api.get(`${V1}/payments/me`, { params })).then(paged),
  list: (params) => data(api.get(`${V1}/payments`, { params })).then(paged),
  attempts: (id) => data(api.get(`${V1}/payments/${id}/attempts`)),
  refund: (id, body) => data(api.post(`${V1}/payments/${id}/refund`, body)),
  refunds: (params) => data(api.get(`${V1}/refunds`, { params })).then(paged),
};

export const adminToolsApi = {
  // Body field name for mock-config is a guess ("mode"); check schemas/payment.py.
  setMockConfig: (mode) => data(api.put(`${V1}/gateway/mock-config`, { mode })),
  runRenewals: () => data(api.post(`${V1}/admin/jobs/run-renewals`)),
  runRetries: () => data(api.post(`${V1}/admin/jobs/run-retries`)),
  runSlaCheck: () => data(api.post(`${V1}/admin/jobs/run-sla-check`)),
};
