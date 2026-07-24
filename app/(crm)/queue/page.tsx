import Link from "next/link";

import { EntryQueue } from "@/components/entry-queue";
import { createClient } from "@/lib/supabase/server";

export default async function QueuePage() {
  const supabase = await createClient();
  const [{ data: profileRows }, { data: userData }] = await Promise.all([
    supabase.rpc("get_my_profile"),
    supabase.auth.getUser(),
  ]);
  const profile = profileRows?.[0];
  if (!profile || !userData.user) return null;
  const [{ data: user }, { data: branches }] = await Promise.all([
    supabase.from("users").select("branch_id").eq("id", userData.user.id).single(),
    supabase.from("branches").select("id,name").eq("active", true).order("name"),
  ]);
  const branchId = user?.branch_id;
  const [{ data: allocation }, { data: availability }, { data: queue }] = branchId
    ? await Promise.all([
        supabase.from("crm_allocation").select("crm_name").eq("branch_id", branchId).eq("active", true).order("crm_name"),
        supabase.from("crm_daily_availability").select("crm_name,is_available").eq("branch_id", branchId).eq("date", new Date().toISOString().slice(0, 10)),
        supabase.from("entry_queue").select("id,token,client_name,mobile,assigned_crm_name,status,created_at,client_id").eq("branch_id", branchId).gte("created_at", new Date().toISOString().slice(0, 10)).order("created_at", { ascending: false }),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }];
  const unavailable = new Set((availability ?? []).filter((item) => !item.is_available).map((item) => item.crm_name));
  const crms = (allocation ?? []).filter((item) => !unavailable.has(item.crm_name)).map((item) => item.crm_name);
  return <main className="mx-auto max-w-7xl px-5 py-7"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-semibold uppercase tracking-wider text-amber-800">Front desk</p><h1 className="mt-1 text-3xl font-semibold">Entry queue</h1></div><Link className="rounded bg-amber-800 px-4 py-2 text-sm font-medium text-white" href="/visits/new">Direct walk-in</Link></div><EntryQueue profile={{ role: profile.role, branchId: branchId ?? null }} branches={branches ?? []} crms={crms} initialItems={queue ?? []} /></main>;
}
