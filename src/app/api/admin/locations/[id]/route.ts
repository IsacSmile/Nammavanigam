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

  const locationId = Number(params.id);
  if (isNaN(locationId)) {
    return NextResponse.json({ error: "Invalid location ID" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { name, slug, parentId, latitude, longitude, status, sortOrder } = body;

    if (parentId && Number(parentId) === locationId) {
      return NextResponse.json({ error: "Location cannot be its own parent." }, { status: 400 });
    }

    const finalSlug = slug && slug.trim() ? generateSlug(slug) : generateSlug(name);

    if (finalSlug) {
      const existing = await prisma.location.findFirst({
        where: {
          slug: finalSlug,
          NOT: { id: locationId },
        },
      });
      if (existing) {
        return NextResponse.json({ error: `Slug '${finalSlug}' is already taken by another location.` }, { status: 400 });
      }
    }

    const updatedLocation = await prisma.location.update({
      where: { id: locationId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(finalSlug !== undefined && { slug: finalSlug }),
        ...(parentId !== undefined && { parentId: parentId ? Number(parentId) : null }),
        ...(latitude !== undefined && { latitude: latitude !== null && latitude !== "" ? Number(latitude) : null }),
        ...(longitude !== undefined && { longitude: longitude !== null && longitude !== "" ? Number(longitude) : null }),
        ...(status !== undefined && { status }),
        ...(sortOrder !== undefined && { sortOrder: Number(sortOrder) }),
      },
    });

    return NextResponse.json(updatedLocation);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update location" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized. Admin role required." }, { status: 403 });
  }

  const locationId = Number(params.id);
  if (isNaN(locationId)) {
    return NextResponse.json({ error: "Invalid location ID" }, { status: 400 });
  }

  try {
    await prisma.location.updateMany({
      where: { parentId: locationId },
      data: { parentId: null },
    });

    await prisma.location.delete({
      where: { id: locationId },
    });

    return NextResponse.json({ success: true, id: locationId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete location" }, { status: 500 });
  }
}
