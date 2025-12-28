"use client";

import Link from "next/link";
import { useState } from "react";

import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

import { brand } from "@/config/brand";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-zinc-200/50">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/25">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
            </svg>
          </div>
          <span className="text-xl font-bold text-zinc-900">{brand.productName}</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex lg:items-center lg:gap-8">
          <Link href="#features" className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900">
            Features
          </Link>
          <Link href="#how-it-works" className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900">
            How It Works
          </Link>
          <Link href="#pricing" className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900">
            Pricing
          </Link>
        </div>

        {/* Desktop Auth */}
        <div className="hidden lg:flex lg:items-center lg:gap-4">
          <SignedOut>
            <Link
              href="/login"
              className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-zinc-800 hover:shadow-md"
            >
              Start Free Trial
            </Link>
          </SignedOut>

          <SignedIn>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-zinc-800 hover:shadow-md"
            >
              Dashboard
            </Link>
            <UserButton />
          </SignedIn>
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden rounded-lg p-2 text-zinc-600 hover:bg-zinc-100"
        >
          <span className="sr-only">Open menu</span>
          {mobileMenuOpen ? (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-zinc-200/50 bg-white px-6 py-4">
          <div className="space-y-4">
            <Link
              href="#features"
              className="block text-sm font-medium text-zinc-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="block text-sm font-medium text-zinc-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              How It Works
            </Link>
            <Link
              href="#pricing"
              className="block text-sm font-medium text-zinc-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              Pricing
            </Link>

            <div className="border-t border-zinc-200 pt-4">
              <SignedOut>
                <div className="space-y-3">
                  <Link
                    href="/login"
                    className="block text-sm font-medium text-zinc-600"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    className="block w-full rounded-full bg-zinc-900 px-5 py-2.5 text-center text-sm font-semibold text-white"
                  >
                    Start Free Trial
                  </Link>
                </div>
              </SignedOut>

              <SignedIn>
                <div className="flex items-center gap-4">
                  <Link
                    href="/dashboard"
                    className="flex-1 rounded-full bg-zinc-900 px-5 py-2.5 text-center text-sm font-semibold text-white"
                  >
                    Dashboard
                  </Link>
                  <UserButton />
                </div>
              </SignedIn>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
