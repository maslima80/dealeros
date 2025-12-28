import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { getDealerIdForUser } from "@/lib/dealer-profile";
import { finalizeSale, getSaleByVehicleId, getDealerForSale, updateSalePdfUrl } from "@/lib/sales";
import { generateBillOfSalePdf } from "@/lib/bill-of-sale-pdf";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dealerId = await getDealerIdForUser(userId);
  if (!dealerId) {
    return NextResponse.json({ error: "No dealer found" }, { status: 403 });
  }

  const { id: vehicleId } = await params;

  try {
    const body = await request.json();

    const {
      saleDate,
      salePriceCents,
      odometer,
      asIs,
      notes,
      buyerFullName,
      buyerPhone,
      buyerEmail,
      buyerAddress,
    } = body;

    const result = await finalizeSale({
      dealerId,
      vehicleId,
      saleDate,
      salePriceCents,
      odometer,
      asIs,
      notes,
      buyerFullName,
      buyerPhone,
      buyerEmail,
      buyerAddress,
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const dealer = await getDealerForSale(dealerId);

    if (dealer) {
      try {
        const pdfBuffer = await generateBillOfSalePdf(result.sale, {
          displayName: dealer.displayName,
          addressLine: dealer.addressLine,
          city: dealer.city,
          province: dealer.province,
          postalCode: dealer.postalCode,
          phone: dealer.phone,
          email: dealer.email,
        });

        const base64Pdf = pdfBuffer.toString("base64");
        const pdfDataUrl = `data:application/pdf;base64,${base64Pdf}`;

        await updateSalePdfUrl({
          saleId: result.sale.id,
          dealerId,
          pdfUrl: pdfDataUrl,
        });

        return NextResponse.json({
          success: true,
          sale: { ...result.sale, pdfUrl: pdfDataUrl },
        });
      } catch (pdfError) {
        console.error("PDF generation error:", pdfError);
        return NextResponse.json({
          success: true,
          sale: result.sale,
          warning: "Sale recorded but PDF generation failed",
        });
      }
    }

    return NextResponse.json({ success: true, sale: result.sale });
  } catch (error) {
    console.error("Finalize sale error:", error);
    return NextResponse.json(
      { error: "Failed to finalize sale" },
      { status: 500 }
    );
  }
}
