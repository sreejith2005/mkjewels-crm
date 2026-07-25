import { ClientDatabase, type ClientDatabaseRow } from "@/components/client-database";
import { createClient } from "@/lib/supabase/server";
const PAGE_SIZE = 50;
type ClientBrowser = { rpc(name: string, args: Record<string, string | number | null>): Promise<{ data: unknown }> };
export default async function ClientsPage({ searchParams }: { searchParams: Promise<{ search?: string; page?: string }> }) { const params = await searchParams; const search = params.search?.trim() ?? ""; const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1); const { data } = await (await createClient() as unknown as ClientBrowser).rpc("browse_clients", { search_text: search || null, page_offset: (page - 1) * PAGE_SIZE, result_limit: PAGE_SIZE + 1 }); const rows = Array.isArray(data) ? data as ClientDatabaseRow[] : []; return <ClientDatabase clients={rows.slice(0, PAGE_SIZE)} search={search} page={page} hasMore={rows.length > PAGE_SIZE} />; }
