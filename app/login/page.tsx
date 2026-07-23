import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <section className="w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-800">
          MK Jewels
        </p>
        <h1 className="mt-2 text-2xl font-semibold">CRM sign in</h1>
        <p className="mt-2 text-sm text-stone-600">
          Use your company email and password.
        </p>
        <LoginForm />
      </section>
    </main>
  );
}
