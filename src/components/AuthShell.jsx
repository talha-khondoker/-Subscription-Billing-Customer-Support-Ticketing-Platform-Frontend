import { useEffect, useState } from "react";
import { SiteFooter, SiteNavbar } from "./SiteChrome";

const SLIDES = [
  { icon: "🔁", title: "Failed payments, recovered", text: "Automatic retries bring back revenue without chasing customers." },
  { icon: "⚖️", title: "Fair proration", text: "Upgrade or downgrade mid-cycle and the maths is done for you." },
  { icon: "🎧", title: "SLA-driven support", text: "Live timers keep every ticket on track, with billing context beside it." },
  { icon: "🏢", title: "Built for many teams", text: "Every organization is fully isolated, with its own plans and customers." },
];

export default function AuthShell({ title, subtitle, children, shake }) {
  const [i, setI] = useState(0);
  useEffect(() => { const t = setInterval(() => setI((x) => (x + 1) % SLIDES.length), 4000); return () => clearInterval(t); }, []);
  const s = SLIDES[i];
  return (
    <div className="min-h-screen flex flex-col bg-base-200">
      <SiteNavbar />
      <main className="flex-1 grid lg:grid-cols-2 pt-16">
        <section className="hidden lg:flex relative overflow-hidden bg-gradient-to-br from-primary via-secondary to-accent text-primary-content items-center justify-center p-12">
          <div className="absolute -top-16 -left-16 size-80 rounded-full bg-white/20 blur-3xl animate-blob" />
          <div className="absolute bottom-0 right-0 size-96 rounded-full bg-black/10 blur-3xl animate-blob [animation-delay:-6s]" />
          <div className="relative max-w-md">
            <h2 className="text-4xl font-extrabold leading-tight">Billing and support, on autopilot.</h2>
            <div key={i} className="mt-10 rounded-box bg-white/15 backdrop-blur p-6 animate-slidein">
              <div className="text-5xl">{s.icon}</div>
              <div className="text-xl font-bold mt-3">{s.title}</div>
              <p className="opacity-90 mt-1">{s.text}</p>
            </div>
            <div className="flex gap-2 mt-5">
              {SLIDES.map((_, n) => (
                <button key={n} aria-label={`Slide ${n + 1}`} onClick={() => setI(n)}
                  className={`h-2 rounded-full transition-all ${n === i ? "w-8 bg-white" : "w-2 bg-white/50 hover:bg-white/80"}`} />
              ))}
            </div>
          </div>
        </section>
        <section className="flex items-center justify-center p-4 sm:p-8">
          <div className={`card bg-base-100 shadow-xl w-full max-w-md ${shake ? "animate-shake" : ""}`}>
            <div className="card-body gap-3">
              <h1 className="text-3xl font-extrabold">{title}</h1>
              <p className="text-base-content/60 -mt-1 mb-2">{subtitle}</p>
              {children}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
