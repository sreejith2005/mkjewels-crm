import Link from "next/link";

import { ExistingClientWalkinAction } from "@/components/existing-client-walkin-action";
import { displayDate } from "@/lib/clients";

export type ClientDatabaseRow = {
  client_id: string;
  primary_name: string;
  primary_phone: string;
  city: string | null;
  state: string | null;
  total_visits: number;
  last_visit_date: string | null;
  last_buy_status: string | null;
};

export function ClientDatabase({
  clients,
  search,
  walkinContext,
}: {
  clients: ClientDatabaseRow[];
  search: string;
  walkinContext: { role: string; branchId: string | null; branches: { id: string; name: string }[] };
}) {
  return (
    <main className="mx-auto max-w-7xl px-5 py-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Client database</h1>
          <p className="mt-2 text-sm text-stone-600">Client data is always live and instant; no sync step is needed.</p>
        </div>
        <Link className="rounded bg-amber-800 px-4 py-2 font-medium text-white" href="/queue">Register Client</Link>
      </div>
      <form className="mt-5 flex flex-wrap gap-2" action="/clients">
        <label className="sr-only" htmlFor="client-database-search">Search clients</label>
        <input id="client-database-search" className="w-full max-w-xl rounded border p-2" name="search" defaultValue={search} placeholder="Search by primary phone / secondary phone / billing phone / other phones / client name" />
        <button className="rounded border px-4 py-2" type="submit">Search</button>
      </form>
      <section className="mt-6 overflow-x-auto rounded border bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b bg-stone-50 text-xs uppercase text-stone-600"><tr><th className="p-3">Client ID</th><th className="p-3">Name</th><th className="p-3">Phone</th><th className="p-3">City</th><th className="p-3">State</th><th className="p-3">Total visits</th><th className="p-3">Last visit</th><th className="p-3">Last status</th><th className="p-3">Action</th></tr></thead>
          <tbody>
            {clients.map((client) => <tr className="border-b" key={client.client_id}><td className="p-3 font-mono text-xs">{client.client_id}</td><td className="p-3 font-medium">{client.primary_name}</td><td className="p-3">{client.primary_phone}</td><td className="p-3">{client.city ?? "—"}</td><td className="p-3">{client.state ?? "—"}</td><td className="p-3">{client.total_visits}</td><td className="p-3">{displayDate(client.last_visit_date)}</td><td className="p-3">{client.last_buy_status ?? "—"}</td><td className="p-3 whitespace-nowrap"><Link className="mr-3 underline" href={`/clients/${client.client_id}`}>View Client Profile</Link><ExistingClientWalkinAction clientId={client.client_id} primaryName={client.primary_name} primaryPhone={client.primary_phone} {...walkinContext} /></td></tr>)}
            {clients.length === 0 ? <tr><td className="p-5 text-stone-600" colSpan={9}>No clients match this search.</td></tr> : null}
          </tbody>
        </table>
      </section>
    </main>
  );
}
