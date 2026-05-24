import { redirect } from "next/navigation";

import { HomePage } from "@/components/home-page";
import { getCurrentAppUser } from "@/lib/app-auth";

export default async function Page() {
  const user = await getCurrentAppUser();

  if (!user) {
    redirect("/login");
  }

  return <HomePage />;
}
