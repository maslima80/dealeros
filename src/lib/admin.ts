import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { adminUsers } from "@/db/schema";

export async function isAdminUser(userId: string): Promise<boolean> {
  const rows = await db
    .select({ userId: adminUsers.userId })
    .from(adminUsers)
    .where(eq(adminUsers.userId, userId))
    .limit(1);

  return rows.length > 0;
}
