import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized. Admin role required." }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const countOnly = searchParams.get("countOnly") === "true";

    const where = {
      status: "approved" as const,
      bannerStatus: "pending" as const,
    };

    if (countOnly) {
      const count = await prisma.business.count({ where });
      return NextResponse.json({ count });
    }

    const businesses = await prisma.business.findMany({
      where,
      orderBy: { bannerSubmittedAt: "desc" },
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
        owner: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    });

    return NextResponse.json(businesses);
  } catch (error: any) {
    console.error("Failed to fetch pending banners:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch pending banners" },
      { status: 500 }
    );
  }
}
