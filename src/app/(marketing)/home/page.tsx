import Link from "next/link";

import { brand } from "@/config/brand";

const features = [
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
      </svg>
    ),
    title: "VIN Scan & Decode",
    description: "Scan any VIN from your phone. Get instant vehicle specs, history, and market data in seconds.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
      </svg>
    ),
    title: "Per-Vehicle Profit Tracking",
    description: "Track every cost—purchase, transport, recon, parts. Know your true margin on every car.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    title: "Market Intelligence",
    description: "Real-time pricing data and comps. Make confident buying and pricing decisions.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
      </svg>
    ),
    title: "Photo Management",
    description: "Capture, organize, and publish vehicle photos. Professional listings in minutes.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
    title: "Bill of Sale Generation",
    description: "Generate professional Bills of Sale instantly. Print or download—close deals faster.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
      </svg>
    ),
    title: "Public Dealer Page",
    description: "Your professional online presence. Share inventory with buyers—no website needed.",
  },
];

const steps = [
  {
    number: "01",
    title: "Add Your Inventory",
    description: "Scan VINs or enter manually. Vehicle specs auto-populate instantly.",
  },
  {
    number: "02",
    title: "Track Costs & Price Smart",
    description: "Log every expense. Get market data. Set profitable asking prices.",
  },
  {
    number: "03",
    title: "List & Sell",
    description: "Publish to your dealer page. Generate Bill of Sale. Close the deal.",
  },
];

export default function LandingPage() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-20 sm:pt-32 sm:pb-28">
        {/* Background gradient */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/50 via-white to-white" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-br from-emerald-100/40 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            {/* Badge */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 ring-1 ring-emerald-100">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
              Built for Canadian Dealers
            </div>

            {/* Headline */}
            <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-6xl lg:text-7xl">
              Your dealership,
              <span className="block bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                in your pocket.
              </span>
            </h1>

            {/* Subheadline */}
            <p className="mt-6 text-lg leading-8 text-zinc-600 sm:text-xl">
              The mobile-first operating system for independent used-car dealers. 
              Buy smarter, price with confidence, and close deals faster—all from your phone.
            </p>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/signup"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-zinc-900 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-zinc-900/25 transition-all hover:bg-zinc-800 hover:shadow-xl hover:shadow-zinc-900/30"
              >
                Start 14-Day Free Trial
                <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-base font-semibold text-zinc-900 ring-1 ring-zinc-200 transition-all hover:bg-zinc-50 hover:ring-zinc-300"
              >
                See How It Works
              </Link>
            </div>

            {/* Trust indicators */}
            <p className="mt-8 text-sm text-zinc-500">
              No credit card required • Cancel anytime • CAD $39/month after trial
            </p>
          </div>

          {/* Hero Image/Mockup placeholder */}
          <div className="mt-16 sm:mt-20">
            <div className="relative mx-auto max-w-5xl">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 blur-2xl" />
              <div className="relative overflow-hidden rounded-2xl bg-zinc-900 shadow-2xl ring-1 ring-zinc-800">
                <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-3">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-zinc-700" />
                    <div className="h-3 w-3 rounded-full bg-zinc-700" />
                    <div className="h-3 w-3 rounded-full bg-zinc-700" />
                  </div>
                  <div className="flex-1 text-center">
                    <span className="text-xs text-zinc-500">{brand.productName} Dashboard</span>
                  </div>
                </div>
                <div className="aspect-[16/9] bg-gradient-to-br from-zinc-800 to-zinc-900 p-8">
                  <div className="grid h-full grid-cols-4 gap-4">
                    <div className="col-span-1 space-y-3">
                      <div className="h-8 rounded-lg bg-zinc-700/50" />
                      <div className="h-6 w-3/4 rounded-lg bg-zinc-700/30" />
                      <div className="h-6 w-3/4 rounded-lg bg-zinc-700/30" />
                      <div className="h-6 w-3/4 rounded-lg bg-zinc-700/30" />
                      <div className="h-6 w-3/4 rounded-lg bg-zinc-700/30" />
                    </div>
                    <div className="col-span-3 space-y-4">
                      <div className="flex gap-4">
                        <div className="flex-1 rounded-xl bg-emerald-500/20 p-4">
                          <div className="h-4 w-20 rounded bg-emerald-500/40" />
                          <div className="mt-2 h-8 w-12 rounded bg-emerald-500/60" />
                        </div>
                        <div className="flex-1 rounded-xl bg-blue-500/20 p-4">
                          <div className="h-4 w-20 rounded bg-blue-500/40" />
                          <div className="mt-2 h-8 w-12 rounded bg-blue-500/60" />
                        </div>
                        <div className="flex-1 rounded-xl bg-amber-500/20 p-4">
                          <div className="h-4 w-20 rounded bg-amber-500/40" />
                          <div className="mt-2 h-8 w-12 rounded bg-amber-500/60" />
                        </div>
                      </div>
                      <div className="flex-1 rounded-xl bg-zinc-700/30 p-4">
                        <div className="h-4 w-32 rounded bg-zinc-600/50" />
                        <div className="mt-4 space-y-2">
                          <div className="h-12 rounded-lg bg-zinc-600/30" />
                          <div className="h-12 rounded-lg bg-zinc-600/30" />
                          <div className="h-12 rounded-lg bg-zinc-600/30" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-base font-semibold text-emerald-600">Everything You Need</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
              One system. Zero spreadsheets.
            </p>
            <p className="mt-4 text-lg text-zinc-600">
              Replace your patchwork of tools with one unified platform built for how dealers actually work.
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-5xl">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="group relative rounded-2xl bg-white p-8 shadow-sm ring-1 ring-zinc-200 transition-all hover:shadow-lg hover:ring-zinc-300"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-100">
                    {feature.icon}
                  </div>
                  <h3 className="mt-6 text-lg font-semibold text-zinc-900">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-600">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="bg-zinc-50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-base font-semibold text-emerald-600">Simple Workflow</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
              From VIN to sold in three steps
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-4xl">
            <div className="grid gap-8 md:grid-cols-3">
              {steps.map((step, index) => (
                <div key={index} className="relative text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-2xl font-bold text-emerald-600 shadow-lg ring-1 ring-zinc-200">
                    {step.number}
                  </div>
                  <h3 className="mt-6 text-lg font-semibold text-zinc-900">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm text-zinc-600">
                    {step.description}
                  </p>
                  {index < steps.length - 1 && (
                    <div className="absolute top-8 left-[calc(50%+3rem)] hidden h-0.5 w-[calc(100%-6rem)] bg-gradient-to-r from-emerald-200 to-emerald-100 md:block" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-base font-semibold text-emerald-600">Simple Pricing</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
              One plan. Everything included.
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-lg">
            <div className="rounded-3xl bg-white p-8 shadow-xl ring-1 ring-zinc-200 sm:p-10">
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-5xl font-bold text-zinc-900">$39</span>
                <span className="text-lg text-zinc-500">/month CAD</span>
              </div>

              <p className="mt-4 text-center text-zinc-600">
                Everything you need to run your dealership from your phone.
              </p>

              <ul className="mt-8 space-y-4">
                {[
                  "Unlimited vehicles",
                  "VIN decode & market data",
                  "Per-vehicle cost tracking",
                  "Photo management",
                  "Public dealer page",
                  "Bill of Sale generation",
                  "Lead inbox",
                  "Priority support",
                ].map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-zinc-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/signup"
                className="mt-8 block w-full rounded-full bg-zinc-900 py-4 text-center text-base font-semibold text-white shadow-lg transition-all hover:bg-zinc-800 hover:shadow-xl"
              >
                Start 14-Day Free Trial
              </Link>

              <p className="mt-4 text-center text-sm text-zinc-500">
                No credit card required
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="bg-zinc-900 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to modernize your dealership?
            </h2>
            <p className="mt-4 text-lg text-zinc-400">
              Join dealers across Canada who are running smarter, faster, and more profitable operations.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-8 py-4 text-base font-semibold text-white shadow-lg transition-all hover:bg-emerald-400"
              >
                Start Free Trial
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
