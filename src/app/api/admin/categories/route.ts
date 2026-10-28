import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/auth";

// Helper function to create URL-friendly slug
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
    const categories = await prisma.category.findMany({
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

    return NextResponse.json(categories);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized. Admin role required." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, slug, parentId, iconUrl, description, status, sortOrder } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const finalSlug = slug && slug.trim() ? generateSlug(slug) : generateSlug(name);

    // Check slug uniqueness
    const existing = await prisma.category.findUnique({
      where: { slug: finalSlug },
    });
    if (existing) {
      return NextResponse.json({ error: `Category slug '${finalSlug}' already exists.` }, { status: 400 });
    }

    // Default sortOrder to highest + 1 if not provided
    let finalSortOrder = typeof sortOrder === "number" ? sortOrder : 0;
    if (sortOrder === undefined || sortOrder === null) {
      const maxCat = await prisma.category.findFirst({
        orderBy: { sortOrder: "desc" },
      });
      finalSortOrder = maxCat ? maxCat.sortOrder + 1 : 1;
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        slug: finalSlug,
        parentId: parentId ? Number(parentId) : null,
        iconUrl: iconUrl ? iconUrl.trim() : null,
        description: description ? description.trim() : null,
        status: status || "active",
        sortOrder: finalSortOrder,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create category" }, { status: 500 });
  }
}
