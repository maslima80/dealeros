import PDFDocument from "pdfkit";

import type { VehicleSale } from "./sales";
import { formatPriceCents, formatSaleDate, getVehicleTitle } from "./sales";

type DealerInfo = {
  displayName: string | null;
  addressLine: string | null;
  city: string | null;
  province: string | null;
  postalCode: string | null;
  phone: string | null;
  email: string | null;
};

export async function generateBillOfSalePdf(
  sale: VehicleSale,
  dealer: DealerInfo
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "LETTER",
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width - 100;

    doc.fontSize(20).font("Helvetica-Bold").text("BILL OF SALE", { align: "center" });
    doc.moveDown(0.5);

    if (dealer.displayName) {
      doc.fontSize(14).font("Helvetica-Bold").text(dealer.displayName, { align: "center" });
    }

    const addressParts = [dealer.addressLine, dealer.city, dealer.province, dealer.postalCode]
      .filter(Boolean)
      .join(", ");
    if (addressParts) {
      doc.fontSize(10).font("Helvetica").text(addressParts, { align: "center" });
    }

    const contactParts = [dealer.phone, dealer.email].filter(Boolean).join(" | ");
    if (contactParts) {
      doc.fontSize(10).font("Helvetica").text(contactParts, { align: "center" });
    }

    doc.moveDown(1.5);

    doc
      .moveTo(50, doc.y)
      .lineTo(50 + pageWidth, doc.y)
      .stroke();
    doc.moveDown(1);

    doc.fontSize(12).font("Helvetica-Bold").text("VEHICLE INFORMATION");
    doc.moveDown(0.5);

    const vehicleTitle = getVehicleTitle(sale);
    doc.fontSize(10).font("Helvetica");

    const vehicleFields = [
      { label: "Vehicle", value: vehicleTitle },
      { label: "VIN", value: sale.vin },
    ];

    if (sale.year) vehicleFields.push({ label: "Year", value: String(sale.year) });
    if (sale.make) vehicleFields.push({ label: "Make", value: sale.make });
    if (sale.model) vehicleFields.push({ label: "Model", value: sale.model });
    if (sale.trim) vehicleFields.push({ label: "Trim", value: sale.trim });
    if (sale.odometer !== null) {
      vehicleFields.push({ label: "Odometer", value: `${sale.odometer.toLocaleString()} km` });
    }

    vehicleFields.forEach(({ label, value }) => {
      doc.font("Helvetica-Bold").text(`${label}: `, { continued: true });
      doc.font("Helvetica").text(value);
    });

    doc.moveDown(1);

    doc.fontSize(12).font("Helvetica-Bold").text("BUYER INFORMATION");
    doc.moveDown(0.5);

    doc.fontSize(10).font("Helvetica");

    const buyerFields = [{ label: "Name", value: sale.buyerFullName }];
    if (sale.buyerPhone) buyerFields.push({ label: "Phone", value: sale.buyerPhone });
    if (sale.buyerEmail) buyerFields.push({ label: "Email", value: sale.buyerEmail });
    if (sale.buyerAddress) buyerFields.push({ label: "Address", value: sale.buyerAddress });

    buyerFields.forEach(({ label, value }) => {
      doc.font("Helvetica-Bold").text(`${label}: `, { continued: true });
      doc.font("Helvetica").text(value);
    });

    doc.moveDown(1);

    doc.fontSize(12).font("Helvetica-Bold").text("SALE DETAILS");
    doc.moveDown(0.5);

    doc.fontSize(10).font("Helvetica");

    doc.font("Helvetica-Bold").text("Sale Date: ", { continued: true });
    doc.font("Helvetica").text(formatSaleDate(sale.saleDate));

    doc.font("Helvetica-Bold").text("Sale Price: ", { continued: true });
    doc.font("Helvetica").text(`${formatPriceCents(sale.salePriceCents)} ${sale.currency}`);

    if (sale.asIs) {
      doc.moveDown(0.5);
      doc.font("Helvetica-Bold").text("SOLD AS-IS", { underline: true });
      doc
        .font("Helvetica")
        .fontSize(9)
        .text(
          "This vehicle is sold in its current condition with no warranties expressed or implied."
        );
    }

    if (sale.notes) {
      doc.moveDown(0.5);
      doc.fontSize(10).font("Helvetica-Bold").text("Notes: ");
      doc.font("Helvetica").text(sale.notes);
    }

    doc.moveDown(2);

    doc
      .moveTo(50, doc.y)
      .lineTo(50 + pageWidth, doc.y)
      .stroke();
    doc.moveDown(1);

    doc.fontSize(12).font("Helvetica-Bold").text("SIGNATURES");
    doc.moveDown(1);

    const signatureWidth = (pageWidth - 40) / 2;

    const signatureY = doc.y;

    doc.fontSize(10).font("Helvetica");

    doc.text("_".repeat(35), 50, signatureY);
    doc.text("Seller / Dealer Representative", 50, signatureY + 15);
    doc.text("Date: ________________", 50, signatureY + 35);

    doc.text("_".repeat(35), 50 + signatureWidth + 40, signatureY);
    doc.text("Buyer", 50 + signatureWidth + 40, signatureY + 15);
    doc.text("Date: ________________", 50 + signatureWidth + 40, signatureY + 35);

    doc.moveDown(5);

    doc
      .moveTo(50, doc.y)
      .lineTo(50 + pageWidth, doc.y)
      .stroke();
    doc.moveDown(0.5);

    doc
      .fontSize(8)
      .font("Helvetica-Oblique")
      .fillColor("#666666")
      .text(
        "This document is provided for convenience. Please verify requirements for your province.",
        { align: "center" }
      );

    doc.end();
  });
}
