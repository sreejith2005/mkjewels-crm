import Link from "next/link";
import { displayDate } from "@/lib/clients";
import {
  POTENTIAL_CATEGORIES,
  potentialStars,
  type PotentialCategory,
} from "@/lib/client-potential";

export type ClientDatabaseRow = {
  client_id: string;
  primary_name: string;
  primary_phone: string;
  city: string | null;
  state: string | null;
  total_visits: number;
  last_visit_date: string | null;
  last_buy_status: string | null;
  client_potential_category: string | null;
};

export function ClientDatabase({
  clients,
  search,
  potentialCategory,
  page,
  hasMore,
}: {
  clients: ClientDatabaseRow[];
  search: string;
  potentialCategory: PotentialCategory | "";
  page: number;
  hasMore: boolean;
}) {
  const params = (nextPage: number) =>
    `/clients?${new URLSearchParams({
      ...(search ? { search } : {}),
      ...(potentialCategory ? { potential: potentialCategory } : {}),
      ...(nextPage > 1 ? { page: String(nextPage) } : {}),
    }).toString()}`;

  return (
    <main className="mx-auto max-w-7xl px-5 py-7">
      <h1 className="text-3xl font-semibold">Client database</h1>
      <p className="mt-2 text-sm text-stone-600">
        Client data is always live and instant; no sync step is needed.
      </p>
      <form className="mt-5 flex flex-wrap gap-2" action="/clients">
        <label className="sr-only" htmlFor="client-database-search">Search clients</label>
        <input id="client-database-search" className="w-full max-w-xl rounded border p-2" name="search" defaultValue={search} placeholder="Search name or any phone number" />
        <label className="sr-only" htmlFor="client-potential-filter">Potential category</label>
        <select id="client-potential-filter" className="rounded border p-2" name="potential" defaultValue={potentialCategory}>
          <option value="">All potential categories</option>
          {POTENTIAL_CATEGORIES.map((category) => <option value={category} key={category}>{category} {potentialStars(category)}</option>)}
        </select>
        <button className="rounded border px-4 py-2" type="submit">Search</button>
      </form>
      <section className="mt-6 overflow-x-auto rounded border bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b bg-stone-50 text-xs uppercase text-stone-600"><tr><th className="p-3">Client ID</th><th className="p-3">Name</th><th className="p-3">Phone</th><th className="p-3">Potential</th><th className="p-3">City</th><th className="p-3">State</th><th className="p-3">Total visits</th><th className="p-3">Last visit date</th><th className="p-3">Last status</th><th className="p-3">Actions</th></tr></thead>
          <tbody>
            {clients.map((client) => <tr className="border-b" key={client.client_id}><td className="p-3 font-mono text-xs">{client.client_id}</td><td className="p-3 font-medium">{client.primary_name}</td><td className="p-3">{client.primary_phone}</td><td className="p-3">{client.client_potential_category ?? "—"}{potentialStars(client.client_potential_category) ? ` ${potentialStars(client.client_potential_category)}` : ""}</td><td className="p-3">{client.city ?? "—"}</td><td className="p-3">{client.state ?? "—"}</td><td className="p-3">{client.total_visits}</td><td className="p-3">{displayDate(client.last_visit_date)}</td><td className="p-3">{client.last_buy_status ?? "—"}</td><td className="p-3 whitespace-nowrap"><Link className="mr-3 underline" href={`/clients/${client.client_id}`}>View Client Profile</Link><Link className="underline" href={`/visits/new?client=${client.client_id}`}>Make Walk-in Entry</Link></td></tr>)}
            {clients.length === 0 ? <tr><td className="p-5 text-stone-600" colSpan={10}>No clients match this search.</td></tr> : null}
          </tbody>
        </table>
      </section>
      <div className="mt-4 flex gap-3"><Link className={page <= 1 ? "pointer-events-none text-stone-400" : "underline"} href={params(page - 1)}>Previous</Link>{hasMore ? <Link className="underline" href={params(page + 1)}>Next</Link> : null}</div>
    </main>
  );
}
