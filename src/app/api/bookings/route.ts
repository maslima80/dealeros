import { NextRequest, NextResponse } from "next/server";

import { createBookingRequest } from "@/lib/bookings";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      vehicleId,
      dealerId,
      customerName,
      customerPhone,
      customerEmail,
      preferredTime,
      message,
    } = body;

    if (!vehicleId || !dealerId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const result = await createBookingRequest({
      dealerId,
      vehicleId,
      customerName,
      customerPhone,
      customerEmail,
      preferredTime,
      message,
      source: "public_vehicle_page",
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, id: result.id });
  } catch (error) {
    console.error("Booking creation error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
