import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { ensureDealerForUser } from "@/lib/tenancy";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/login");
  }

  await ensureDealerForUser(userId);

  return children;
}
