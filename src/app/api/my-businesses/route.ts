import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();

  if (!user || !user.id) {
    return NextResponse.json(
      { error: "Unauthorized. Please log in." },
      { status: 401 }
    );
  }

  if (user.role !== "business_owner" && user.role !== "admin") {
    return NextResponse.json(
      { error: "Forbidden. Access restricted to business owners and admins." },
      { status: 403 }
    );
  }

  try {
    const ownerId = Number(user.id);

    const businesses = await prisma.business.findMany({
      where: { ownerId },
      orderBy: { createdAt: "desc" },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        location: {
          select: {
            id: true,
            name: true,
            slug: true,
            parent: { select: { id: true, name: true, slug: true } },
          },
        },
        businessPhotos: {
          orderBy: { sortOrder: "asc" },
        },
        businessServices: true,
        businessHours: true,
        businessPhones: {
          orderBy: { sortOrder: "asc" },
        },
        businessSocialLinks: {
          orderBy: { platform: "asc" },
        },
      },
    });

    return NextResponse.json(businesses);
  } catch (error: any) {
    console.error("Failed to fetch user businesses:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch user businesses" },
      { status: 500 }
    );
  }
}
