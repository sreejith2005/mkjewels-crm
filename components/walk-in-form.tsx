"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { phoneDigits } from "@/lib/clients";
import { isPotentialCategory, POTENTIAL_CATEGORIES } from "@/lib/client-potential";
import { createClient } from "@/lib/supabase/client";
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
function initialValue(
  client: Client | null,
  queue: Queue,
  branchId: string,
  crmName: string,
) {
  return {
    client_id: client?.client_id ?? queue?.client_id ?? "",
    entry_queue_id: queue?.id ?? "",
    event_date: new Date().toISOString().slice(0, 16),
    branch_id: queue?.branch_id ?? branchId,
    crm_name: queue?.assigned_crm_name ?? crmName,
    primary_name: client?.primary_name ?? queue?.client_name ?? "",
    primary_phone: client?.primary_phone ?? queue?.mobile ?? "",
    billing_phone: client?.billing_phone ?? "",
    gender: client?.gender ?? "",
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
    source_of_lead: "",
    source_of_lead_other: "",
    reference_name: "",
    reference_phone: "",
    did_buy: "yes",
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
  const [notBoughtReasons, setNotBoughtReasons] = useState<string[]>([]);
  const [engagement, setEngagement] = useState<
    Record<string, { asked: string; no_reason: string }>
  >({});
  const [proofs, setProofs] = useState<Record<string, Proof>>({});
  const [proposedClientId] = useState(
    () => client?.client_id ?? crypto.randomUUID(),
  );
  const [proposedTimelineId] = useState(() => crypto.randomUUID());
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
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
      event_date: new Date(values.event_date).toISOString(),
      did_buy: values.did_buy === "yes",
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
    router.push(`/clients/${data[0].client_id}`);
  }
  const field = (key: keyof typeof values, label: string, type = "text") => (
    <label className="block text-sm">
      <span>{label}</span>
      <input
        type={type}
        className={inputClass}
        value={values[key]}
        onChange={(event) => set(key, event.target.value)}
      />
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
    key: "seen_categories" | "bought_categories" | "order_categories",
    label: string,
  ) => (
    <label className="block text-sm">
      <span>{label}</span>
      <select
        aria-label={label}
        multiple
        className={inputClass}
        value={asList(values[key])}
        onChange={(event) =>
          set(
            key,
            Array.from(
              event.currentTarget.selectedOptions,
              (option) => option.value,
            ).join(", "),
          )
        }
      >
        {lookups.productCategories.map((option) => (
          <option value={option} key={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
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
            {field("primary_phone", "Mobile *")}
            {selectField("source_of_lead", "Source of lead", ["Walk-in", "Referral", "Instagram", "Google", "WhatsApp", "Advertisement", "Other"])}
            {values.source_of_lead.toLowerCase().includes("referral") ? (
              <>
                {field("reference_name", "Reference name")}
                {field("reference_phone", "Reference phone")}
              </>
            ) : null}
            {field("source_of_lead_other", "Source other")}
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
            {field("gender", "Gender")}
            {field("billing_phone", "Billing phone")}
            {field("country", "Country")}
            {field("state", "State")}
            {field("city", "City")}
            {field("city_other", "City other")}
            {field("pincode", "Pincode")}
            {field("address", "Address")}
            {field("community", "Community / caste")}
            {field("community_other", "Community other")}
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
              Did the client buy?
              <select
                className={inputClass}
                value={values.did_buy}
                onChange={(event) => set("did_buy", event.target.value)}
              >
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </label>
            {values.did_buy === "no" ? (
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
            {selectField("repair_or_order_approach", "Repair / order approach", ["Repair", "Order", "Neither"])}
            {selectField("new_things_choice", "New-things choice", ["Ready product", "New order", "Not applicable"])}
            {field("salesperson_handled", "Salesperson who handled")}
            {multiField("seen_categories", "Seen categories")}
            {multiField("bought_categories", "Bought categories")}
            {multiField("order_categories", "Order / new-things categories")}
            {field("seen_other", "Seen category other")}
            {field("bought_other", "Bought category other")}
            {field("order_other", "Order category other")}
            {field("marketing_message_sent", "Marketing message sent")}
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
            {field("occupation_other", "Occupation other")}
            {selectField("bridal_or_non_bridal", "Bridal / non-bridal", ["Bridal", "Non-bridal"])}
            {field("wedding_month", "Wedding month", "number")}
            {field("wedding_year", "Wedding year", "number")}
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
            {field(
              "categories_client_wants_more",
              "Categories client wants more",
            )}
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
            disabled={saving}
            className="rounded bg-amber-800 px-4 py-2 font-medium text-white disabled:opacity-50"
          >
            {saving ? "Submitting…" : "Submit complete visit"}
          </button>
        )}
      </div>
      {message ? <p className="mt-3 text-sm text-red-700">{message}</p> : null}
    </form>
  );
}
