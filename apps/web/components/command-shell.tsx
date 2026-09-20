"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Brand } from "./brand";

const navigation = [
  { label: "Overview", href: "/overview", icon: "⌂" },
  { label: "Alerts", href: "/alerts", icon: "!", count: 7 },
  { label: "Investigations", href: "/investigations", icon: "◌" },
  { label: "Beneficiaries", href: "/beneficiaries", icon: "↗" },
  { label: "Evaluation", href: "/evaluation", icon: "⌁" },
  { label: "Institutions", href: "/institutions", icon: "▦" },
];

export function CommandShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKeyDown); document.body.style.overflow = ""; };
  }, [open]);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.dispatchEvent(new Event("nche:route-start"));
    router.replace("/login");
  }

  return (
    <div className="command-shell">
      <div className={`mobile-scrim ${open ? "is-open" : ""}`} onClick={() => setOpen(false)} />
      <aside id="command-sidebar" className={`sidebar ${open ? "is-open" : ""}`}>
        <div className="sidebar-top">
          <Link href="/overview" onClick={() => setOpen(false)}><Brand /></Link>
          <button className="sidebar-close" onClick={() => setOpen(false)} aria-label="Close navigation">×</button>
        </div>
        <Link className="workspace-switcher" href="/institutions" onClick={() => setOpen(false)}>
          <span className="workspace-avatar">N</span>
          <span><strong>Institution workspace</strong><small>Multi-bank directory</small></span>
          <span className="chevron">⌄</span>
        </Link>
        <nav className="side-nav" aria-label="Command navigation">
          {navigation.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return <Link className={active ? "active" : ""} href={item.href} key={item.href} onClick={() => setOpen(false)}><span className="nav-icon">{item.icon}</span><span>{item.label}</span>{item.count && <b>{item.count}</b>}</Link>;
          })}
        </nav>
        <div className="sidebar-section-label">Workspace</div>
        <nav className="side-nav secondary-nav" aria-label="Workspace navigation">
          <Link href="/settings" className={pathname.startsWith("/settings") ? "active" : ""} onClick={() => setOpen(false)}><span className="nav-icon">S</span><span>Settings</span></Link>
          <Link href="/docs" onClick={() => setOpen(false)}><span className="nav-icon">?</span><span>Documentation</span></Link>
        </nav>
        <div className="sidebar-bottom">
          <div className="live-status"><span className="status-dot" />Live monitoring<span className="status-ping" /></div>
          <div className="sidebar-user"><span className="user-avatar">OA</span><span><strong>Oluwaseun A.</strong><small>Analyst</small></span><button className="sidebar-logout" onClick={signOut}>Sign out</button></div>
        </div>
      </aside>
      <main className="command-main">
        <header className="command-topbar">
          <button className="menu-toggle" onClick={() => setOpen(true)} aria-label="Open navigation" aria-expanded={open} aria-controls="command-sidebar">☰</button>
          <div className="topbar-breadcrumb"><span>Nche Command</span><span className="crumb-slash">/</span><strong>{navigation.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))?.label ?? "Overview"}</strong></div>
          <div className="topbar-actions"><button className="icon-button" aria-label="Search">⌕</button><button className="icon-button notification-button" aria-label="Notifications">♧<i /></button><span className="topbar-divider" /><span className="topbar-date">Mon, 07 Sep 2026</span></div>
        </header>
        {children}
      </main>
    </div>
  );
}
