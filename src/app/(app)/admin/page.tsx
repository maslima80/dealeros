import Link from "next/link";

export default function AdminHomePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-zinc-900">Admin</h1>
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <Link href="/admin/dealers" className="text-sm font-medium text-zinc-900 underline">
          Dealers
        </Link>
      </div>
    </div>
  );
}
