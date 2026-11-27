# SubFlow Frontend

React 18 + Vite + Tailwind CSS v4 + daisyUI v5 + React Router + TanStack Query.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
```

Start the FastAPI backend on http://localhost:8000 first. Vite proxies `/api` to it, so CORS is not needed in development.
To point at another backend: `VITE_BACKEND_URL=http://host:port npm run dev`.

## Accounts and sign-up

- `/register` has two tabs: **customer** (pick your organization from a list) and **organization**
  (creates the organization and its admin). After sign-up you are signed in automatically.
- `/profile` (every role): see and edit your details, change your password; Org Admins also edit the organization name.
- Demo accounts (after `python -m scripts.reset_db` in the backend), password `Password123!`:
  superadmin@subflow.test, admin@acme.test, agent1@acme.test, customer1@acme.test.

## Roles and pages

| Role | Pages |
|---|---|
| super_admin | Dashboard, Organizations, Audit logs |
| org_admin | Dashboard, Plans, Subscriptions, Customers (+detail), Tickets, Agents, SLA policies, Audit logs, Notifications |
| agent | Dashboard, Tickets (+billing context, internal notes), Customers, Notifications |
| customer | Dashboard, Plans (subscribe), My subscription (change/pause/resume/cancel), Tickets, Notifications |

## Backend notes

All 66 API calls in `src/api/index.js` match the routes in the backend OpenAPI. In development the Vite proxy
sends `/api` to `http://localhost:8000`, so no CORS setup is needed.
