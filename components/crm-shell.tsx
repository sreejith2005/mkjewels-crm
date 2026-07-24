import Link from "next/link";
import { signOut } from "@/app/actions";
import { ClientSearch } from "./client-search";
export function CrmShell({ profile, children }: { profile: { name: string; role: string; branch_name: string | null }; children: React.ReactNode }) { return <><header className="border-b border-stone-200 bg-stone-50"><div className="mx-auto flex max-w-7xl items-center gap-5 px-5 py-3"><Link href="/" className="shrink-0 font-bold text-amber-800">MK Jewels CRM</Link><ClientSearch /><div className="ml-auto hidden text-right text-xs text-stone-600 md:block"><b>{profile.name}</b><br />{profile.role.replace("_", " ")} · {profile.branch_name ?? "All branches"}</div><form action={signOut}><button className="text-sm underline">Logout</button></form></div></header>{children}</>; }
