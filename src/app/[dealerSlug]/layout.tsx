import Link from "next/link";
import { notFound } from "next/navigation";

import { brand } from "@/config/brand";
import { getDealerBySlug } from "@/lib/dealer-profile";

type PublicLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ dealerSlug: string }>;
};

export default async function PublicDealerLayout({
  children,
  params,
}: PublicLayoutProps) {
  const { dealerSlug } = await params;
  const dealer = await getDealerBySlug(dealerSlug);

  if (!dealer) {
    notFound();
  }

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <header className="border-b border-zinc-100 bg-white">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link
            href={`/${dealerSlug}`}
            className="text-lg font-semibold text-zinc-900"
          >
            {dealer.displayName || brand.productName}
          </Link>
          <div className="flex items-center gap-4">
            {dealer.phone && (
              <a
                href={`tel:${dealer.phone}`}
                className="hidden text-sm font-medium text-zinc-600 hover:text-zinc-900 sm:block"
              >
                {dealer.phone}
              </a>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-zinc-100 bg-zinc-50">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
          <p className="text-center text-xs text-zinc-500">
            Powered by{" "}
            <a
              href={brand.appUrl}
              className="font-medium text-zinc-700 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {brand.productName}
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
