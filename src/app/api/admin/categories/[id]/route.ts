import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized. Admin role required." }, { status: 403 });
  }

  const categoryId = Number(params.id);
  if (isNaN(categoryId)) {
    return NextResponse.json({ error: "Invalid category ID" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { name, slug, parentId, iconUrl, description, status, sortOrder } = body;

    // Prevent setting parent to self
    if (parentId && Number(parentId) === categoryId) {
      return NextResponse.json({ error: "Category cannot be its own parent." }, { status: 400 });
    }

    const finalSlug = slug && slug.trim() ? generateSlug(slug) : generateSlug(name);

    // Check slug collision if slug changed
    if (finalSlug) {
      const existing = await prisma.category.findFirst({
        where: {
          slug: finalSlug,
          NOT: { id: categoryId },
        },
      });
      if (existing) {
        return NextResponse.json({ error: `Slug '${finalSlug}' is already taken by another category.` }, { status: 400 });
      }
    }

    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(finalSlug !== undefined && { slug: finalSlug }),
        ...(parentId !== undefined && { parentId: parentId ? Number(parentId) : null }),
        ...(iconUrl !== undefined && { iconUrl: iconUrl ? iconUrl.trim() : null }),
        ...(description !== undefined && { description: description ? description.trim() : null }),
        ...(status !== undefined && { status }),
        ...(sortOrder !== undefined && { sortOrder: Number(sortOrder) }),
      },
    });

    return NextResponse.json(updatedCategory);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update category" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized. Admin role required." }, { status: 403 });
  }

  const categoryId = Number(params.id);
  if (isNaN(categoryId)) {
    return NextResponse.json({ error: "Invalid category ID" }, { status: 400 });
  }

  try {
    // Check child dependencies or businesses associated
    const childCount = await prisma.category.count({ where: { parentId: categoryId } });
    if (childCount > 0) {
      // Re-assign child parent_id to null before deleting
      await prisma.category.updateMany({
        where: { parentId: categoryId },
        data: { parentId: null },
      });
    }

    await prisma.category.delete({
      where: { id: categoryId },
    });

    return NextResponse.json({ success: true, id: categoryId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete category" }, { status: 500 });
  }
}
