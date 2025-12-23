type Brand = {
  productName: string;
  tagline: string;
  supportEmail: string;
  appUrl: string;
  companyLegalName?: string;
};

export const brand: Brand = {
  productName: process.env.NEXT_PUBLIC_PRODUCT_NAME ?? "DealerOS",
  tagline: "Your dealership, organized — in your pocket.",
  supportEmail:
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@dealeros.local",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  companyLegalName:
    process.env.NEXT_PUBLIC_COMPANY_LEGAL_NAME ?? "DealerOS Inc.",
};

export function getBrand(): Brand {
  return brand;
}
