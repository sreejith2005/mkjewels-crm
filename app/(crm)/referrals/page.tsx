/* eslint-disable @typescript-eslint/no-explicit-any */
import { ReferralEntry } from "@/components/referral-entry";
import { ReferralQueue } from "@/components/referral-queue";
import { createClient } from "@/lib/supabase/server";

export default async function ReferralsPage() {
  const supabase = await createClient();
  const [{ data: profiles }, { data: auth }] = await Promise.all([supabase.rpc("get_my_profile"), supabase.auth.getUser()]);
  const profile = profiles?.[0]; if (!profile || !auth.user) return null;
  const db = supabase as any;
  const [{ data: actor }, { data: branches }, { data: calling }] = await Promise.all([
    db.from("users").select("branch_id").eq("id", auth.user.id).single(),
    db.from("branches").select("id,name").eq("active", true).order("name"),
    db.from("referral_calling").select("id,referral_id,status,call_response,remark,next_followup_date,created_at,referrals!inner(referral_name,referral_number,crm_name,branch_id,given_by_client_id)"),
  ]);
  const referralRows = calling ?? []; const clientIds = [...new Set(referralRows.map((row: any) => row.referrals.given_by_client_id))];
  const { data: clients } = clientIds.length ? await db.from("clients").select("client_id,primary_name,primary_phone").in("client_id", clientIds) : { data: [] };
  const clientById = new Map((clients ?? []).map((client: any) => [client.client_id, client])); const today = new Date().toISOString().slice(0, 10); const now = new Date().getTime();
  const items = referralRows.map((row: any) => { const referral = row.referrals; return { ...row, referral: { ...referral, given_by_client: clientById.get(referral.given_by_client_id) ?? null }, days_since_logged: Math.max(0, Math.floor((now - new Date(row.created_at).getTime()) / 86_400_000)), overdue: Boolean(row.next_followup_date && row.next_followup_date < today && !["closed", "converted"].includes(row.status)) }; }).sort((a: any, b: any) => Number(b.overdue) - Number(a.overdue) || (a.next_followup_date ?? "9999-12-31").localeCompare(b.next_followup_date ?? "9999-12-31"));
  return <main className="mx-auto max-w-7xl px-5 py-7"><div><p className="text-sm font-semibold uppercase tracking-wider text-amber-800">Referral pipeline</p><h1 className="mt-1 text-3xl font-semibold">Referral calling</h1><p className="mt-2 text-stone-600">Overdue open referrals appear first. Everyone can read; only the originating branch or a super admin can log calls.</p></div><div className="mt-6"><ReferralEntry role={profile.role} branchId={actor?.branch_id ?? null} branches={branches ?? []} /></div><ReferralQueue role={profile.role} branchId={actor?.branch_id ?? null} items={items} /></main>;
}
