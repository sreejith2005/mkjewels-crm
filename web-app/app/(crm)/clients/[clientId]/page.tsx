import { notFound } from "next/navigation";

import { ClientProfile } from "@/components/client-profile";
import { createClient } from "@/lib/supabase/server";

export default async function ClientPage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params;
  const supabase = await createClient();
  const db = supabase as unknown as { from: (table: string) => ReturnType<typeof supabase.from> };
  const [
    clientResult,
    timelineResult,
    auditResult,
    beveragesResult,
    snacksResult,
    sugarsResult,
    communitiesResult,
    giftsResult,
  ] = await Promise.all([
    supabase.from("clients").select("*").eq("client_id", clientId).single(),
    supabase.from("client_timeline").select("id,event_date,event_type,buy_status,crm_name,remark,branch_id,salesperson_id,seen_categories,bought_categories").eq("client_id", clientId).order("event_date", { ascending: false }),
    supabase.from("client_edit_log").select("id,field_name,old_value,new_value,created_at,edited_by").eq("client_id", clientId).order("created_at", { ascending: false }),
    supabase.from("lookup_beverages").select("label").eq("active", true).order("label"),
    supabase.from("lookup_snacks").select("label").eq("active", true).order("label"),
    db.from("lookup_sugar_options").select("label").eq("active", true).order("label"),
    supabase.from("lookup_communities").select("label").eq("active", true).order("label"),
    supabase.from("lookup_gifts").select("label").eq("active", true).order("label"),
  ]);

  if (clientResult.error || !clientResult.data) notFound();

  const branchIds = [...new Set([clientResult.data.last_branch_id, ...(timelineResult.data ?? []).map((item) => item.branch_id)].filter(Boolean))] as string[];
  const editorIds = [...new Set((auditResult.data ?? []).map((item) => item.edited_by).filter(Boolean))] as string[];
  const salespersonIds = [...new Set((timelineResult.data ?? []).map((item) => item.salesperson_id).filter(Boolean))] as string[];
  const [{ data: branches }, { data: users }] = await Promise.all([
    branchIds.length ? supabase.from("branches").select("id,name").in("id", branchIds) : Promise.resolve({ data: [] }),
    [...editorIds, ...salespersonIds].length ? supabase.from("users").select("id,name").in("id", [...new Set([...editorIds, ...salespersonIds])]) : Promise.resolve({ data: [] }),
  ]);
  const branchNames = new Map((branches ?? []).map((item) => [item.id, item.name]));
  const userNames = new Map((users ?? []).map((item) => [item.id, item.name]));

  return <ClientProfile
    client={clientResult.data}
    timeline={(timelineResult.data ?? []).map((item) => ({ ...item, branch: branchNames.get(item.branch_id) ?? null, salesperson: item.salesperson_id ? userNames.get(item.salesperson_id) ?? null : null }))}
    audit={(auditResult.data ?? []).map((item) => ({ ...item, editor: item.edited_by ? userNames.get(item.edited_by) ?? null : null }))}
    lookups={{
      beverages: (beveragesResult.data ?? []).map((item) => item.label),
      snacks: (snacksResult.data ?? []).map((item) => item.label),
      sugars: (sugarsResult.data ?? []).map((item: { label: string }) => item.label),
      communities: (communitiesResult.data ?? []).map((item) => item.label),
      gifts: (giftsResult.data ?? []).map((item) => item.label),
    }}
  />;
}
