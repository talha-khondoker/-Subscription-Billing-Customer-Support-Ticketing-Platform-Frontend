import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const LINKS = [["features", "Features"], ["demo", "Live demo"], ["roles", "Who it's for"], ["pricing", "Pricing"], ["faq", "FAQ"]];

export function SiteNavbar() {
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 10);
    on();
    window.addEventListener("scroll", on);
    return () => window.removeEventListener("scroll", on);
  }, []);
  const toggleTheme = () => {
    const h = document.documentElement;
    h.setAttribute("data-theme", h.getAttribute("data-theme") === "dark" ? "light" : "dark");
  };
  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all ${scrolled ? "bg-base-100/80 backdrop-blur shadow-sm" : "bg-base-100/40 backdrop-blur-sm"}`}>
      <div className="navbar max-w-7xl mx-auto px-4">
        <div className="navbar-start">
          <div className="dropdown">
            <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">☰</div>
            <ul tabIndex={0} className="menu menu-sm dropdown-content bg-base-100 rounded-box z-10 mt-3 w-52 p-2 shadow">
              <li><Link to="/">Home</Link></li>
              {LINKS.map(([id, l]) => <li key={id}><a href={`/#${id}`}>{l}</a></li>)}
            </ul>
          </div>
          <Link to="/" className="text-2xl font-extrabold grad-text">SubFlow</Link>
        </div>
        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal px-1 gap-1">
            <li><Link to="/">Home</Link></li>
            {LINKS.map(([id, l]) => <li key={id}><a href={`/#${id}`}>{l}</a></li>)}
          </ul>
        </div>
        <div className="navbar-end gap-2">
          <button className="btn btn-ghost btn-circle" onClick={toggleTheme} aria-label="Toggle theme">🌓</button>
          {user ? (
            <Link to="/dashboard" className="btn btn-primary btn-sm">Go to dashboard</Link>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">Log in</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Get started</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-base-200 border-t border-base-300">
      <div className="max-w-7xl mx-auto px-4 py-12 grid sm:grid-cols-2 md:grid-cols-4 gap-8 text-sm">
        <div><Link to="/" className="text-2xl font-extrabold grad-text">SubFlow</Link><p className="mt-3 text-base-content/70">Subscription billing and customer support, unified.</p></div>
        <nav className="flex flex-col gap-2"><h6 className="footer-title">Product</h6><Link className="link link-hover" to="/">Home</Link><a className="link link-hover" href="/#features">Features</a><a className="link link-hover" href="/#demo">Live demo</a><a className="link link-hover" href="/#pricing">Pricing</a></nav>
        <nav className="flex flex-col gap-2"><h6 className="footer-title">Account</h6><Link className="link link-hover" to="/login">Log in</Link><Link className="link link-hover" to="/register">Register</Link><a className="link link-hover" href="/#faq">FAQ</a></nav>
        <nav className="flex flex-col gap-2"><h6 className="footer-title">Built with</h6><span>React · Tailwind CSS · daisyUI</span><span>FastAPI · SQLAlchemy · MySQL</span></nav>
      </div>
      <div className="border-t border-base-300 py-4 text-center text-xs text-base-content/60">© {new Date().getFullYear()} SubFlow. All rights reserved.</div>
    </footer>
  );
}
