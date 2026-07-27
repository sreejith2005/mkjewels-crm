"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { displayDate } from "@/lib/clients";
import { isDoneFollowup, queueTabMatches } from "@/lib/followup-logic";

export type ReferralItem = {
  id: string; status: string; next_followup_date: string | null; remark: string | null;
  converted_client_id: string | null; followup_count: number; crm_name: string;
  assigned_doer: string | null; given_by_client_id: string; given_by_name: string;
  referral_name: string; referral_number: string; salesperson: string; history: string;
  history_count: number; action_point: string | null;
};

const TABS = [["today", "TODAY FOLLOW UP"], ["pending", "ALL PENDING"], ["inprocess", "INPROCESS"], ["done", "ALL DONE"], ["converted", "CONVERTED TO CLIENT"]] as const;
const FOLLOW_UP_STATUSES = ["PENDING", "IN PROCESS", "FOLLOW UP DONE", "CONVERTED TO CLIENT"] as const;
const CALL_RESPONSES = ["CONNECTED", "CALL NOT PICKED", "NOT ANSWERED", "WRONG NUMBER", "WHATSAPP SENT"] as const;
type RpcClient = { rpc: (name: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }> };

function referralTabMatches(item: ReferralItem, tab: string, today: string) {
  if (tab === "today") return !isDoneFollowup(item.status) && (item.next_followup_date === null || item.next_followup_date === today);
  return queueTabMatches(item, tab, today, Boolean(item.converted_client_id));
}

export function ReferralQueue({ items, enteredByName }: { items: ReferralItem[]; role: string; branchId: string | null; enteredByName: string }) {
  const router = useRouter();
  const [tab, setTab] = useState("today"); const [crm, setCrm] = useState(""); const [search, setSearch] = useState("");
  const [open, setOpen] = useState<string | null>(null); const [message, setMessage] = useState(""); const [syncing, setSyncing] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const names = [...new Set(items.map((item) => item.assigned_doer || item.crm_name).filter(Boolean))] as string[];
  const visible = useMemo(() => items.filter((item) => {
    const text = `${item.referral_name} ${item.referral_number} ${item.given_by_name}`.toLowerCase();
    return (!crm || (item.assigned_doer || item.crm_name) === crm) && (!search || text.includes(search.toLowerCase())) && referralTabMatches(item, tab, today);
  }), [items, crm, search, tab, today]);

  async function sync() {
    setSyncing(true); setMessage("");
    const { data, error } = await (createClient() as unknown as RpcClient).rpc("reconcile_referral_calling_conversions");
    setSyncing(false);
    if (error) { setMessage(`Could not sync Referrals data: ${error.message}`); return; }
    setMessage(`Referrals data synced${typeof data === "number" ? `: ${data} conversion(s) detected.` : "."}`); router.refresh();
  }

  async function save(item: ReferralItem, form: HTMLFormElement) {
    const data = new FormData(form); const status = String(data.get("status")); const remark = String(data.get("remark")).trim();
    if (status !== "FOLLOW UP DONE" && status !== "CONVERTED TO CLIENT" && !remark) { setMessage("Follow Up Remark is required unless the follow-up is done."); return; }
    const { error } = await (createClient() as unknown as RpcClient).rpc("save_referral_followup", {
      p_referral_calling_id: item.id, p_followup_status: status, p_call_response: String(data.get("call_response")),
      p_next_followup_date: String(data.get("next_date")) || null, p_remark: remark || null, p_entered_by: String(data.get("entered_by")).trim() || null,
    });
    if (error) { setMessage(`Could not save this referral follow-up: ${error.message}`); return; }
    setOpen(null); setMessage("Referral follow-up saved."); router.refresh();
  }

  async function convert(item: ReferralItem) {
    if (!confirm(`Convert ${item.referral_name} to a client using this phone number?`)) return;
    const { data, error } = await (createClient() as unknown as RpcClient).rpc("convert_referral_to_client", { p_referral_calling_id: item.id });
    if (error) { setMessage(`Could not convert this referral: ${error.message}`); return; }
    router.push(`/clients/${data as string}`); router.refresh();
  }

  return <section className="mt-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-2xl font-semibold">Referral Calling Queue</h2><p className="mt-1 text-sm text-stone-600">Legacy-compatible referral calling and conversion checks.</p></div><div className="flex gap-2"><button className="rounded border px-3 py-2 text-sm" disabled={syncing} onClick={() => void sync()}>{syncing ? "SYNCING…" : "SYNC REFERRALS DATA"}</button><button className="rounded bg-amber-800 px-3 py-2 text-sm text-white" onClick={() => router.refresh()}>REFRESH</button></div></div>
    <div className="mt-5 flex flex-wrap gap-2">{TABS.map(([key, label]) => <button key={key} className={tab === key ? "rounded bg-amber-800 px-3 py-2 text-xs font-semibold text-white" : "rounded border px-3 py-2 text-xs font-semibold"} onClick={() => setTab(key)}>{label}</button>)}</div>
    <div className="mt-4 flex flex-wrap gap-3"><select aria-label="CRM/DOER" className="rounded border p-2 text-sm" value={crm} onChange={(event) => setCrm(event.target.value)}><option value="">CRM/DOER: ALL</option>{names.map((name) => <option key={name}>{name}</option>)}</select><input className="min-w-64 rounded border p-2 text-sm" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="SEARCH REFERRAL / PHONE / GIVEN-BY" /></div>
    {message && <p role="alert" className="mt-3 text-sm text-red-700">{message}</p>}
    <div className="mt-5 overflow-x-auto rounded border bg-white"><table className="w-full min-w-[1450px] text-left text-xs"><thead className="bg-stone-100 uppercase text-stone-600"><tr>{["CRM/DOER", "GIVEN BY CLIENT", "REFERRAL NAME", "REFERRAL NUMBER", "SALESPERSON", "STATUS", "NEXT FOLLOW UP", "LAST REMARK", "CONVERTED CLIENT", "ACTION"].map((label) => <th key={label} className="p-3">{label}</th>)}</tr></thead><tbody>
      {visible.map((item) => <tr className="border-t align-top" key={item.id}><td className="p-3 font-semibold">{item.assigned_doer || item.crm_name || "—"}</td><td className="p-3"><Link className="font-semibold text-amber-800 underline" href={`/clients/${item.given_by_client_id}`}>{item.given_by_name}</Link><div className="mt-1"><span className="rounded bg-stone-100 px-1">HIST: {item.history_count}</span></div></td><td className="p-3 font-semibold">{item.referral_name}</td><td className="p-3">{item.referral_number}</td><td className="p-3">{item.salesperson || "—"}</td><td className="p-3">{item.status}</td><td className="p-3">{displayDate(item.next_followup_date)}</td><td className="max-w-48 whitespace-pre-wrap p-3">{item.remark || "—"}</td><td className="p-3">{item.converted_client_id ? <Link className="text-amber-800 underline" href={`/clients/${item.converted_client_id}`}>OPEN CLIENT</Link> : "NO"}</td><td className="p-3"><div className="flex flex-col gap-1"><button className="rounded border px-2 py-1" onClick={() => setOpen(open === item.id ? null : item.id)}>FOLLOW UP FORM</button>{!item.converted_client_id && <button className="rounded border px-2 py-1" onClick={() => void convert(item)}>CONVERT TO CLIENT</button>}<button className="rounded border px-2 py-1" onClick={() => setOpen(open === `${item.id}:history` ? null : `${item.id}:history`)}>VIEW HISTORY</button></div>
        {open === item.id && <form className="mt-2 grid min-w-56 gap-2" onSubmit={(event) => { event.preventDefault(); void save(item, event.currentTarget); }}><label>Follow Up Status<select aria-label="Follow Up Status" name="status" defaultValue={FOLLOW_UP_STATUSES.includes(item.status as typeof FOLLOW_UP_STATUSES[number]) ? item.status : "PENDING"} required className="mt-1 w-full rounded border p-1">{FOLLOW_UP_STATUSES.map((status) => <option key={status}>{status}</option>)}</select></label><label>Call Response<select aria-label="Call Response" name="call_response" defaultValue="CONNECTED" required className="mt-1 w-full rounded border p-1">{CALL_RESPONSES.map((response) => <option key={response}>{response}</option>)}</select></label><label>Next Follow Up Date<input aria-label="Next Follow Up Date" name="next_date" type="date" defaultValue={item.next_followup_date ?? today} className="mt-1 w-full rounded border p-1" /></label><label>Entered By<input aria-label="Entered By" name="entered_by" defaultValue={enteredByName} className="mt-1 w-full rounded border p-1" /></label><label>Follow Up Remark<textarea aria-label="Follow Up Remark" name="remark" defaultValue={item.remark ?? ""} maxLength={2000} className="mt-1 w-full rounded border p-1" /></label><div className="rounded bg-stone-50 p-2 text-xs"><span className="font-semibold">Action Point: </span>{item.action_point || "—"}</div><button className="rounded bg-amber-800 p-1 text-white">Save</button></form>}
        {open === `${item.id}:history` && <p className="mt-2 max-w-48 whitespace-pre-wrap">{item.history || "No logged history."}</p>}</td></tr>)}
      {!visible.length && <tr><td colSpan={10} className="p-5 text-sm text-stone-600">No referrals match this view.</td></tr>}
    </tbody></table></div>
  </section>;
}
