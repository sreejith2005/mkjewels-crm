import { ClientDatabase, type ClientDatabaseRow } from "@/components/client-database";
import { createClient } from "@/lib/supabase/server";

type ClientBrowser = {
  rpc(name: string, args: Record<string, string | number | null>): Promise<{ data: unknown }>;
};

export default async function ClientsPage({ searchParams }: { searchParams: Promise<{ search?: string }> }) {
  const params = await searchParams;
  const search = params.search?.trim() ?? "";
  const supabase = await createClient();
  const [{ data }, { data: profileRows }, { data: auth }, { data: branches }] = await Promise.all([
    (supabase as unknown as ClientBrowser).rpc("browse_clients", { search_text: search || null, potential_category: null, page_offset: 0, result_limit: 200 }),
    supabase.rpc("get_my_profile"),
    supabase.auth.getUser(),
    supabase.from("branches").select("id,name").eq("active", true).order("name"),
  ]);
  const profile = profileRows?.[0];
  const { data: user } = auth.user
    ? await supabase.from("users").select("branch_id").eq("id", auth.user.id).single()
    : { data: null };
  const rows = Array.isArray(data) ? data as ClientDatabaseRow[] : [];

  return <ClientDatabase clients={rows} search={search} walkinContext={{ role: profile?.role ?? "", branchId: user?.branch_id ?? null, branches: branches ?? [] }} />;
}
