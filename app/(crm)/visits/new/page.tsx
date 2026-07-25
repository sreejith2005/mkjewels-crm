import { WalkInForm } from "@/components/walk-in-form";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function NewVisitPage({ searchParams }: { searchParams: Promise<{ queue?: string }> }) {
  const params = await searchParams; const supabase = await createClient(); const [{ data: profileRows }, { data: auth }] = await Promise.all([supabase.rpc("get_my_profile"), supabase.auth.getUser()]); const profile = profileRows?.[0]; if (!profile || !auth.user) return null;
  if (!params.queue) redirect("/queue");
  const [{ data: user }, { data: branches }, queueResult] = await Promise.all([supabase.from("users").select("branch_id,name").eq("id", auth.user.id).single(), supabase.from("branches").select("id,name").eq("active", true).order("name"), params.queue ? supabase.from("entry_queue").select("id,client_name,mobile,branch_id,assigned_crm_name,client_id,status").eq("id", params.queue).single() : Promise.resolve({ data: null })]);
  if (!queueResult.data || queueResult.data.status === "complete") redirect("/queue");
  const selectedClientId = queueResult.data.client_id;
  const { data: client } = selectedClientId ? await supabase.from("clients").select("*").eq("client_id", selectedClientId).single() : { data: null };
  const branchId = queueResult.data?.branch_id ?? user?.branch_id ?? "";
  const [{ data: allocation }, { data: productCategories }, { data: notBoughtReasons }, { data: beverages }, { data: snacks }] = await Promise.all([branchId ? supabase.from("crm_allocation").select("crm_name").eq("branch_id", branchId).eq("active", true).order("crm_name") : Promise.resolve({ data: [] }), supabase.from("lookup_product_categories").select("label").eq("active", true).order("label"), supabase.from("lookup_not_bought_reasons").select("label").eq("active", true).order("label"), supabase.from("lookup_beverages").select("label").eq("active", true).order("label"), supabase.from("lookup_snacks").select("label").eq("active", true).order("label")]);
  return <main className="mx-auto max-w-7xl px-5 py-7"><p className="text-sm font-semibold uppercase tracking-wider text-amber-800">Visit intake</p><h1 className="mt-1 text-3xl font-semibold">Walk-in visit form</h1><p className="mt-2 text-stone-600">Nothing is saved until the completed visit is submitted.</p><WalkInForm profile={{ role: profile.role, branchId: user?.branch_id ?? null, name: user?.name ?? "" }} branches={branches ?? []} crms={(allocation ?? []).map((item) => item.crm_name)} queue={queueResult.data} client={client} lookups={{ productCategories: (productCategories ?? []).map((item) => item.label), notBoughtReasons: (notBoughtReasons ?? []).map((item) => item.label), beverages: (beverages ?? []).map((item) => item.label), snacks: (snacks ?? []).map((item) => item.label) }} /></main>;
}
