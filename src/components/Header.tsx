import Link from "next/link";

import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

import { brand } from "@/config/brand";

export function Header() {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-base font-semibold text-zinc-900">
          {brand.productName}
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          <SignedOut>
            <Link
              href="/login"
              className="text-zinc-700 hover:text-zinc-900"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="text-zinc-700 hover:text-zinc-900"
            >
              Sign up
            </Link>
          </SignedOut>

          <SignedIn>
            <Link
              href="/dashboard"
              className="rounded-md bg-zinc-900 px-3 py-2 font-medium text-white hover:bg-zinc-800"
            >
              Dashboard
            </Link>
            <UserButton />
          </SignedIn>
        </nav>
      </div>
    </header>
  );
}
