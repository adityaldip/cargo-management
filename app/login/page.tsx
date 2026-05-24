import { redirect } from "next/navigation";

import { LoginForm } from "@/components/login-form";
import { getCurrentAppUser } from "@/lib/app-auth";

export default async function LoginPage() {
  const user = await getCurrentAppUser();

  if (user) {
    redirect("/");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-100 via-white to-gray-200 px-4">
      <div className="w-full max-w-md rounded-3xl border bg-white p-8 shadow-xl">
        <div className="mb-8 space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-gray-400">
            Cargo Management
          </p>
          <h1 className="text-3xl font-semibold text-gray-900">
            Enter workspace
          </h1>
          <p className="text-sm text-gray-500">
            Use your name and email. If you are new, we will create your access automatically.
          </p>
        </div>

        <LoginForm />
      </div>
    </main>
  );
}
