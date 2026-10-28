import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/auth";

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized. Admin role required." }, { status: 403 });
  }

  try {
    const locations = await prisma.location.findMany({
      orderBy: [
        { sortOrder: "asc" },
        { id: "asc" },
      ],
      include: {
        parent: true,
        _count: {
          select: { children: true, businesses: true },
        },
      },
    });

    return NextResponse.json(locations);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch locations" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized. Admin role required." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, slug, parentId, latitude, longitude, status, sortOrder } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const finalSlug = slug && slug.trim() ? generateSlug(slug) : generateSlug(name);

    // Check slug uniqueness
    const existing = await prisma.location.findUnique({
      where: { slug: finalSlug },
    });
    if (existing) {
      return NextResponse.json({ error: `Location slug '${finalSlug}' already exists.` }, { status: 400 });
    }

    let finalSortOrder = typeof sortOrder === "number" ? sortOrder : 0;
    if (sortOrder === undefined || sortOrder === null) {
      const maxLoc = await prisma.location.findFirst({
        orderBy: { sortOrder: "desc" },
      });
      finalSortOrder = maxLoc ? maxLoc.sortOrder + 1 : 1;
    }

    const location = await prisma.location.create({
      data: {
        name: name.trim(),
        slug: finalSlug,
        parentId: parentId ? Number(parentId) : null,
        latitude: latitude !== undefined && latitude !== null && latitude !== "" ? Number(latitude) : null,
        longitude: longitude !== undefined && longitude !== null && longitude !== "" ? Number(longitude) : null,
        status: status || "active",
        sortOrder: finalSortOrder,
      },
    });

    return NextResponse.json(location, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create location" }, { status: 500 });
  }
}
