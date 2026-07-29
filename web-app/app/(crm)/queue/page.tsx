import { EntryQueue } from "@/components/entry-queue";
import { availableCrmNames } from "@/lib/available-crm-names";
import { kolkataDateKey } from "@/lib/business-date";
import { rosterNames } from "@/lib/roster";
import { queueMatchesLegacyScope } from "@/lib/queue-visibility";
import { createClient } from "@/lib/supabase/server";

export default async function QueuePage({ searchParams }: { searchParams: Promise<{ branch?: string; crm?: string; completed?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const [{ data: profileRows }, { data: auth }] = await Promise.all([supabase.rpc("get_my_profile"), supabase.auth.getUser()]);
  const profile = profileRows?.[0];
  if (!profile || !auth.user) return null;
  const [{ data: user }, { data: branches }] = await Promise.all([supabase.from("users").select("branch_id").eq("id", auth.user.id).single(), supabase.from("branches").select("id,name").eq("active", true).order("name")]);
  const activeBranches = branches ?? [];
  const selectedBranchId = profile.role === "super_admin" && activeBranches.some((branch) => branch.id === params.branch) ? params.branch! : user?.branch_id ?? activeBranches[0]?.id ?? "";
  const today = kolkataDateKey();
  const [{ data: allocation }, { data: availability }] = selectedBranchId ? await Promise.all([supabase.from("crm_allocation").select("crm_name").eq("branch_id", selectedBranchId).eq("active", true).order("created_at"), supabase.from("crm_daily_availability").select("crm_name,is_available").eq("branch_id", selectedBranchId).eq("date", today)]) : [{ data: [] }, { data: [] }];
  const queueCrms = rosterNames(allocation ?? []);
  const selectedCrm = queueCrms.includes(params.crm ?? "") ? params.crm! : "";
  const queue = selectedBranchId ? await (selectedCrm ? supabase.from("entry_queue").select("id,token,client_name,mobile,assigned_crm_name,status,created_at,client_id,branch_id").eq("branch_id", selectedBranchId).eq("assigned_crm_name", selectedCrm).order("created_at", { ascending: false }) : supabase.from("entry_queue").select("id,token,client_name,mobile,assigned_crm_name,status,created_at,client_id,branch_id").eq("branch_id", selectedBranchId).order("created_at", { ascending: false })) : { data: [] };
  const activeItems = (queue.data ?? []).filter((item) => queueMatchesLegacyScope(item, selectedBranchId, selectedCrm));
  const completedItems = (queue.data ?? []).filter((item) => item.branch_id === selectedBranchId && item.status === "complete" && (!selectedCrm || item.assigned_crm_name === selectedCrm));
  return <main className="mx-auto max-w-7xl px-5 py-7"><div><p className="text-sm font-semibold uppercase tracking-wider text-amber-800">Front desk</p><h1 className="mt-1 text-3xl font-semibold">Client walk-in form</h1></div><EntryQueue key={`${selectedBranchId}-${selectedCrm}`} profile={{ role: profile.role, branchId: user?.branch_id ?? null }} selectedBranchId={selectedBranchId} selectedCrm={selectedCrm} branches={activeBranches} crms={availableCrmNames(allocation ?? [], availability ?? [])} queueCrms={queueCrms} initialItems={[...activeItems, ...completedItems]} completedName={params.completed} /></main>;
}
