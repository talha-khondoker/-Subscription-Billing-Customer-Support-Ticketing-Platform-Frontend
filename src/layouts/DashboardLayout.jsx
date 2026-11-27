import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { notificationApi } from "../api";
import { ROLE, ROLE_LABEL } from "../constants/enums";

const NAV = {
  [ROLE.SUPER_ADMIN]: [
    ["/dashboard", "Dashboard"], ["/organizations", "Organizations"], ["/audit-logs", "Audit logs"],
    ["/profile", "My profile"],
  ],
  [ROLE.ORG_ADMIN]: [
    ["/dashboard", "Dashboard"], ["/plans", "Plans"], ["/subscriptions", "Subscriptions"],
    ["/customers", "Customers"], ["/invoices", "Invoices"], ["/payments", "Payments"], ["/tickets", "Tickets"],
    ["/agents", "Agents"], ["/sla-policies", "SLA policies"], ["/audit-logs", "Audit logs"],
    ["/demo-tools", "Demo tools"], ["/notifications", "Notifications"], ["/profile", "Profile & organization"],
  ],
  [ROLE.AGENT]: [
    ["/dashboard", "Dashboard"], ["/tickets", "Tickets"], ["/customers", "Customers"],
    ["/subscriptions", "Subscriptions"], ["/invoices", "Invoices"], ["/payments", "Payments"],
    ["/plans", "Plans"], ["/notifications", "Notifications"], ["/profile", "My profile"],
  ],
  [ROLE.CUSTOMER]: [
    ["/dashboard", "Dashboard"], ["/plans", "Plans"], ["/subscriptions", "My subscription"],
    ["/invoices", "Invoices"], ["/payments", "Payments"], ["/tickets", "Support tickets"],
    ["/notifications", "Notifications"], ["/profile", "My profile"],
  ],
};

function Bell() {
  const navigate = useNavigate();
  const { data } = useQuery({
    queryKey: ["unread-count"],
    queryFn: notificationApi.unreadCount,
    refetchInterval: 30000,
  });
  const n = data?.unread_count || 0;
  return (
    <button className="btn btn-ghost btn-circle" onClick={() => navigate("/notifications")} aria-label="Notifications">
      <div className="indicator">
        <span>🔔</span>
        {n > 0 && <span className="badge badge-xs badge-error indicator-item">{n}</span>}
      </div>
    </button>
  );
}

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = NAV[user.role] || [];

  const toggleTheme = () => {
    const html = document.documentElement;
    html.setAttribute("data-theme", html.getAttribute("data-theme") === "dark" ? "light" : "dark");
  };

  return (
    <div className="drawer lg:drawer-open">
      <input id="nav-drawer" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content flex flex-col min-h-screen bg-base-200/50">
        <div className="navbar bg-base-100 border-b border-base-200 sticky top-0 z-10">
          <div className="flex-none lg:hidden">
            <label htmlFor="nav-drawer" className="btn btn-square btn-ghost">☰</label>
          </div>
          <div className="flex-1" />
          <Link to="/" className="btn btn-ghost btn-sm hidden sm:inline-flex">🏠 Home</Link>
          <button className="btn btn-ghost btn-circle" onClick={toggleTheme} aria-label="Toggle theme">🌓</button>
          {user.role !== ROLE.SUPER_ADMIN && <Bell />}
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost">
              <div className="text-right leading-tight">
                <div className="text-sm font-medium">{user.full_name}</div>
                <div className="text-xs text-base-content/60">{ROLE_LABEL[user.role]}</div>
              </div>
            </div>
            <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-20 w-48 p-2 shadow">
              <li><Link to="/profile">My profile</Link></li>
              <li><button onClick={() => { logout(); navigate("/login"); }}>Log out</button></li>
            </ul>
          </div>
        </div>
        <main className="p-4 md:p-6 max-w-7xl w-full mx-auto flex-1"><Outlet /></main>
        <footer className="border-t border-base-200 bg-base-100 px-6 py-4 text-xs text-base-content/60 flex flex-wrap items-center justify-between gap-2">
          <span>© {new Date().getFullYear()} SubFlow</span>
          <span className="flex gap-4"><Link className="link link-hover" to="/">Home</Link><a className="link link-hover" href="/#pricing">Pricing</a><a className="link link-hover" href="/#faq">FAQ</a></span>
        </footer>
      </div>
      <div className="drawer-side z-20">
        <label htmlFor="nav-drawer" aria-label="close sidebar" className="drawer-overlay" />
        <aside className="bg-base-100 border-r border-base-200 w-64 min-h-full">
          <Link to="/" className="block px-6 py-5 text-xl font-bold text-primary">SubFlow</Link>
          <ul className="menu px-3 gap-1">
            {links.map(([to, label]) => (
              <li key={to}>
                <NavLink to={to} className={({ isActive }) => (isActive ? "menu-active" : "")}
                  onClick={() => (document.getElementById("nav-drawer").checked = false)}>
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="divider my-2 mx-3" />
          <ul className="menu px-3"><li><Link to="/">🏠 Back to home</Link></li></ul>
        </aside>
      </div>
    </div>
  );
}
