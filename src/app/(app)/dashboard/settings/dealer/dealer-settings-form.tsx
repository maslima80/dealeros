"use client";

import { useEffect, useMemo, useState, useTransition } from "react";

import { brand } from "@/config/brand";
import { isValidSlug, slugifyDisplayName } from "@/lib/slug";

import { checkDealerSlugAvailability, saveDealerProfile } from "./actions";

type DealerSettingsFormProps = {
  initialValues: {
    displayName: string;
    slug: string;
    phone: string;
    email: string;
    addressLine: string;
    city: string;
    province: string;
    postalCode: string;
  };
};

export function DealerSettingsForm({ initialValues }: DealerSettingsFormProps) {
  const [displayName, setDisplayName] = useState(initialValues.displayName);
  const [slug, setSlug] = useState(initialValues.slug);
  const [phone, setPhone] = useState(initialValues.phone);
  const [email, setEmail] = useState(initialValues.email);
  const [addressLine, setAddressLine] = useState(initialValues.addressLine);
  const [city, setCity] = useState(initialValues.city);
  const [province, setProvince] = useState(initialValues.province);
  const [postalCode, setPostalCode] = useState(initialValues.postalCode);

  const [slugTouched, setSlugTouched] = useState(false);
  const [fieldError, setFieldError] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const normalizedSlug = useMemo(() => slug.trim().toLowerCase(), [slug]);
  const publicUrl = useMemo(() => {
    const base = brand.appUrl.replace(/\/$/, "");
    return normalizedSlug ? `${base}/${normalizedSlug}` : base;
  }, [normalizedSlug]);

  useEffect(() => {
    if (slugTouched) return;
    const next = slugifyDisplayName(displayName);
    setSlug(next);
  }, [displayName, slugTouched]);

  async function validateSlugUniqueness(nextSlug: string) {
    const s = nextSlug.trim().toLowerCase();
    if (!s) return;
    if (!isValidSlug(s)) return;

    const res = await checkDealerSlugAvailability({ slug: s });
    if ("error" in res) {
      setFieldError((prev) => ({ ...prev, slug: res.error }));
      return;
    }

    if (!res.available) {
      setFieldError((prev) => ({ ...prev, slug: "That slug is already taken." }));
    }
  }

  function onSave() {
    setStatus(null);
    setFieldError({});

    const name = displayName.trim();
    if (!name) {
      setFieldError((prev) => ({ ...prev, displayName: "Dealer display name is required" }));
      return;
    }

    const s = slug.trim().toLowerCase();
    if (!s) {
      setFieldError((prev) => ({ ...prev, slug: "Dealer slug is required" }));
      return;
    }

    if (!isValidSlug(s)) {
      setFieldError((prev) => ({
        ...prev,
        slug: "Slug must be lowercase and only contain letters, numbers, and hyphens",
      }));
      return;
    }

    startTransition(async () => {
      const res = await saveDealerProfile({
        displayName: name,
        slug: s,
        phone,
        email,
        addressLine,
        city,
        province,
        postalCode,
      });

      if (res.ok) {
        setStatus("Saved.");
        return;
      }

      if (res.field) {
        setFieldError((prev) => ({ ...prev, [res.field!]: res.message }));
      } else {
        setStatus(res.message);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <h1 className="text-xl font-semibold text-zinc-900">Dealer profile</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Set your public dealer identity. This will power your public dealer page.
        </p>

        <div className="mt-6 grid gap-4">
          <div className="grid gap-1">
            <label className="text-sm font-medium text-zinc-900">Dealer display name</label>
            <input
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value);
                setFieldError((prev) => ({ ...prev, displayName: "" }));
              }}
              className="h-10 rounded-md border border-zinc-200 px-3 text-sm"
              placeholder="e.g. Maple Auto Sales"
            />
            {fieldError.displayName ? (
              <p className="text-xs text-red-600">{fieldError.displayName}</p>
            ) : null}
          </div>

          <div className="grid gap-1">
            <label className="text-sm font-medium text-zinc-900">Dealer slug</label>
            <input
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                const next = e.target.value;
                setSlug(next);
                setFieldError((prev) => ({ ...prev, slug: "" }));
              }}
              onBlur={() => validateSlugUniqueness(slug)}
              className="h-10 rounded-md border border-zinc-200 px-3 text-sm"
              placeholder="e.g. maple-auto-sales"
            />
            {fieldError.slug ? (
              <p className="text-xs text-red-600">{fieldError.slug}</p>
            ) : (
              <p className="text-xs text-zinc-500">Only lowercase letters, numbers, and hyphens.</p>
            )}

            <div className="mt-2 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-700">
              Public URL: <span className="font-medium">{publicUrl}</span>
            </div>
          </div>

          <div className="grid gap-1">
            <label className="text-sm font-medium text-zinc-900">Phone (optional)</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-10 rounded-md border border-zinc-200 px-3 text-sm"
              placeholder="e.g. (416) 555-1234"
            />
          </div>

          <div className="grid gap-1">
            <label className="text-sm font-medium text-zinc-900">Email (optional)</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 rounded-md border border-zinc-200 px-3 text-sm"
              placeholder="e.g. sales@mapleauto.ca"
            />
          </div>

          <div className="grid gap-1">
            <label className="text-sm font-medium text-zinc-900">Address line (optional)</label>
            <input
              value={addressLine}
              onChange={(e) => setAddressLine(e.target.value)}
              className="h-10 rounded-md border border-zinc-200 px-3 text-sm"
              placeholder="e.g. 123 King St W"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-1">
              <label className="text-sm font-medium text-zinc-900">City (optional)</label>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="h-10 rounded-md border border-zinc-200 px-3 text-sm"
                placeholder="e.g. Toronto"
              />
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium text-zinc-900">Province (optional)</label>
              <input
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className="h-10 rounded-md border border-zinc-200 px-3 text-sm"
                placeholder="e.g. ON"
              />
            </div>
          </div>

          <div className="grid gap-1">
            <label className="text-sm font-medium text-zinc-900">Postal Code</label>
            <input
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value.toUpperCase())}
              className="h-10 w-32 rounded-md border border-zinc-200 px-3 text-sm"
              placeholder="e.g. M5V 1J1"
              maxLength={7}
            />
            <p className="text-xs text-zinc-500">
              Used for local market data in Market Snapshot
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={onSave}
            disabled={isPending}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            Save changes
          </button>
          {status ? <p className="text-sm text-zinc-700">{status}</p> : null}
        </div>
      </div>
    </div>
  );
}
