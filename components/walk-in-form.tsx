"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { phoneDigits } from "@/lib/clients";
import { isPotentialCategory, POTENTIAL_CATEGORIES } from "@/lib/client-potential";
import { createClient } from "@/lib/supabase/client";
import { lookupClientByPhone } from "@/lib/client-phone-lookup";
import type { Client } from "@/lib/supabase/app-types";

type Queue = {
  id: string;
  client_name: string;
  mobile: string;
  branch_id: string;
  assigned_crm_name: string | null;
  client_id: string | null;
  status: string;
} | null;
type Companion = { name: string; mobile: string; relation: string };
type Proof = {
  path: string;
  fileName: string;
  mimeType: string;
  status: "uploading" | "ready" | "error";
  error?: string;
};
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const inputClass = "mt-1 w-full rounded border border-stone-300 bg-white p-2";
const sections = [
  "Client & visit",
  "Profile",
  "Companions",
  "Purchase outcome",
  "Engagement asks",
  "Preferences & planning",
] as const;
const LEGACY_VISIT_STATUSES = [
  "YES", "NO", "REPAIR_PLACED", "REPAIR_PICKUP", "ORDER_PLACED",
  "ORDER_PICKUP", "PRODUCT_EXCHANGE", "PRODUCT_RETURN", "STORE_VISIT", "PRICE_CALCULATION",
];
function istDateTimeLocal(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}T${value("hour")}:${value("minute")}`;
}
function initialValue(
  client: Client | null,
  queue: Queue,
  branchId: string,
  crmName: string,
) {
  return {
    client_id: client?.client_id ?? queue?.client_id ?? "",
    entry_queue_id: queue?.id ?? "",
    event_date: istDateTimeLocal(),
    branch_id: queue?.branch_id ?? branchId,
    crm_name: queue?.assigned_crm_name ?? crmName,
    primary_name: client?.primary_name ?? queue?.client_name ?? "",
    primary_phone: client?.primary_phone ?? queue?.mobile ?? "",
    billing_phone: client?.billing_phone ?? "",
    gender: client?.gender?.toUpperCase() ?? "",
    country: client?.country ?? "India",
    state: client?.state ?? "",
    city: client?.city ?? "",
    city_other: client?.city_other ?? "",
    pincode: client?.pincode ?? "",
    address: client?.address ?? "",
    community: client?.community ?? "",
    community_other: client?.community_other ?? "",
    dob: client?.dob ?? "",
    anniversary: client?.anniversary ?? "",
    source_of_lead: "Walk-in",
    source_of_lead_other: "",
    reference_name: "",
    reference_phone: "",
    did_buy: "yes",
    visit_status: "YES",
    not_bought_other: "",
    repair_or_order_approach: "",
    marketing_message_sent: "",
    occupation: "",
    occupation_other: "",
    bridal_or_non_bridal: "",
    wedding_month: "",
    wedding_year: "",
    communication_preference: "",
    beverage: client?.beverage ?? "",
    sugar: client?.sugar ?? "",
    snack: client?.snack ?? "",
    next_visit_date: client?.next_visit_date ?? "",
    client_potential_category: client?.client_potential_category ?? "",
    high_potential_reason: client?.high_potential_reason ?? "",
    remark: "",
    product_requirement: "",
    other_store_client_wants_to_visit: "",
    categories_client_wants_more: "",
    seen_categories: "",
    bought_categories: "",
    order_categories: "",
    seen_other: "",
    bought_other: "",
    order_other: "",
    salesperson_handled: "",
    new_things_choice: "",
    other_order: "",
    came_for_categories: "",
    came_for_other: "",
    new_things_categories: "",
    new_things_other: "",
    referrals_count: "",
  };
}
function asList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
export function WalkInForm({
  profile,
  branches,
  crms,
  queue,
  client,
  lookups = {
    productCategories: [],
    notBoughtReasons: [],
    beverages: [],
    snacks: [],
  },
}: {
  profile: { role: string; branchId: string | null; name: string };
  branches: { id: string; name: string }[];
  crms: string[];
  queue: Queue;
  client: Client | null;
  lookups?: {
    productCategories: string[];
    notBoughtReasons: string[];
    beverages: string[];
    snacks: string[];
  };
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [values, setValues] = useState(() =>
    initialValue(client, queue, profile.branchId ?? "", profile.name),
  );
  const [companions, setCompanions] = useState<Companion[]>([]);
  const [referrals, setReferrals] = useState<{ name: string; mobile: string }[]>([]);
  const [notBoughtReasons, setNotBoughtReasons] = useState<string[]>([]);
  const [engagement, setEngagement] = useState<
    Record<string, { asked: string; no_reason: string }>
  >({});
  const [proofs, setProofs] = useState<Record<string, Proof>>({});
  const [proposedClientId, setProposedClientId] = useState(
    () => client?.client_id ?? crypto.randomUUID(),
  );
  const [proposedTimelineId] = useState(() => crypto.randomUUID());
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const submitWasExplicit = useRef(false);
  const [billingMatchesPrimary, setBillingMatchesPrimary] = useState(
    () => Boolean(client?.billing_phone && phoneDigits(client.billing_phone) === phoneDigits(client.primary_phone)),
  );
  const [autoFilledFields, setAutoFilledFields] = useState<Set<string>>(
    () => new Set(client ? ["primary_name", "gender", "dob", "community", "address", "pincode"] : []),
  );
  const set = (key: keyof typeof values, value: string) =>
    setValues((current) => ({ ...current, [key]: value }));
  const engagementKinds = [
    ["instagram", "Instagram follow"],
    ["google_review", "Google review"],
    ["testimonial", "Testimonial"],
    ["feedback_form", "Feedback form"],
    ["thank_you_note", "Thank-you note"],
    ["referrals", "Referrals"],
  ] as const;
  useEffect(() => {
    if (phoneDigits(values.primary_phone).length !== 10) return;
    const timer = window.setTimeout(() => {
      void lookupClientByPhone(values.primary_phone).then((matched) => {
        if (!matched) {
          if (!queue?.client_id && !client?.client_id) setValues((current) => ({ ...current, client_id: "" }));
          setAutoFilledFields(new Set());
          return;
        }
        const fields = ["primary_name", "gender", "dob", "community", "address", "pincode", "country", "state", "city"];
        setValues((current) => ({ ...current, client_id: matched.client_id, primary_name: matched.primary_name, gender: matched.gender?.toUpperCase() ?? "", dob: matched.dob ?? "", community: matched.community ?? "", address: matched.address ?? "", pincode: matched.pincode ?? "", country: matched.country ?? "", state: matched.state ?? "", city: matched.city ?? "" }));
        setProposedClientId(matched.client_id);
        setAutoFilledFields(new Set(fields));
      });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [client?.client_id, queue?.client_id, values.primary_phone]);
  useEffect(() => {
    const pincode = values.pincode.trim();
    if (!/^\d{6}$/.test(pincode)) return;
    let cancelled = false;
    void createClient()
      .from("lookup_pincodes")
      .select("city,state,country")
      .eq("pincode", pincode)
      .eq("active", true)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled || error || !data) return;
        const fields = ["city", "state", "country"];
        setValues((current) => ({
          ...current,
          city: data.city ?? current.city,
          state: data.state ?? current.state,
          country: data.country ?? current.country,
        }));
        setAutoFilledFields((current) => new Set([...current, ...fields]));
      });
    return () => { cancelled = true; };
  }, [values.pincode]);
  async function removeProof(key: string) {
    const proof = proofs[key];
    if (!proof) return;
    await createClient().storage.from("crm-documents").remove([proof.path]);
    setProofs((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  }
  async function uploadProof(key: string, file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setProofs((current) => ({
        ...current,
        [key]: {
          path: "",
          fileName: file.name,
          mimeType: file.type,
          status: "error",
          error: "Choose an image file.",
        },
      }));
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setProofs((current) => ({
        ...current,
        [key]: {
          path: "",
          fileName: file.name,
          mimeType: file.type,
          status: "error",
          error: "Image must be 10MB or smaller.",
        },
      }));
      return;
    }
    await removeProof(key);
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${proposedClientId}/${proposedTimelineId}/${crypto.randomUUID()}_${safeName}`;
    setProofs((current) => ({
      ...current,
      [key]: {
        path,
        fileName: file.name,
        mimeType: file.type,
        status: "uploading",
      },
    }));
    const { error } = await createClient()
      .storage.from("crm-documents")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (error) {
      setProofs((current) => ({
        ...current,
        [key]: {
          path,
          fileName: file.name,
          mimeType: file.type,
          status: "error",
          error: "Upload failed. Try again.",
        },
      }));
      return;
    }
    setProofs((current) => ({
      ...current,
      [key]: {
        path,
        fileName: file.name,
        mimeType: file.type,
        status: "ready",
      },
    }));
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!submitWasExplicit.current) {
      setMessage("Use Submit complete visit to save this form.");
      return;
    }
    submitWasExplicit.current = false;
    if (
      !values.primary_name.trim() ||
      phoneDigits(values.primary_phone).length !== 10 ||
      !values.branch_id
    ) {
      setMessage("Name, 10-digit phone, and branch are required.");
      setStep(0);
      return;
    }
    const requiredProof = engagementKinds.find(
      ([key]) =>
        engagement[key]?.asked === "yes" && proofs[key]?.status !== "ready",
    );
    if (requiredProof) {
      setMessage(`${requiredProof[1]} needs a proof image before submission.`);
      setStep(4);
      return;
    }
    setSaving(true);
    const payload = {
      ...values,
      proposed_client_id: proposedClientId,
      proposed_timeline_id: proposedTimelineId,
      primary_phone: phoneDigits(values.primary_phone),
      event_date: values.event_date ? `${values.event_date}:00+05:30` : undefined,
      did_buy: values.visit_status === "YES",
      companions: companions.filter(
        (item) => item.name || item.mobile || item.relation,
      ),
      not_bought_reasons: notBoughtReasons,
      seen_categories: asList(values.seen_categories),
      bought_categories: asList(values.bought_categories),
      order_categories: asList(values.order_categories),
      documents: Object.values(proofs)
        .filter((proof) => proof.status === "ready")
        .map((proof) => ({
          storage_path: proof.path,
          file_name: proof.fileName,
          mime_type: proof.mimeType,
        })),
      category_details: {
        seen_count: asList(values.seen_categories).length,
        bought_count: asList(values.bought_categories).length,
        order_count: asList(values.order_categories).length,
        seen_other: values.seen_other,
        bought_other: values.bought_other,
        order_other: values.order_other,
        salesperson_handled: values.salesperson_handled,
        new_things_choice: values.new_things_choice,
      },
      engagement: Object.fromEntries(
        Object.entries(engagement).map(([key, item]) => [
          key,
          {
            asked: item.asked === "" ? null : item.asked === "yes",
            no_reason: item.no_reason,
          },
        ]),
      ),
      additional_fields: {
        visit_status: values.visit_status,
        other_order: values.other_order,
        came_for_categories: asList(values.came_for_categories),
        came_for_other: values.came_for_other,
        new_things_categories: asList(values.new_things_categories),
        new_things_other: values.new_things_other,
        referrals_count: values.referrals_count,
        referrals: referrals.filter((referral) => referral.name || referral.mobile),
        other_store_client_wants_to_visit:
          values.other_store_client_wants_to_visit,
        categories_client_wants_more: asList(
          values.categories_client_wants_more,
        ),
      },
    };
    const { data, error } = await createClient().rpc("submit_walkin_visit", {
      p_payload: payload,
    });
    setSaving(false);
    if (error || !data?.[0]) {
      await createClient()
        .storage.from("crm-documents")
        .remove(
          Object.values(proofs)
            .filter((proof) => proof.status === "ready")
            .map((proof) => proof.path),
        );
      setMessage(
        "Could not submit this visit. Uploaded proof images were removed.",
      );
      return;
    }
    router.push(`/queue?completed=${encodeURIComponent(values.primary_name)}`);
  }
  const field = (key: keyof typeof values, label: string, type = "text") => (
    <label className="block text-sm">
      <span>{label}</span>
      <input
        type={type}
        className={`${inputClass}${autoFilledFields.has(key) ? " border-amber-400 bg-amber-50" : ""}`}
        value={values[key]}
        onChange={(event) => { set(key, event.target.value); setAutoFilledFields((current) => { const next = new Set(current); next.delete(key); return next; }); }}
      />
      {autoFilledFields.has(key) ? <small className="mt-1 block text-amber-800">Auto-filled from client history — editable</small> : null}
    </label>
  );
  const selectField = (
    key: keyof typeof values,
    label: string,
    options: string[],
  ) => (
    <label className="block text-sm">
      <span>{label}</span>
      <select
        className={inputClass}
        value={values[key]}
        onChange={(event) => set(key, event.target.value)}
      >
        <option value="">Choose</option>
        {options.map((option) => (
          <option value={option} key={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
  const multiField = (
    key: "seen_categories" | "bought_categories" | "order_categories" | "came_for_categories" | "new_things_categories" | "categories_client_wants_more",
    label: string,
  ) => (
    <fieldset className="block text-sm" aria-label={label}>
      <legend>{label}</legend>
      <div className="mt-1 flex flex-wrap gap-2">
        {[...lookups.productCategories, ...(!lookups.productCategories.some((option) => option.toUpperCase().startsWith("OTHER")) ? ["Other"] : [])].map((option) => {
          const selected = asList(values[key]).includes(option);
          return <label className={`cursor-pointer rounded-full border px-3 py-1.5 ${selected ? "border-amber-800 bg-amber-100" : "border-stone-300 bg-white"}`} key={option}>
            <input className="sr-only" type="checkbox" checked={selected} onChange={() => set(key, (selected ? asList(values[key]).filter((item) => item !== option) : [...asList(values[key]), option]).join(", "))} />{option}
          </label>;
        })}
      </div>
    </fieldset>
  );
  return (
    <form onSubmit={submit} className="mt-6">
      <nav className="flex flex-wrap gap-2 border-b pb-4">
        {sections.map((label, index) => (
          <button
            type="button"
            onClick={() => setStep(index)}
            className={
              step === index
                ? "rounded bg-amber-800 px-3 py-1 text-sm text-white"
                : "rounded bg-stone-200 px-3 py-1 text-sm"
            }
            key={label}
          >
            {index + 1}. {label}
          </button>
        ))}
      </nav>
      <section className="mt-5 rounded-xl border bg-white p-5">
        {step === 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            <h2 className="md:col-span-2 text-lg font-semibold">
              Client & visit{" "}
              {client ? (
                <span className="text-sm font-normal text-green-700">
                  Existing client detected
                </span>
              ) : (
                <span className="text-sm font-normal text-amber-700">
                  New client
                </span>
              )}
            </h2>
            {field("event_date", "Visit date and time", "datetime-local")}
            {field("primary_name", "Client name *")}
            <label className="block text-sm"><span>Mobile *</span><div className="mt-1 flex rounded border border-stone-300 bg-white"><span className="border-r border-stone-300 px-3 py-2 text-stone-600">+91</span><input aria-label="Mobile *" className="min-w-0 flex-1 rounded-r p-2" inputMode="numeric" value={values.primary_phone} onChange={(event) => { set("primary_phone", event.target.value); if (billingMatchesPrimary) set("billing_phone", event.target.value); setAutoFilledFields(new Set()); }} onBlur={() => { if (phoneDigits(values.primary_phone).length === 10) void lookupClientByPhone(values.primary_phone).then((matched) => { if (matched) { setValues((current) => ({ ...current, client_id: matched.client_id, primary_name: matched.primary_name, gender: matched.gender?.toUpperCase() ?? "", dob: matched.dob ?? "", community: matched.community ?? "", address: matched.address ?? "", pincode: matched.pincode ?? "", country: matched.country ?? "", state: matched.state ?? "", city: matched.city ?? "" })); setProposedClientId(matched.client_id); setAutoFilledFields(new Set(["primary_name", "gender", "dob", "community", "address", "pincode", "country", "state", "city"])); } }); }} /></div></label>
            {selectField("source_of_lead", "Source of lead", ["Walk-in", "Reference", "Instagram", "Google", "WhatsApp", "Advertisement", "Other"])}
            {values.source_of_lead.trim().toUpperCase() === "REFERENCE" ? (
              <>
                {field("reference_name", "Reference name")}
                {field("reference_phone", "Reference phone")}
              </>
            ) : null}
            {values.source_of_lead.trim().toUpperCase().startsWith("OTHER") ? field("source_of_lead_other", "Source other") : null}
            {profile.role === "super_admin" ? (
              <label className="block text-sm">
                Branch
                <select
                  className={inputClass}
                  value={values.branch_id}
                  onChange={(event) => set("branch_id", event.target.value)}
                >
                  <option value="">Choose branch</option>
                  {branches.map((item) => (
                    <option value={item.id} key={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <label className="block text-sm">
              CRM / salesperson
              <select
                className={inputClass}
                value={values.crm_name}
                onChange={(event) => set("crm_name", event.target.value)}
              >
                <option value="">Choose</option>
                {crms.map((item) => (
                  <option value={item} key={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : null}
        {step === 1 ? (
          <div className="grid gap-4 md:grid-cols-2">
            <h2 className="md:col-span-2 text-lg font-semibold">Profile</h2>
            {selectField("gender", "Gender", ["FEMALE", "MALE", "OTHER"])}
            <label className="block text-sm"><span>Billing phone</span><input aria-label="Billing phone" className={inputClass} inputMode="numeric" value={values.billing_phone} disabled={billingMatchesPrimary} onChange={(event) => set("billing_phone", event.target.value)} /><span className="mt-2 flex items-center gap-2"><input aria-label="Same as mobile number" type="checkbox" checked={billingMatchesPrimary} onChange={(event) => { setBillingMatchesPrimary(event.target.checked); if (event.target.checked) set("billing_phone", values.primary_phone); }} />Same as mobile number</span></label>
            {field("country", "Country")}
            {field("state", "State")}
            {field("city", "City")}
            {values.city.trim().toUpperCase() === "OTHER" ? field("city_other", "City other") : null}
            {field("pincode", "Pincode")}
            {field("address", "Address")}
            {field("community", "Community / caste")}
            {values.community.trim().toUpperCase().startsWith("OTHER") ? field("community_other", "Community other") : null}
            {field("dob", "Date of birth", "date")}
            {field("anniversary", "Anniversary", "date")}
          </div>
        ) : null}
        {step === 2 ? (
          <div>
            <h2 className="text-lg font-semibold">Companions</h2>
            <p className="mt-1 text-sm text-stone-600">Add up to 10 people.</p>
            <div className="mt-4 space-y-2">
              {companions.map((item, index) => (
                <div
                  className="grid gap-2 md:grid-cols-[1fr_1fr_1fr_auto]"
                  key={index}
                >
                  {(["name", "mobile", "relation"] as const).map((key) => (
                    <input
                      className="rounded border p-2"
                      placeholder={key}
                      value={item[key]}
                      onChange={(event) =>
                        setCompanions((current) =>
                          current.map((row, rowIndex) =>
                            rowIndex === index
                              ? { ...row, [key]: event.target.value }
                              : row,
                          ),
                        )
                      }
                      key={key}
                    />
                  ))}
                  <button
                    type="button"
                    className="text-sm underline"
                    onClick={() =>
                      setCompanions((current) =>
                        current.filter((_, rowIndex) => rowIndex !== index),
                      )
                    }
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              disabled={companions.length >= 10}
              className="mt-3 rounded border px-3 py-2 text-sm"
              onClick={() =>
                setCompanions((current) => [
                  ...current,
                  { name: "", mobile: "", relation: "" },
                ])
              }
            >
              Add companion
            </button>
          </div>
        ) : null}
        {step === 3 ? (
          <div className="grid gap-4 md:grid-cols-2">
            <h2 className="md:col-span-2 text-lg font-semibold">
              Purchase outcome
            </h2>
            <label className="block text-sm">
              Client bought any product?
              <select
                className={inputClass}
                value={values.visit_status}
                onChange={(event) => { set("visit_status", event.target.value); set("did_buy", event.target.value === "YES" ? "yes" : "no"); }}
              >
                {LEGACY_VISIT_STATUSES.map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}
              </select>
            </label>
            {values.visit_status === "NO" ? (
              <div className="md:col-span-2">
                <p className="text-sm">Not-bought reasons</p>
                {lookups.notBoughtReasons.map((reason) => (
                  <label
                    className="mr-4 inline-flex items-center gap-1 text-sm"
                    key={reason}
                  >
                    <input
                      type="checkbox"
                      checked={notBoughtReasons.includes(reason)}
                      onChange={() =>
                        setNotBoughtReasons((current) =>
                          current.includes(reason)
                            ? current.filter((item) => item !== reason)
                            : [...current, reason],
                        )
                      }
                    />
                    {reason}
                  </label>
                ))}
                {field("not_bought_other", "Other reason")}
              </div>
            ) : null}
            {values.visit_status !== "STORE_VISIT" && values.visit_status !== "PRICE_CALCULATION" ? <>
              {["YES", "NO", "PRODUCT_EXCHANGE"].includes(values.visit_status) || (["REPAIR_PLACED", "REPAIR_PICKUP", "ORDER_PLACED", "ORDER_PICKUP", "PRODUCT_RETURN"].includes(values.visit_status) && values.repair_or_order_approach === "YES") ? <>
                {multiField("seen_categories", "Product categories seen by the client")}
                {asList(values.seen_categories).some((item) => item.toUpperCase().startsWith("OTHER")) ? field("seen_other", "Other (seen category)") : null}
              </> : null}
              {values.visit_status === "YES" ? <>
                {multiField("bought_categories", "Bought product categories")}
                {asList(values.bought_categories).some((item) => item.toUpperCase().startsWith("OTHER")) ? field("bought_other", "Other (bought category)") : null}
                {selectField("other_order", "Did the client make any other / new order?", ["YES", "NO"])}
                {values.other_order === "YES" ? <>{multiField("order_categories", "Order / new-things categories")}{asList(values.order_categories).some((item) => item.toUpperCase().startsWith("OTHER")) ? field("order_other", "Other (order category)") : null}</> : null}
              </> : null}
              {["REPAIR_PLACED", "REPAIR_PICKUP", "ORDER_PLACED", "ORDER_PICKUP", "PRODUCT_RETURN"].includes(values.visit_status) ? <>
                {multiField("came_for_categories", "Product categories client came for")}
                {asList(values.came_for_categories).some((item) => item.toUpperCase().startsWith("OTHER")) ? field("came_for_other", "Other (came-for category)") : null}
                {selectField("repair_or_order_approach", "Did CRM approach to show new products?", ["YES", "NO"])}
                {values.repair_or_order_approach === "YES" ? <>{selectField("new_things_choice", "Is client buying / making order for new things?", ["BUYING_NEW_PRODUCT", "MAKING_NEW_ORDER", "NO"])}{["BUYING_NEW_PRODUCT", "MAKING_NEW_ORDER"].includes(values.new_things_choice) ? <>{field("salesperson_handled", "Salesperson attending new buy / order")}{multiField("new_things_categories", "New buy / order categories")}{asList(values.new_things_categories).some((item) => item.toUpperCase().startsWith("OTHER")) ? field("new_things_other", "Other (new buy / order category)") : null}</> : null}</> : null}
              </> : null}
              {values.visit_status !== "PRODUCT_EXCHANGE" ? field("marketing_message_sent", "Marketing message") : null}
            </> : null}
          </div>
        ) : null}
        {step === 4 ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Engagement asks</h2>
            {engagementKinds.map(([key, label]) => {
              const item = engagement[key] ?? { asked: "", no_reason: "" };
              const proof = proofs[key];
              return (
                <div
                  key={key}
                  className="grid gap-3 rounded border p-3 md:grid-cols-[220px_160px_1fr]"
                >
                  <b className="text-sm">{label}</b>
                  <select
                    className="rounded border p-2 text-sm"
                    value={item.asked}
                    onChange={(event) => {
                      if (event.target.value !== "yes") void removeProof(key);
                      setEngagement((current) => ({
                        ...current,
                        [key]: { ...item, asked: event.target.value },
                      }));
                    }}
                  >
                    <option value="">Not recorded</option>
                    <option value="yes">Asked — yes</option>
                    <option value="no">Asked — no</option>
                  </select>
                  {item.asked === "no" ? (
                    <input
                      className="rounded border p-2 text-sm"
                      placeholder="Reason"
                      value={item.no_reason}
                      onChange={(event) =>
                        setEngagement((current) => ({
                          ...current,
                          [key]: { ...item, no_reason: event.target.value },
                        }))
                      }
                    />
                  ) : item.asked === "yes" ? (
                    <div>
                      {key === "referrals" ? <div className="mb-2"><label className="block text-sm">How many referrals?<select aria-label="How many referrals?" className="mt-1 block rounded border p-2" value={values.referrals_count} onChange={(event) => { const count = Number(event.target.value); set("referrals_count", event.target.value); setReferrals((current) => Array.from({ length: count }, (_, index) => current[index] ?? { name: "", mobile: "" })); }}><option value="">Choose</option>{Array.from({ length: 10 }, (_, index) => <option key={index + 1} value={String(index + 1)}>{index + 1}</option>)}</select></label>{referrals.map((referral, index) => <div className="mt-2 grid gap-2 md:grid-cols-2" key={index}><input aria-label={`Referral ${index + 1} name`} className="rounded border p-2" placeholder={`Referral ${index + 1} name`} value={referral.name} onChange={(event) => setReferrals((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item))} /><input aria-label={`Referral ${index + 1} number`} className="rounded border p-2" inputMode="numeric" placeholder={`Referral ${index + 1} number`} value={referral.mobile} onChange={(event) => setReferrals((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, mobile: event.target.value } : item))} /></div>)}</div> : null}
                      <input
                        aria-label={`${label} proof image`}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="text-sm"
                        disabled={proof?.status === "uploading"}
                        onChange={(event) =>
                          void uploadProof(key, event.target.files?.[0])
                        }
                      />
                      {proof ? (
                        <p
                          className={
                            proof.status === "error"
                              ? "mt-1 text-xs text-red-700"
                              : "mt-1 text-xs text-stone-600"
                          }
                        >
                          {proof.status === "uploading"
                            ? "Uploading…"
                            : proof.status === "ready"
                              ? `${proof.fileName} uploaded`
                              : proof.error}
                          <button
                            type="button"
                            className="ml-2 underline"
                            onClick={() => void removeProof(key)}
                          >
                            Remove
                          </button>
                        </p>
                      ) : (
                        <p className="mt-1 text-xs text-amber-800">
                          Proof image is required.
                        </p>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-stone-500">
                      Select yes to attach proof, or no to record a reason.
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ) : null}
        {step === 5 ? (
          <div className="grid gap-4 md:grid-cols-2">
            <h2 className="md:col-span-2 text-lg font-semibold">
              Preferences & planning
            </h2>
            {selectField("beverage", "Beverage", lookups.beverages)}
            {selectField("sugar", "Sugar", ["No sugar", "Less sugar", "Regular sugar"])}
            {selectField("snack", "Snack", lookups.snacks)}
            {selectField("occupation", "Occupation", ["Business", "Professional", "Homemaker", "Student", "Retired", "Other"])}
            {values.occupation.trim().toUpperCase() === "OTHER" ? field("occupation_other", "Occupation other") : null}
            {selectField("bridal_or_non_bridal", "Bridal / non-bridal", ["Bridal", "Non-bridal"])}
            {values.bridal_or_non_bridal.trim().toUpperCase() === "BRIDAL" ? <>{field("wedding_month", "Wedding month", "number")}{field("wedding_year", "Wedding year", "number")}</> : null}
            {field("communication_preference", "Communication preference")}
            {field("next_visit_date", "Next visit date", "date")}
            {selectField("client_potential_category", "Client potential category", [
              ...(!isPotentialCategory(values.client_potential_category) && values.client_potential_category ? [values.client_potential_category] : []),
              ...POTENTIAL_CATEGORIES,
            ])}
            {field("high_potential_reason", "Why high potential")}
            {field("product_requirement", "Product requirement")}
            {field(
              "other_store_client_wants_to_visit",
              "Other store client wants to visit",
            )}
            {notBoughtReasons.some((reason) => reason.trim().toUpperCase() === "WANT TO SEE MORE DESIGNS") ? multiField("categories_client_wants_more", "Which categories client wants to see more") : null}
            {field("remark", "Remark")}
          </div>
        ) : null}
      </section>
      <div className="mt-4 flex justify-between">
        <button
          type="button"
          disabled={step === 0}
          className="rounded border px-4 py-2 disabled:opacity-40"
          onClick={() => setStep((current) => current - 1)}
        >
          Back
        </button>
        {step < sections.length - 1 ? (
          <button
            type="button"
            className="rounded bg-stone-800 px-4 py-2 text-white"
            onClick={() => setStep((current) => current + 1)}
          >
            Next
          </button>
        ) : (
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-amber-800 px-4 py-2 font-medium text-white disabled:opacity-50"
            onClick={() => { submitWasExplicit.current = true; }}
          >
            {saving ? "Submitting…" : "Submit complete visit"}
          </button>
        )}
      </div>
      {message ? <p className="mt-3 text-sm text-red-700">{message}</p> : null}
    </form>
  );
}
