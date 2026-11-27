import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout";
import { ROLE } from "./constants/enums";
import Home from "./pages/home/Home";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Dashboard from "./pages/shared/Dashboard";
import Plans from "./pages/shared/Plans";
import Subscriptions from "./pages/shared/Subscriptions";
import { TicketList, NewTicket } from "./pages/shared/Tickets";
import TicketDetail from "./pages/shared/TicketDetail";
import Notifications from "./pages/shared/Notifications";
import { InvoiceList, InvoiceDetail } from "./pages/shared/Invoices";
import Payments from "./pages/shared/Payments";
import AdminTools from "./pages/admin/AdminTools";
import AuditLogs from "./pages/shared/AuditLogs";
import Profile from "./pages/shared/Profile";
import Organizations from "./pages/platform/Organizations";
import { CustomerList, CustomerDetail } from "./pages/admin/Customers";
import Agents from "./pages/admin/Agents";
import SlaPolicies from "./pages/admin/SlaPolicies";

const { SUPER_ADMIN, ORG_ADMIN, AGENT, CUSTOMER } = ROLE;

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />

          <Route element={<ProtectedRoute roles={[SUPER_ADMIN]} />}>
            <Route path="/organizations" element={<Organizations />} />
          </Route>

          <Route element={<ProtectedRoute roles={[SUPER_ADMIN, ORG_ADMIN]} />}>
            <Route path="/audit-logs" element={<AuditLogs />} />
          </Route>

          <Route element={<ProtectedRoute roles={[ORG_ADMIN, AGENT, CUSTOMER]} />}>
            <Route path="/plans" element={<Plans />} />
            <Route path="/subscriptions" element={<Subscriptions />} />
          </Route>

          <Route element={<ProtectedRoute roles={[ORG_ADMIN, AGENT]} />}>
            <Route path="/customers" element={<CustomerList />} />
            <Route path="/customers/:id" element={<CustomerDetail />} />
          </Route>

          <Route element={<ProtectedRoute roles={[ORG_ADMIN, AGENT, CUSTOMER]} />}>
            <Route path="/invoices" element={<InvoiceList />} />
            <Route path="/invoices/:id" element={<InvoiceDetail />} />
            <Route path="/payments" element={<Payments />} />
          </Route>

          <Route element={<ProtectedRoute roles={[ORG_ADMIN]} />}>
            <Route path="/demo-tools" element={<AdminTools />} />
            <Route path="/agents" element={<Agents />} />
            <Route path="/sla-policies" element={<SlaPolicies />} />
          </Route>

          <Route element={<ProtectedRoute roles={[ORG_ADMIN, AGENT, CUSTOMER]} />}>
            <Route path="/tickets" element={<TicketList />} />
            <Route path="/tickets/:id" element={<TicketDetail />} />
            <Route path="/notifications" element={<Notifications />} />
          </Route>

          <Route element={<ProtectedRoute roles={[CUSTOMER]} />}>
            <Route path="/tickets/new" element={<NewTicket />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
