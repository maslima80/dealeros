import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { getDealerIdForUser } from "@/lib/dealer-profile";
import { generateListingPayload } from "@/lib/listing-kit";

export async function GET(
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

  const payload = await generateListingPayload({
    vehicleId,
    dealerId,
  });

  if (!payload) {
    return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
  }

  return NextResponse.json(payload);
}
