import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const cleanQ = q.trim();

    if (!cleanQ || cleanQ.length < 2) {
      return NextResponse.json([]);
    }

    const [businesses, categories] = await Promise.all([
      prisma.business.findMany({
        where: {
          status: "approved",
          name: {
            contains: cleanQ,
            mode: "insensitive",
          },
        },
        take: 6,
        orderBy: [
          { featured: "desc" },
          { createdAt: "desc" },
        ],
        include: {
          category: { select: { name: true } },
          location: { select: { name: true } },
        },
      }),
      prisma.category.findMany({
        where: {
          status: "active",
          name: {
            contains: cleanQ,
            mode: "insensitive",
          },
        },
        take: 6,
        orderBy: { sortOrder: "asc" },
      }),
    ]);

    const businessResults = businesses.map((b: { id: number; name: string; slug: string; featured: boolean; category?: { name: string } | null; location?: { name: string } | null }) => ({
      type: "business" as const,
      id: b.id,
      name: b.name,
      slug: b.slug,
      categoryName: b.category?.name || null,
      locationName: b.location?.name || null,
      featured: b.featured,
    }));

    const categoryResults = categories.map((c: { id: number; name: string; slug: string }) => ({
      type: "category" as const,
      id: c.id,
      name: c.name,
      slug: c.slug,
      categoryName: null,
      locationName: null,
      featured: false,
    }));

    // Combine and limit total results to 6
    const combined = [...businessResults, ...categoryResults].slice(0, 6);

    return NextResponse.json(combined);
  } catch (error: any) {
    console.error("Search suggestions API error:", error);
    return NextResponse.json({ error: "Failed to fetch suggestions" }, { status: 500 });
  }
}
