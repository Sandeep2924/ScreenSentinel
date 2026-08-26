"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AgentStatus from "./AgentStatus";

const NAV = [
  { href: "/", label: "Overview", eyebrow: "01" },
  { href: "/logs", label: "Ledger", eyebrow: "02" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-line bg-panel">
      <div className="border-b border-line px-5 py-5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-sm border border-amber/40 bg-amber-glow font-mono text-sm font-bold text-amber">
            SS
          </div>
          <div>
            <p className="font-mono text-sm font-semibold tracking-wide text-ink">SCREEN SENTINEL</p>
            <p className="font-mono text-[10px] uppercase tracking-widest2 text-ink-faint">
              capture detection
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`focus-ring group mb-1 flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm transition-colors ${
                active
                  ? "bg-panel2 text-ink border border-line"
                  : "text-ink-dim border border-transparent hover:text-ink hover:bg-panel2/60"
              }`}
            >
              <span
                className={`font-mono text-[10px] ${active ? "text-amber" : "text-ink-faint group-hover:text-ink-dim"}`}
              >
                {item.eyebrow}
              </span>
              {item.label}
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-amber" />}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-line px-5 py-4">
        <AgentStatus />
      </div>
    </aside>
  );
}
