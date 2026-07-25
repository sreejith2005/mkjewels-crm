import Link from "next/link";

import { signOut } from "@/app/actions";
import { ClientSearch } from "./client-search";

export function CrmShell({ profile, children }: { profile: { name: string; role: string; branch_name: string | null }; children: React.ReactNode }) {
  const navigation = [["Dashboard", "/dashboard"], ["Client Walk-in Form", "/queue"], ["Not Bought Follow Up", "/followups"], ["Referrals Calling", "/referrals"], ["Client Database", "/clients"], ["Roster / Allocation", "/allocation"]] as const;
  return <div className="min-h-screen md:grid md:grid-cols-[220px_1fr]"><aside className="border-b border-stone-200 bg-stone-50 p-4 md:border-b-0 md:border-r"><Link href="/dashboard" className="font-bold text-amber-800">MK Jewels CRM</Link><nav className="mt-5 grid gap-2">{navigation.map(([label, href]) => <Link className="rounded border border-stone-200 bg-white px-3 py-2 text-sm" href={href} key={href}>{label}</Link>)}</nav><div className="mt-6 text-xs text-stone-600"><b>{profile.name}</b><br />{profile.role.replace("_", " ")} · {profile.branch_name ?? "All branches"}</div><form className="mt-3" action={signOut}><button className="text-sm underline">Logout</button></form></aside><div><header className="border-b border-stone-200 bg-stone-50"><div className="px-5 py-3"><ClientSearch /></div></header>{children}</div></div>;
}
