"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { lookupClientByPhone } from "@/lib/client-phone-lookup";
import { phoneDigits } from "@/lib/clients";
import { createClient } from "@/lib/supabase/client";

type Item = { id: string; token: string; client_name: string; mobile: string; assigned_crm_name: string | null; status: string; created_at: string; client_id: string | null };

export function EntryQueue({ profile, selectedBranchId, branches, crms, initialItems, completedName }: { profile: { role: string; branchId: string | null }; selectedBranchId: string; branches: { id: string; name: string }[]; crms: string[]; initialItems: Item[]; completedName?: string }) {
  const router = useRouter();
  const queueRef = useRef<HTMLElement>(null);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [branch, setBranch] = useState(selectedBranchId);
  const [queueCrm, setQueueCrm] = useState("");
  const [message, setMessage] = useState("");
  const [autoFilled, setAutoFilled] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (phoneDigits(mobile).length !== 10) return;
    const timer = window.setTimeout(() => {
      void lookupClientByPhone(mobile).then((client) => {
        if (!client) { setAutoFilled(false); return; }
        setName(client.primary_name);
        setAutoFilled(true);
      });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [mobile]);

  function openQueue() {
    if (typeof queueRef.current?.scrollIntoView === "function") queueRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim() || phoneDigits(mobile).length !== 10 || !branch) {
      setMessage("Name, 10-digit mobile, and branch are required.");
      return;
    }
    setSaving(true);
    const { data, error } = await createClient().rpc("create_entry_queue", {
      p_client_name: name,
      p_mobile: mobile,
      p_branch_id: branch,
    });
    setSaving(false);
    if (error || !data?.[0]) {
      setMessage("Could not register the queue entry. Check the selected branch.");
      return;
    }
    setMessage(`Client registered: token ${data[0].token} (${data[0].client_type} client).`);
    router.refresh();
    window.setTimeout(openQueue, 0);
  }

  function loadQueue() {
    const params = new URLSearchParams();
    if (branch) params.set("branch", branch);
    router.push(`/queue${params.size ? `?${params}` : ""}`);
    window.setTimeout(openQueue, 0);
  }

  const visibleItems = queueCrm ? initialItems.filter((item) => item.assigned_crm_name === queueCrm) : initialItems;
  const branchSelect = (id: string, onChange: (value: string) => void, label: string) => <label className="block text-sm"><span>{label}</span><select aria-label={label} className="mt-1 w-full rounded border border-stone-300 bg-white p-2" value={id} disabled={profile.role !== "super_admin"} onChange={(event) => onChange(event.target.value)}>{!id ? <option value="">Choose branch</option> : null}{branches.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>;

  return <div className="mt-6 space-y-8">
    <section className="rounded-xl border bg-white p-5" aria-labelledby="register-client-entry">
      <h2 id="register-client-entry" className="text-lg font-semibold">Register Client Entry</h2>
      <form onSubmit={submit} className="mt-4 grid gap-4 md:grid-cols-3">
        {branchSelect(branch, setBranch, "Branch")}
        <label className="block text-sm"><span>Client Name</span><input className={`mt-1 w-full rounded border p-2 ${autoFilled ? "border-amber-400 bg-amber-50" : "border-stone-300 bg-white"}`} value={name} onChange={(event) => { setName(event.target.value); setAutoFilled(false); }} />{autoFilled ? <small className="mt-1 block text-amber-800">Auto-filled from client history — editable</small> : null}</label>
        <label className="block text-sm"><span>Mobile Number</span><div className="mt-1 flex rounded border border-stone-300 bg-white"><span className="border-r border-stone-300 px-3 py-2 text-stone-600">+91</span><input aria-label="Mobile Number" className="min-w-0 flex-1 rounded-r p-2" inputMode="numeric" value={mobile} onChange={(event) => { setMobile(event.target.value); setAutoFilled(false); }} onBlur={() => { if (phoneDigits(mobile).length === 10) void lookupClientByPhone(mobile).then((client) => { if (client) { setName(client.primary_name); setAutoFilled(true); } }); }} /></div></label>
        <div className="flex flex-wrap items-end gap-3 md:col-span-3"><button disabled={saving} className="rounded bg-amber-800 px-4 py-2 font-medium text-white disabled:opacity-50">{saving ? "Registering…" : "Register Client"}</button><button type="button" onClick={openQueue} className="rounded border border-stone-300 px-4 py-2 font-medium">Open CRM Queue</button>{message ? <p role="status" className="text-sm text-green-800">{message}</p> : null}</div>
      </form>
    </section>

    <section ref={queueRef} className="overflow-hidden rounded-xl border bg-white" aria-labelledby="crm-queue">
      <div className="border-b p-5"><h2 id="crm-queue" className="text-lg font-semibold">CRM Queue</h2><div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"><div>{branchSelect(branch, setBranch, "Queue branch")}</div><label className="block text-sm">CRM / salesperson<select className="mt-1 w-full rounded border border-stone-300 bg-white p-2" value={queueCrm} onChange={(event) => setQueueCrm(event.target.value)}><option value="">All available CRM staff</option>{crms.map((item) => <option value={item} key={item}>{item}</option>)}</select></label><button type="button" onClick={loadQueue} className="self-end rounded bg-stone-800 px-4 py-2 text-sm font-medium text-white">Load Queue</button></div><p className="mt-3 text-sm text-stone-600">{crms.length ? `CRM present today: ${crms.join(", ")}` : "No active CRM is available for this branch today."}</p>{completedName ? <p role="status" className="mt-3 text-sm font-medium text-green-800">Visit logged for {completedName}. The queue entry is complete.</p> : null}</div>
      {visibleItems.length ? <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm"><thead className="bg-stone-50 text-stone-600"><tr><th className="p-4">Token</th><th className="p-4">Client</th><th className="p-4">CRM</th><th className="p-4">Status</th><th className="p-4">Action</th></tr></thead><tbody>{visibleItems.map((item) => <tr key={item.id} className="border-t"><td className="p-4 font-medium">{item.token}</td><td className="p-4">{item.client_name}<br /><span className="text-stone-500">+91 {item.mobile}</span></td><td className="p-4">{item.assigned_crm_name ?? "Unassigned"}</td><td className="p-4"><span className={`crm-status ${item.status === "complete" ? "crm-status--done" : ""}`}>{item.status === "complete" ? "Done" : item.status}</span></td><td className="p-4">{item.status === "complete" ? <span className="crm-status crm-status--done">Done</span> : <Link className="font-medium text-amber-800 underline" href={`/visits/new?queue=${item.id}`}>Make Walk-in Entry</Link>}</td></tr>)}</tbody></table></div> : <p className="p-5 text-sm text-stone-600">No entries match this queue filter today.</p>}
    </section>
  </div>;
}
