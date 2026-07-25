"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { displayDate, nullable, phoneDigits, stringArray } from "@/lib/clients";
import type { Json } from "@/lib/supabase/database.types";
import type { Client } from "@/lib/supabase/app-types";
const schema = z.object({
  primary_name: z.string().trim().min(1).max(160),
  primary_phone: z
    .string()
    .refine(
      (value) => phoneDigits(value).length === 10,
      "Enter a 10-digit phone",
    ),
  secondary_phone: z.string(),
  billing_phone: z.string(),
  other_names: z.string(),
  other_known_phones: z.string(),
  gender: z.string(),
  country: z.string(),
  state: z.string(),
  city: z.string(),
  city_other: z.string(),
  pincode: z.string(),
  address: z.string(),
  community: z.string(),
  community_other: z.string(),
  dob: z.string(),
  anniversary: z.string(),
  beverage: z.string(),
  sugar: z.string(),
  snack: z.string(),
  gift_history: z.string(),
  client_potential_category: z.string(),
  high_potential_reason: z.string(),
  instagram_status: z.string(),
  google_review_status: z.string(),
  testimonial_status: z.string(),
  referral_status: z.string(),
  next_visit_date: z.string(),
});
type Form = z.infer<typeof schema>;
const fieldGroups: { title: string; fields: (keyof Form)[] }[] = [
  {
    title: "Identity & phones",
    fields: [
      "primary_name",
      "primary_phone",
      "other_names",
      "secondary_phone",
      "billing_phone",
      "other_known_phones",
      "gender",
    ],
  },
  {
    title: "Location",
    fields: [
      "country",
      "state",
      "city",
      "city_other",
      "pincode",
      "address",
      "community",
      "community_other",
    ],
  },
  {
    title: "Personal preferences",
    fields: [
      "dob",
      "anniversary",
      "beverage",
      "sugar",
      "snack",
      "gift_history",
    ],
  },
  {
    title: "Relationship",
    fields: [
      "client_potential_category",
      "high_potential_reason",
      "instagram_status",
      "google_review_status",
      "testimonial_status",
      "referral_status",
      "next_visit_date",
    ],
  },
];
function initial(client: Client): Form {
  return {
    primary_name: client.primary_name,
    primary_phone: client.primary_phone,
    other_names: (client.other_names ?? []).join(", "),
    secondary_phone: client.secondary_phone ?? "",
    billing_phone: client.billing_phone ?? "",
    other_known_phones: (client.other_known_phones ?? []).join(", "),
    gender: client.gender ?? "",
    country: client.country ?? "",
    state: client.state ?? "",
    city: client.city ?? "",
    city_other: client.city_other ?? "",
    pincode: client.pincode ?? "",
    address: client.address ?? "",
    community: client.community ?? "",
    community_other: client.community_other ?? "",
    dob: client.dob ?? "",
    anniversary: client.anniversary ?? "",
    beverage: client.beverage ?? "",
    sugar: client.sugar ?? "",
    snack: client.snack ?? "",
    gift_history: client.gift_history
      ? JSON.stringify(client.gift_history)
      : "",
    client_potential_category: client.client_potential_category ?? "",
    high_potential_reason: client.high_potential_reason ?? "",
    instagram_status: client.instagram_status ?? "",
    google_review_status: client.google_review_status ?? "",
    testimonial_status: client.testimonial_status ?? "",
    referral_status: client.referral_status ?? "",
    next_visit_date: client.next_visit_date ?? "",
  };
}
function label(field: string) {
  return field.replaceAll("_", " ");
}
export function ClientProfile({
  client,
  timeline,
  audit,
}: {
  client: Client;
  timeline: Array<{
    id: string;
    event_date: string;
    event_type: string;
    buy_status: string | null;
    crm_name: string | null;
    remark: string | null;
    branch: string | null;
    salesperson: string | null;
  }>;
  audit: Array<{
    id: number;
    field_name: string;
    old_value: Json | null;
    new_value: Json | null;
    created_at: string;
    editor: string | null;
  }>;
}) {
  const [values, setValues] = useState(() => initial(client));
  const [tab, setTab] = useState<"profile" | "timeline" | "audit">("profile");
  const [message, setMessage] = useState("");
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async () => {
      const parsed = schema.parse(values);
      let gift: Json | null = null;
      if (parsed.gift_history) {
        try {
          gift = JSON.parse(parsed.gift_history) as Json;
        } catch {
          throw new Error("Gift history must be valid JSON.");
        }
      }
      const patch = {
        ...Object.fromEntries(
          Object.entries(parsed)
            .filter(
              ([key]) =>
                ![
                  "other_names",
                  "other_known_phones",
                  "gift_history",
                  "primary_phone",
                ].includes(key),
            )
            .map(([key, value]) => [
              key,
              key === "dob" ||
              key === "anniversary" ||
              key === "next_visit_date"
                ? nullable(value)
                : nullable(value),
            ]),
        ),
        primary_phone: phoneDigits(parsed.primary_phone),
        other_names: stringArray(parsed.other_names),
        other_known_phones: stringArray(parsed.other_known_phones).map(
          phoneDigits,
        ),
        gift_history: gift,
      };
      const { data, error } = await createClient()
        .from("clients")
        .update(patch)
        .eq("client_id", client.client_id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onMutate: async () => {
      setMessage("Saving…");
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["client", client.client_id], updated);
      setMessage("Saved");
      setValues(initial(updated));
    },
    onError: (error) =>
      setMessage(
        error instanceof Error ? error.message : "Could not save. Try again.",
      ),
  });
  return (
    <main className="mx-auto max-w-7xl px-5 py-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">{client.primary_name}</h1>
          <p className="mt-1 text-stone-600">
            {client.primary_phone} <button type="button" aria-label="Copy primary phone" className="ml-1 rounded border px-1 text-xs" onClick={() => void navigator.clipboard.writeText(client.primary_phone)}>Copy</button> · {client.gender ?? "Gender not set"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a className="rounded border px-3 py-2 text-sm" href={`/visits/new?client=${client.client_id}`}>Make Walk-in Entry</a>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-sm text-amber-900">{client.client_potential_category ?? "Potential not set"}</span>
        </div>
      </div>
      <div className="mt-4 grid gap-3 rounded-xl border bg-white p-4 text-sm md:grid-cols-3">
        <p>
          <b>Last visit</b>
          <br />
          {displayDate(client.last_visit_date)}
        </p>
        <p>
          <b>Last branch</b>
          <br />
          {client.last_branch_id ?? "—"}
        </p>
        <p>
          <b>Last buy status</b>
          <br />
          {client.last_buy_status ?? "—"}
        </p>
      </div>
      <div className="mt-6 flex gap-4 border-b">
        <button
          onClick={() => setTab("profile")}
          className={
            tab === "profile"
              ? "border-b-2 border-amber-700 pb-2 font-semibold"
              : "pb-2"
          }
        >
          Profile
        </button>
        <button
          onClick={() => setTab("timeline")}
          className={
            tab === "timeline"
              ? "border-b-2 border-amber-700 pb-2 font-semibold"
              : "pb-2"
          }
        >
          Timeline
        </button>
        <button
          onClick={() => setTab("audit")}
          className={
            tab === "audit"
              ? "border-b-2 border-amber-700 pb-2 font-semibold"
              : "pb-2"
          }
        >
          Audit log
        </button>
      </div>
      {tab === "profile" && (
        <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_280px]">
          <div className="space-y-5">
            {fieldGroups.map((group) => (
              <section
                className="rounded-xl border bg-white p-5"
                key={group.title}
              >
                <h2 className="font-semibold capitalize">{group.title}</h2>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {group.fields.map((field) => (
                    <label
                      className={
                        field === "address" || field === "gift_history"
                          ? "md:col-span-2"
                          : ""
                      }
                      key={field}
                    >
                      <span className="mb-1 block text-xs font-medium capitalize text-stone-600">
                        {label(field)}
                        {field === "primary_name" || field === "primary_phone"
                          ? " *"
                          : ""}
                      </span>
                      {field === "address" || field === "gift_history" ? (
                        <textarea
                          className="w-full rounded border p-2"
                          rows={field === "gift_history" ? 3 : 2}
                          value={values[field]}
                          onChange={(event) =>
                            setValues({
                              ...values,
                              [field]: event.target.value,
                            })
                          }
                        />
                      ) : (
                        <input
                          className="w-full rounded border p-2"
                          type={
                            field === "dob" ||
                            field === "anniversary" ||
                            field === "next_visit_date"
                              ? "date"
                              : "text"
                          }
                          value={values[field]}
                          onChange={(event) =>
                            setValues({
                              ...values,
                              [field]: event.target.value,
                            })
                          }
                        />
                      )}
                    </label>
                  ))}
                </div>
              </section>
            ))}
            <button
              disabled={mutation.isPending}
              onClick={() => mutation.mutate()}
              className="rounded bg-amber-800 px-4 py-2 font-medium text-white disabled:opacity-50"
            >
              Save profile
            </button>
            <span
              className={
                message === "Saved"
                  ? "ml-3 text-green-700"
                  : "ml-3 text-red-700"
              }
            >
              {message}
            </span>
          </div>
          <aside className="rounded-xl border bg-white p-5">
            <h2 className="font-semibold">Visit rollups</h2>
            {[
              ["Total visits", client.total_visits],
              ["Purchases", client.total_purchase_visits],
              ["Non-purchase", client.total_non_purchase_visits],
              ["Repairs", client.total_repair_visits],
              ["Orders", client.total_order_visits],
              ["First visit", displayDate(client.first_visit_date)],
              ["Last visit", displayDate(client.last_visit_date)],
            ].map(([name, value]) => (
              <p
                className="mt-3 flex justify-between text-sm"
                key={String(name)}
              >
                <span>{name}</span>
                <b>{value}</b>
              </p>
            ))}
          </aside>
        </section>
      )}
      {tab === "timeline" && (
        <section className="mt-6 overflow-hidden rounded-xl border bg-white">
          {timeline.length ? (
            timeline.map((item) => (
              <article className="border-b p-4" key={item.id}>
                <b>
                  {displayDate(item.event_date)} · {item.event_type}
                </b>
                <p className="text-sm text-stone-600">
                  {item.buy_status ?? "No buy status"} ·{" "}
                  {item.branch ?? "Unknown branch"} ·{" "}
                  {item.salesperson ?? item.crm_name ?? "—"}
                </p>
                {item.remark && <p className="mt-1">{item.remark}</p>}
              </article>
            ))
          ) : (
            <p className="p-5 text-stone-600">No history yet.</p>
          )}
        </section>
      )}
      {tab === "audit" && (
        <section className="mt-6 overflow-hidden rounded-xl border bg-white">
          {audit.length ? (
            audit.map((item) => (
              <article
                className="grid gap-1 border-b p-4 text-sm md:grid-cols-[180px_1fr_1fr_160px]"
                key={item.id}
              >
                <b>{label(item.field_name)}</b>
                <span className="break-all text-stone-600">
                  {JSON.stringify(item.old_value)}
                </span>
                <span className="break-all text-stone-900">
                  {JSON.stringify(item.new_value)}
                </span>
                <span className="text-stone-500">
                  {item.editor ?? "System"}
                  <br />
                  {displayDate(item.created_at)}
                </span>
              </article>
            ))
          ) : (
            <p className="p-5 text-stone-600">No profile edits yet.</p>
          )}
        </section>
      )}
    </main>
  );
}
