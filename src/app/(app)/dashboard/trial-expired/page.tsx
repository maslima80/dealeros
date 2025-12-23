import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";

import { brand } from "@/config/brand";
import { ensureDealerForUser } from "@/lib/tenancy";
import { Card, CardContent, Button } from "@/components/ui";

export default async function TrialExpiredPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/login");
  }

  await ensureDealerForUser(userId);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="max-w-md">
        <CardContent className="py-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
            <svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-zinc-900">
            Your trial has ended
          </h1>
          <p className="mt-3 text-sm text-zinc-600">
            Contact support at{" "}
            <a href={`mailto:${brand.supportEmail}`} className="font-medium text-zinc-900 underline">
              {brand.supportEmail}
            </a>{" "}
            to continue using {brand.productName}.
          </p>
          <div className="mt-6">
            <Button href="/" variant="secondary">
              Back to home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
