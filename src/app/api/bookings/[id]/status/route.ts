import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { getDealerIdForUser } from "@/lib/dealer-profile";
import { updateBookingStatus, type BookingStatus } from "@/lib/bookings";

export async function PATCH(
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

  const { id: bookingId } = await params;

  try {
    const body = await request.json();
    const { status } = body;

    const validStatuses: BookingStatus[] = ["new", "handled", "archived"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    await updateBookingStatus({
      bookingId,
      dealerId,
      status,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update booking status:", error);
    return NextResponse.json(
      { error: "Failed to update status" },
      { status: 500 }
    );
  }
}
