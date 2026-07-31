import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(_: Request, { params }: { params: Promise<{ leadId: string }> }) {
  const db = await createClient(); const { leadId } = await params;
  const [{ data: auth }, { data: lead }, { data: fields }, { data: profile }] = await Promise.all([db.auth.getUser(), db.from("leads").select("id,phone_number,name,field_values,created_by").eq("id", leadId).single(), db.from("lead_form_fields").select("field_key,runo_field_name").eq("is_runo_synced", true), db.rpc("get_my_profile")]);
  if (!auth.user || !lead || (lead.created_by !== auth.user.id && profile?.[0]?.role !== "super_admin")) return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  const key = process.env.RUNO_API_KEY;
  if (!key) { await db.from("leads").update({ runo_pushed: false, runo_push_error: "RUNO_API_KEY is not configured" }).eq("id", leadId); return NextResponse.json({ error: "Runo is not configured" }, { status: 503 }); }
  const fieldValues = lead.field_values as Record<string, unknown>;
  const userFields = (fields ?? []).flatMap((field) => { const value = field.field_key === "mobile_no" ? lead.phone_number : field.field_key === "name" ? lead.name : fieldValues[field.field_key]; return field.runo_field_name && value !== null && value !== undefined && String(value).trim() ? [{ name: field.runo_field_name, value: String(value) }] : []; });
  try { const response = await fetch("https://api.runo.in/v1/crm/allocation", { method: "POST", headers: { "Auth-Key": key, "Content-Type": "application/json" }, body: JSON.stringify({ customer: { name: lead.name ?? "", phoneNumber: `+91${lead.phone_number}` }, userFields }) }); const payload: unknown = await response.json().catch(() => null); if (!response.ok) { await db.from("leads").update({ runo_pushed: false, runo_push_error: `Runo request failed (${response.status})` }).eq("id", leadId); return NextResponse.json({ error: "Runo request failed" }, { status: 502 }); } const customerId = payload && typeof payload === "object" && "id" in payload && typeof payload.id === "string" ? payload.id : null; await db.from("leads").update({ runo_pushed: true, runo_push_error: null, runo_customer_id: customerId }).eq("id", leadId); return NextResponse.json({ ok: true }); } catch { await db.from("leads").update({ runo_pushed: false, runo_push_error: "Runo network request failed" }).eq("id", leadId); return NextResponse.json({ error: "Runo network request failed" }, { status: 502 }); }
}
