"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { displayDate } from "@/lib/clients";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";

type Result = Database["public"]["Functions"]["search_clients"]["Returns"][number];

export function ClientSearch() {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const canSearch = term.trim().length >= 3 || term.replace(/\D/g, "").length >= 3;

  useEffect(() => {
    if (!canSearch) return;

    let cancelled = false;
    const value = term.trim();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      const { data } = await createClient().rpc("search_clients", {
        search_text: value,
        result_limit: 8,
      });
      if (!cancelled) {
        setResults(data ?? []);
        setLoading(false);
      }
    }, 220);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [canSearch, term]);

  return (
    <div className="relative w-full max-w-xl">
      <label className="sr-only" htmlFor="global-client-search">Search client</label>
      <input id="global-client-search" className="w-full rounded-lg border border-stone-300 bg-white px-4 py-2" value={term} onChange={(event) => setTerm(event.target.value)} placeholder="Search by phone or client name" />
      {canSearch ? <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-stone-200 bg-white shadow-lg">
        {loading ? <p className="p-3 text-sm text-stone-500">Searching…</p> : null}
        {!loading ? results.map((result) => <Link className="block border-b border-stone-100 px-4 py-3 hover:bg-amber-50" href={`/clients/${result.client_id}`} key={result.client_id}><b>{result.primary_name}</b><span className="ml-2 text-sm text-stone-600">{result.matched_phone ?? result.primary_phone}</span><span className="float-right text-xs text-stone-500">Last visit {displayDate(result.last_visit_date)}</span></Link>) : null}
        {!loading && results.length === 0 ? <p className="p-3 text-sm">No client found — <Link className="font-semibold text-amber-800 underline" href={`/clients/new?phone=${encodeURIComponent(term)}`}>create new?</Link></p> : null}
      </div> : null}
    </div>
  );
}
