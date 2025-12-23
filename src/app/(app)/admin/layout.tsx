import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { isAdminUser } from "@/lib/admin";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/login");
  }

  const isAdmin = await isAdminUser(userId);
  if (!isAdmin) {
    redirect("/dashboard");
  }

  return children;
}
