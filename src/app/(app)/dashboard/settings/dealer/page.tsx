import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db/client";
import { dealerMembers, dealers } from "@/db/schema";
import { PageHeader } from "@/components/ui";

import { DealerSettingsForm } from "./dealer-settings-form";

export default async function DealerSettingsPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/login");
  }

  const rows = await db
    .select({
      dealerId: dealerMembers.dealerId,
      displayName: dealers.displayName,
      slug: dealers.slug,
      phone: dealers.phone,
      email: dealers.email,
      addressLine: dealers.addressLine,
      city: dealers.city,
      province: dealers.province,
      postalCode: dealers.postalCode,
    })
    .from(dealerMembers)
    .innerJoin(dealers, eq(dealerMembers.dealerId, dealers.id))
    .where(eq(dealerMembers.userId, userId))
    .limit(1);

  const dealer = rows[0];
  if (!dealer) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dealer Settings"
        subtitle="Manage your dealership profile and contact information"
        backHref="/dashboard"
        backLabel="Back to dashboard"
      />

      <div className="mx-auto max-w-2xl">
        <DealerSettingsForm
          initialValues={{
            displayName: dealer.displayName ?? "",
            slug: dealer.slug ?? "",
            phone: dealer.phone ?? "",
            email: dealer.email ?? "",
            addressLine: dealer.addressLine ?? "",
            city: dealer.city ?? "",
            province: dealer.province ?? "",
            postalCode: dealer.postalCode ?? "",
          }}
        />
      </div>
    </div>
  );
}
