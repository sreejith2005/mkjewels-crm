"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function DashboardFilter({ start, end, preset }: { start: string; end: string; preset: string }) {
  const router = useRouter(); const searchParams = useSearchParams(); const [customStart, setCustomStart] = useState(start); const [customEnd, setCustomEnd] = useState(end);
  function select(next: string) { const params = new URLSearchParams(searchParams); params.set("preset", next); if (next !== "custom") { params.delete("start"); params.delete("end"); } router.push(`/dashboard?${params}`); }
  function applyCustom() { if (customStart && customEnd && customStart <= customEnd) router.push(`/dashboard?preset=custom&start=${customStart}&end=${customEnd}`); }
  return <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-white p-3"><label className="text-sm font-medium">Range<select aria-label="Date range" className="ml-2 rounded border p-2" value={preset} onChange={(event) => select(event.target.value)}><option value="today">Today</option><option value="yesterday">Yesterday</option><option value="week">This week</option><option value="month">This month</option><option value="custom">Custom</option></select></label>{preset === "custom" ? <><label className="text-xs font-medium">From<input aria-label="Custom start date" className="mt-1 block rounded border p-2 text-sm" type="date" value={customStart} onChange={(event) => setCustomStart(event.target.value)} /></label><label className="text-xs font-medium">To<input aria-label="Custom end date" className="mt-1 block rounded border p-2 text-sm" type="date" value={customEnd} onChange={(event) => setCustomEnd(event.target.value)} /></label><button type="button" className="rounded bg-amber-800 px-3 py-2 text-sm font-medium text-white" onClick={applyCustom}>Apply</button></> : null}</div>;
}
