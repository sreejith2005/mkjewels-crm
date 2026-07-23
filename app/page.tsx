import { redirect } from "next/navigation";

import { signOut } from "./actions";
import { createClient } from "@/lib/supabase/server";

type ProfileSummary = {
  name: string;
  role: "super_admin" | "branch_manager" | "salesperson";
  branch_name: string | null;
};

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data, error } = await supabase.rpc("get_my_profile");
  const profile = (data as ProfileSummary[] | null)?.[0];

  if (error || !profile) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <section className="max-w-lg rounded-2xl border border-red-200 bg-white p-8">
          <h1 className="text-xl font-semibold">Profile setup required</h1>
          <p className="mt-3 text-stone-700">
            Your Supabase Auth account exists, but no active CRM user profile was
            found. Ask a super admin to add the matching user ID to public.users.
          </p>
          <form action={signOut} className="mt-6">
            <button className="rounded-lg border border-stone-300 px-4 py-2" type="submit">
              Sign out
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <section className="w-full max-w-2xl rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-800">
          MK Jewels CRM
        </p>
        <h1 className="mt-3 text-2xl font-semibold">
          Logged in as {profile.name} ({profile.role}) —{" "}
          {profile.branch_name ?? "All branches"}
        </h1>
        <p className="mt-3 text-stone-600">
          Phase 0 foundation is ready. Feature screens will be added in later phases.
        </p>
        <form action={signOut} className="mt-8">
          <button className="rounded-lg border border-stone-300 px-4 py-2" type="submit">
            Sign out
          </button>
        </form>
      </section>
    </main>
  );
}
