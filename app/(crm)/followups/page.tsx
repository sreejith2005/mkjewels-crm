import { FollowupQueue } from "@/components/followup-queue";
import { createClient } from "@/lib/supabase/server";

export default async function FollowupsPage({ searchParams }: { searchParams: Promise<{ branch?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const [{ data: profileRows }, { data: auth }] = await Promise.all([supabase.rpc("get_my_profile"), supabase.auth.getUser()]);
  const profile = profileRows?.[0];
  if (!profile || !auth.user) return null;
  const [{ data: actor }, { data: branches }] = await Promise.all([
    supabase.from("users").select("branch_id").eq("id", auth.user.id).single(),
    supabase.from("branches").select("id,name").eq("active", true).order("name"),
  ]);
  const activeBranches = branches ?? [];
  const requestedBranch = profile.role === "super_admin" && params.branch && activeBranches.some((branch) => branch.id === params.branch) ? params.branch : undefined;
  const branchId = profile.role === "super_admin" ? requestedBranch ?? null : actor?.branch_id ?? null;
  let followupQuery = supabase.from("not_bought_followups").select("id,client_id,reference_number,status,next_followup_date,call_response,remark,branch_id,source_timeline_id,source_visit_form_id,created_at");
  if (branchId) followupQuery = followupQuery.eq("branch_id", branchId);
  const { data: followups } = await followupQuery;
  const clientIds = [...new Set((followups ?? []).map((item) => item.client_id))];
  const branchIds = [...new Set((followups ?? []).map((item) => item.branch_id).filter(Boolean))] as string[];
  const timelineIds = [...new Set((followups ?? []).map((item) => item.source_timeline_id).filter(Boolean))] as string[];
  const [{ data: clients }, { data: originBranches }, { data: sourceTimelines }] = await Promise.all([
    clientIds.length ? supabase.from("clients").select("client_id,primary_name,primary_phone").in("client_id", clientIds) : Promise.resolve({ data: [] }),
    branchIds.length ? supabase.from("branches").select("id,name").in("id", branchIds) : Promise.resolve({ data: [] }),
    timelineIds.length ? supabase.from("client_timeline").select("id,event_date").in("id", timelineIds) : Promise.resolve({ data: [] }),
  ]);
  const clientById = new Map((clients ?? []).map((client) => [client.client_id, client]));
  const branchById = new Map((originBranches ?? []).map((branch) => [branch.id, branch.name]));
  const eventDateByTimelineId = new Map((sourceTimelines ?? []).map((timeline) => [timeline.id, timeline.event_date]));
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date().getTime();
  const items = (followups ?? []).map((followup) => { const sourceVisitDate = followup.source_timeline_id ? eventDateByTimelineId.get(followup.source_timeline_id) ?? followup.created_at : followup.created_at; return { ...followup, client: clientById.get(followup.client_id), branch_name: followup.branch_id ? branchById.get(followup.branch_id) ?? "Unknown branch" : "Legacy follow-up", days_since_visit: Math.max(0, Math.floor((now - new Date(sourceVisitDate).getTime()) / 86_400_000)), overdue: Boolean(followup.next_followup_date && followup.next_followup_date < today && !["closed", "converted"].includes(followup.status)) }; }).sort((a, b) => Number(b.overdue) - Number(a.overdue) || (a.next_followup_date ?? "9999-12-31").localeCompare(b.next_followup_date ?? "9999-12-31"));
  return <FollowupQueue role={profile.role} branchId={actor?.branch_id ?? null} selectedBranchId={branchId} branches={activeBranches} items={items} />;
}
