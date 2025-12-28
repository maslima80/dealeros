import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { getDealerIdForUser } from "@/lib/dealer-profile";
import { getSaleByVehicleId, getDealerForSale, updateSalePdfUrl } from "@/lib/sales";
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
    const sale = await getSaleByVehicleId({ vehicleId, dealerId });

    if (!sale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

    const dealer = await getDealerForSale(dealerId);

    if (!dealer) {
      return NextResponse.json({ error: "Dealer not found" }, { status: 404 });
    }

    const pdfBuffer = await generateBillOfSalePdf(sale, {
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
      saleId: sale.id,
      dealerId,
      pdfUrl: pdfDataUrl,
    });

    return NextResponse.json({
      success: true,
      pdfUrl: pdfDataUrl,
    });
  } catch (error) {
    console.error("Regenerate PDF error:", error);
    return NextResponse.json(
      { error: "Failed to regenerate PDF" },
      { status: 500 }
    );
  }
}
