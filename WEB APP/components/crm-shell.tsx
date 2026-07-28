"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

import { signOut } from "@/app/actions";
import { ClientSearch } from "./client-search";
import brandLogo from "@/mk-jewels-logos/WhatsApp Image 2026-06-24 at 13.01.41 (1).jpeg";

function BrandLink({ compact = false }: { compact?: boolean }) {
  return <Link href="/dashboard" className={`crm-brand${compact ? " crm-brand--compact" : ""}`} aria-label="MK Jewels CRM dashboard">
    <Image className="crm-brand-logo" src={brandLogo} alt="MK Jewels" priority />
    <span className="crm-brand-label">CRM</span>
  </Link>;
}

export function CrmShell({ profile, children }: { profile: { name: string; role: string; branch_name: string | null }; children: React.ReactNode }) {
  const navigation = [["Dashboard", "/dashboard"], ["Client Walk-in Form", "/queue"], ["Not Bought Follow Up", "/followups"], ["Referrals Calling", "/referrals"], ["Client Database", "/clients"], ["Roster / Allocation", "/allocation"]] as const;
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setDrawerOpen(false); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  const navigationLinks = navigation.map(([label, href]) => <Link className="crm-nav-link" href={href} key={href} onClick={() => setDrawerOpen(false)}>{label}</Link>);
  return <div className="crm-app crm-shell">
    <header className="crm-mobile-header"><button type="button" className="crm-menu-button" aria-label="Open navigation menu" aria-expanded={drawerOpen} onClick={() => setDrawerOpen(true)}><span /><span /><span /></button><BrandLink compact /><div className="crm-mobile-search"><ClientSearch /></div></header>
    <button type="button" className={`crm-drawer-backdrop ${drawerOpen ? "is-open" : ""}`} aria-label="Close navigation menu" aria-hidden={!drawerOpen} tabIndex={drawerOpen ? 0 : -1} onClick={() => setDrawerOpen(false)} />
    <aside className={`crm-sidebar ${drawerOpen ? "is-open" : ""}`} aria-label="Main navigation"><div className="crm-sidebar-top"><BrandLink /><button type="button" className="crm-drawer-close" aria-label="Close navigation menu" onClick={() => setDrawerOpen(false)}>×</button></div><nav className="crm-navigation">{navigationLinks}</nav><div className="crm-user"><b>{profile.name}</b><span>{profile.role.replace("_", " ")} · {profile.branch_name ?? "All branches"}</span></div><form action={signOut}><button className="crm-logout">Logout</button></form></aside>
    <div className="crm-main"><header className="crm-desktop-header"><div><ClientSearch /></div></header>{children}</div>
  </div>;
}
