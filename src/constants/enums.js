// Mirrors app/core/enums.py in the backend. Keep these strings identical.
export const ROLE = {
  SUPER_ADMIN: "super_admin",
  ORG_ADMIN: "org_admin",
  AGENT: "agent",
  CUSTOMER: "customer",
};

export const ROLE_LABEL = {
  super_admin: "Super Admin",
  org_admin: "Org Admin",
  agent: "Agent",
  customer: "Customer",
};

export const TICKET_STATUSES = ["open", "in_progress", "waiting_customer", "escalated", "resolved", "closed"];
export const TICKET_PRIORITIES = ["low", "medium", "high", "urgent"];
export const TICKET_CATEGORIES = ["billing", "payment", "technical", "account", "general"];
export const BILLING_PERIODS = ["monthly", "yearly"];
export const SUBSCRIPTION_STATUSES = ["active", "paused", "past_due", "cancelled"];

// status/priority -> daisyUI badge color
export const BADGE_COLOR = {
  // subscription
  active: "badge-success", paused: "badge-warning", past_due: "badge-error", cancelled: "badge-neutral",
  // invoice / payment
  open: "badge-info", paid: "badge-success", failed: "badge-error", void: "badge-neutral",
  refunded: "badge-warning", pending: "badge-warning", succeeded: "badge-success",
  // ticket
  in_progress: "badge-primary", waiting_customer: "badge-warning", escalated: "badge-error",
  resolved: "badge-success", closed: "badge-neutral",
  // priority
  low: "badge-ghost", medium: "badge-info", high: "badge-warning", urgent: "badge-error",
  // org
  disabled: "badge-error",
};
