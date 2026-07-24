import { redirect } from "next/navigation";
import { CrmShell } from "@/components/crm-shell";
import { createClient } from "@/lib/supabase/server";
export default async function CrmLayout({ children }: { children: React.ReactNode }) { const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect("/login"); const { data } = await supabase.rpc("get_my_profile"); const profile = data?.[0]; if (!profile) redirect("/login"); return <CrmShell profile={profile}>{children}</CrmShell>; }
