import { brand } from "@/config/brand";

export default function Home() {
  return (
    <section className="py-16">
      <div className="max-w-3xl">
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-900">
          {brand.productName}
        </h1>
        <p className="mt-4 text-lg leading-7 text-zinc-600">{brand.tagline}</p>

        <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-6">
          <p className="text-sm text-zinc-600">
            Landing placeholder. Next steps: authentication, dashboard layout,
            and core app flows.
          </p>
        </div>
      </div>
    </section>
  );
}
