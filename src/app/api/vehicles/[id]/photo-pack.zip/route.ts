import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import JSZip from "jszip";

import { getDealerIdForUser } from "@/lib/dealer-profile";
import { getOrderedVehiclePhotos } from "@/lib/listing-kit";
import { getVehicleById } from "@/lib/vehicles";

const MAX_PHOTOS = 30;

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

  const vehicle = await getVehicleById({ vehicleId, dealerId });
  if (!vehicle) {
    return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
  }

  const photos = await getOrderedVehiclePhotos({ vehicleId, dealerId });

  if (photos.length === 0) {
    return NextResponse.json({ error: "No photos available" }, { status: 400 });
  }

  const photosToInclude = photos.slice(0, MAX_PHOTOS);

  const zip = new JSZip();

  const downloadPromises = photosToInclude.map(async (photo, index) => {
    try {
      const response = await fetch(photo.url);
      if (!response.ok) {
        console.error(`Failed to fetch photo: ${photo.url}`);
        return null;
      }

      const contentType = response.headers.get("content-type") || "";
      let extension = ".jpg";
      if (contentType.includes("png")) {
        extension = ".png";
      } else if (contentType.includes("webp")) {
        extension = ".webp";
      } else if (contentType.includes("gif")) {
        extension = ".gif";
      }

      const buffer = await response.arrayBuffer();

      const paddedIndex = String(index + 1).padStart(2, "0");
      const filename = photo.isCover && index === 0
        ? `${paddedIndex}-cover${extension}`
        : `${paddedIndex}${extension}`;

      return { filename, buffer };
    } catch (error) {
      console.error(`Error downloading photo: ${photo.url}`, error);
      return null;
    }
  });

  const results = await Promise.all(downloadPromises);

  for (const result of results) {
    if (result) {
      zip.file(result.filename, result.buffer);
    }
  }

  const zipBuffer = await zip.generateAsync({
    type: "arraybuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  const ymmt = [vehicle.year, vehicle.make, vehicle.model, vehicle.trim]
    .filter(Boolean)
    .join("-")
    .replace(/\s+/g, "-")
    .toLowerCase();

  const filename = ymmt
    ? `${ymmt}-photos.zip`
    : `vehicle-${vehicleId.slice(0, 8)}-photos.zip`;

  return new NextResponse(zipBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
