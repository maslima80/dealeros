import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { TrialBanner } from "@/components/trial-banner";
import {
  ensureDealerForUser,
  getTrialDaysRemaining,
  refreshSubscriptionStatus,
} from "@/lib/tenancy";

type DashboardGuardProps = {
  children: React.ReactNode;
};

export async function DashboardGuard({ children }: DashboardGuardProps) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/login");
  }

  const { subscription } = await ensureDealerForUser(userId);
  if (!subscription) {
    redirect("/login");
  }

  const refreshed = await refreshSubscriptionStatus({
    id: subscription.id,
    status: subscription.status,
    trialEndsAt: subscription.trialEndsAt,
  });

  const status = refreshed.status;
  const allow = status === "trial" || status === "active";

  if (!allow) {
    redirect("/dashboard/trial-expired");
  }

  const daysRemaining =
    status === "trial" ? getTrialDaysRemaining(refreshed.trialEndsAt) : undefined;

  return (
    <div className="space-y-6">
      <TrialBanner status={status} daysRemaining={daysRemaining} />
      {children}
    </div>
  );
}
