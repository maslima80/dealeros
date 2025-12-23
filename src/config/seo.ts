import type { Metadata } from "next";

import { brand } from "@/config/brand";

export const defaultSeo = {
  titleTemplate: `%s | ${brand.productName}`,
  defaultTitle: brand.productName,
  description:
    "Dealer operations, simplified. Manage your workflow, tasks, and customer follow-ups in one place.",
};

type BuildMetadataParams = {
  title?: string;
  description?: string;
};

export function buildMetadata(params: BuildMetadataParams = {}): Metadata {
  const title = params.title
    ? defaultSeo.titleTemplate.replace("%s", params.title)
    : defaultSeo.defaultTitle;

  const description = params.description ?? defaultSeo.description;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: brand.appUrl,
      siteName: brand.productName,
      type: "website",
    },
  };
}
