import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/locations - Fetch active locations ordered by sortOrder
export async function GET() {
  try {
    const locations = await prisma.location.findMany({
      where: { status: "active" },
      orderBy: [
        { sortOrder: "asc" },
        { name: "asc" },
      ] as any,
      select: {
        id: true,
        name: true,
        slug: true,
        parentId: true,
        sortOrder: true,
        latitude: true,
        longitude: true,
      },
    });

    return NextResponse.json(locations);
  } catch (error: any) {
    console.error("Failed to fetch locations:", error);
    return NextResponse.json(
      { error: "Failed to fetch locations" },
      { status: 500 }
    );
  }
}
